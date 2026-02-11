
/**
 * Unified AI Client
 * Prioritizes: Local Ollama (Free) > Groq (Free Tier) > Gemini > Mock/Fallback
 * Includes retry logic with exponential backoff for API reliability
 */

import { localAIClient } from "./ai-client-local";

// Retry configuration
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000; // 1 second
const MAX_DELAY_MS = 10000; // 10 seconds max delay

// Error types that are retryable
const RETRYABLE_HTTP_STATUSES = [429, 500, 501, 502, 503, 504];

/**
 * Sleep utility for delays
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay with jitter
 */
function getExponentialDelay(attempt: number): number {
    const delay = Math.min(BASE_DELAY_MS * Math.pow(2, attempt), MAX_DELAY_MS);
    // Add jitter (random ±10%) to prevent thundering herd
    const jitter = delay * 0.1 * (Math.random() - 0.5) * 2;
    return Math.floor(delay + jitter);
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        // Check for common retryable error patterns
        if (message.includes('429') || message.includes('rate limit')) {
            return true;
        }
        if (message.includes('500') || message.includes('502') ||
            message.includes('503') || message.includes('504') ||
            message.includes('internal server error') ||
            message.includes('service unavailable') ||
            message.includes('gateway error')) {
            return true;
        }
        // Check for network errors
        if (message.includes('fetch') && (message.includes('failed') ||
            message.includes('network') || message.includes('timeout') ||
            message.includes('econnreset') || message.includes('econnrefused'))) {
            return true;
        }
    }
    return false;
}

/**
 * Retry a function with exponential backoff
 */
async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    providerName: string,
    maxRetries: number = MAX_RETRIES
): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            // Check if we should retry
            if (attempt < maxRetries && isRetryableError(error)) {
                const delay = getExponentialDelay(attempt);
                console.warn(
                    `[AI-Client] ${providerName} attempt ${attempt + 1}/${maxRetries + 1} failed: ${lastError.message}. ` +
                    `Retrying in ${Math.round(delay)}ms...`
                );
                await sleep(delay);
                continue;
            }

            // Non-retryable error or max retries reached
            throw lastError;
        }
    }

    throw lastError;
}

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export interface AIClientOptions {
    temperature?: number;
    json?: boolean;
    maxRetries?: number; // Allow overriding max retries per request
}

export class AIClient {
    constructor() { }

    private get groqKey(): string | undefined {
        return process.env.GROQ_API_KEY;
    }

    private get geminiKey(): string | undefined {
        return process.env.GEMINI_API_KEY;
    }

    /**
     * Generate text/JSON content with automatic retry
     * Priority: Local Ollama > Groq > Gemini
     */
    async generate(prompt: string, options: AIClientOptions = {}): Promise<string> {
        const maxRetries = options.maxRetries ?? MAX_RETRIES;

        // 1. Try Local Ollama (Free - Runs Locally)
        try {
            const ollamaStatus = await localAIClient.checkOllamaStatus();
            if (ollamaStatus) {
                return await localAIClient.groqGenerate(prompt, options);
            }
        } catch (error) {
            console.warn("[AI-Client] Ollama not available, trying Groq...", error);
        }

        // 2. Try Groq (Llama 3 - Free Tier)
        if (this.groqKey) {
            try {
                return await retryWithBackoff(
                    () => this.callGroq(prompt, options),
                    'Groq',
                    maxRetries
                );
            } catch (error) {
                console.warn("[AI-Client] Groq generation failed after retries, falling back to Gemini...", error);
            }
        }

        // 3. Try Gemini (Backup)
        if (this.geminiKey) {
            try {
                return await retryWithBackoff(
                    () => this.callGemini(prompt, options),
                    'Gemini',
                    maxRetries
                );
            } catch (error) {
                console.warn("[AI-Client] Gemini generation failed after retries", error);
            }
        }

        throw new Error("ALL_AI_SERVICES_FAILED");
    }

    /**
     * Call Groq API (OpenAI Compatible)
     */
    private async callGroq(prompt: string, options: AIClientOptions): Promise<string> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

        try {
            const response = await fetch(GROQ_API_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.groqKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile", // High performance Llama 3
                    messages: [
                        {
                            role: "system",
                            content: options.json
                                ? "You are a helpful AI assistant. Output ONLY valid JSON. Do not include markdown code blocks."
                                : "You are a helpful AI assistant."
                        },
                        { role: "user", content: prompt }
                    ],
                    temperature: options.temperature ?? 0.7,
                    response_format: options.json ? { type: "json_object" } : undefined
                }),
                signal: controller.signal,
            });
            clearTimeout(timeout);

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                const errorMessage = `Groq API Error: ${response.status} ${JSON.stringify(err)}`;

                // Log specific error types
                if (response.status === 429) {
                    console.warn("[AI-Client] Groq rate limit hit - will retry with backoff");
                } else if (response.status >= 500) {
                    console.warn(`[AI-Client] Groq server error ${response.status} - will retry with backoff`);
                }

                throw new Error(errorMessage);
            }

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content || "";

            if (!content) {
                console.warn("[AI-Client] Groq returned empty response");
            }

            return content;
        } catch (error) {
            clearTimeout(timeout);

            // Handle timeout specifically
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error("Groq API Timeout: Request exceeded 30s");
            }
            throw error;
        }
    }

    /**
     * Call Gemini API
     */
    private async callGemini(prompt: string, options: AIClientOptions): Promise<string> {
        const url = `${GEMINI_API_URL}?key=${this.geminiKey}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: options.temperature ?? 0.7,
                        responseMimeType: options.json ? "application/json" : "text/plain",
                    },
                }),
                signal: controller.signal,
            });
            clearTimeout(timeout);

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                const errorMessage = `Gemini API Error: ${response.status} ${JSON.stringify(err)}`;

                // Log specific error types
                if (response.status === 429) {
                    console.warn("[AI-Client] Gemini rate limit hit - will retry with backoff");
                } else if (response.status >= 500) {
                    console.warn(`[AI-Client] Gemini server error ${response.status} - will retry with backoff`);
                }

                throw new Error(errorMessage);
            }

            const data = await response.json();
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

            if (!content) {
                console.warn("[AI-Client] Gemini returned empty response");
            }

            return content;
        } catch (error) {
            clearTimeout(timeout);

            // Handle timeout specifically
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error("Gemini API Timeout: Request exceeded 30s");
            }
            throw error;
        }
    }
}

export const aiClient = new AIClient();
