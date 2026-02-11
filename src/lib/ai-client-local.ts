/**
 * Local AI Client
 * Free, open-source AI models for Instagram reel generation
 * 
 * Providers:
 * - Ollama (Llava 1.5 7B) for image analysis
 * - Groq (Llama 3) for text generation
 * - Edge-TTS for text-to-speech
 */

import type { ReelScriptOutput, TrendScoutOutput } from "@/types/agents";

// ============================================================================
// Configuration
// ============================================================================

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const LLAVA_MODEL = "llava:7b-v1.6";

// Retry configuration (same as main client)
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

// ============================================================================
// Types
// ============================================================================

export interface ImageAnalysisResult {
    productDescription: string;
    keyFeatures: string[];
    suggestedStyle: string;
    mood: string;
    colors: string[];
}

export interface ScriptGenerationResult {
    hook: string;
    body: string;
    cta: string;
    hashtags: string[];
    onScreenText: string[];
    caption: string;
}

export interface LocalAIClientOptions {
    temperature?: number;
    json?: boolean;
}

// ============================================================================
// Utility Functions
// ============================================================================

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getExponentialDelay(attempt: number): number {
    const delay = Math.min(BASE_DELAY_MS * Math.pow(2, attempt), 10000);
    const jitter = delay * 0.1 * (Math.random() - 0.5) * 2;
    return Math.floor(delay + jitter);
}

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

            if (attempt < maxRetries && isRetryableError(error)) {
                const delay = getExponentialDelay(attempt);
                console.warn(`[LocalAI] ${providerName} attempt ${attempt + 1}/${maxRetries + 1} failed. Retrying in ${delay}ms...`);
                await sleep(delay);
                continue;
            }
            throw lastError;
        }
    }
    throw lastError;
}

function isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        return msg.includes("429") || msg.includes("rate limit") ||
            msg.includes("500") || msg.includes("502") || msg.includes("503") ||
            msg.includes("fetch") && (msg.includes("failed") || msg.includes("network"));
    }
    return false;
}

// ============================================================================
// Ollama Client (Image Analysis)
// ============================================================================

/**
 * Analyze product image using Llava 1.5 7B via Ollama
 */
export async function analyzeProductImage(
    imageBase64: string,
    productContext?: string
): Promise<ImageAnalysisResult> {
    return retryWithBackoff(async () => {
        const prompt = `Analyze this product image for creating an engaging Instagram Reel.
        
${productContext ? `Context: ${productContext}` : ""}

Please provide:
1. A brief product description
2. Key features to highlight (3-5 bullet points)
3. Suggested visual style/mood (e.g., edgy, premium, casual)
4. Dominant colors (list main colors)
5. Any text/branding visible

Format your response as JSON with these keys:
- productDescription (string)
- keyFeatures (array of strings)
- suggestedStyle (string)
- mood (string)
- colors (array of strings)

Only output valid JSON, no markdown.`;

        const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: LLAVA_MODEL,
                prompt: prompt,
                images: [imageBase64.replace(/^data:image\/[a-z]+;base64,/, "")], // Strip data URI prefix
                stream: false,
                format: "json",
                options: {
                    temperature: 0.5,
                    num_predict: 1000,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama API Error: ${response.status} ${await response.text()}`);
        }

        const data = await response.json();
        const content = data.response || data.text || "";

        // Parse JSON from response
        let parsed: Partial<ImageAnalysisResult>;
        try {
            // Try to extract JSON from response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0]);
            } else {
                parsed = JSON.parse(content);
            }
        } catch (parseError) {
            // Fallback: return raw text parsed
            console.warn("[LocalAI] Failed to parse Ollama JSON response:", content);
            return {
                productDescription: content.substring(0, 200),
                keyFeatures: [],
                suggestedStyle: "modern",
                mood: "neutral",
                colors: [],
            };
        }

        return {
            productDescription: parsed.productDescription || "Product analysis",
            keyFeatures: parsed.keyFeatures || [],
            suggestedStyle: parsed.suggestedStyle || "modern",
            mood: parsed.mood || "neutral",
            colors: parsed.colors || [],
        };
    }, "Ollama Llava");
}

/**
 * Generate reel script from product analysis using Llava
 */
export async function generateReelScriptFromImage(
    imageBase64: string,
    options: {
        goal?: "reach" | "engagement" | "conversion";
        productContext?: string;
        trends?: string[];
    } = {}
): Promise<ScriptGenerationResult> {
    const { goal = "reach", productContext, trends = [] } = options;

    return retryWithBackoff(async () => {
        const trendContext = trends.length > 0
            ? `\nCurrent trending topics: ${trends.join(", ")}`
            : "";

        const prompt = `You are an expert Instagram Reel creator. Create a 30-second reel script for this product.

Goal: ${goal === "reach" ? "Maximize views and reach" : goal === "engagement" ? "Drive comments and shares" : "Convert viewers to buyers"}${trendContext}

${productContext ? `Product Context: ${productContext}` : ""}

Create a viral Instagram Reel script with:

1. HOOK (0-3 seconds): Something that stops the scroll
2. BODY (3-25 seconds): Product showcase with value propositions
3. CTA (25-30 seconds): Clear call-to-action

Also provide:
- 5-8 trending hashtags
- On-screen text overlay suggestions
- A compelling caption with hooks

Format response as JSON:
{
  "hook": "...",
  "body": "...",
  "cta": "...",
  "hashtags": ["...", "..."],
  "onScreenText": ["...", "..."],
  "caption": "..."
}

Only output valid JSON, no markdown.`;

        const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: LLAVA_MODEL,
                prompt: prompt,
                images: [imageBase64.replace(/^data:image\/[a-z]+;base64,/, "")], // Strip data URI prefix
                stream: false,
                format: "json",
                options: {
                    temperature: 0.8,
                    num_predict: 1500,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama API Error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.response || data.text || "";

        // Parse JSON from response
        let parsed: Partial<ScriptGenerationResult>;
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0]);
            } else {
                parsed = JSON.parse(content);
            }
        } catch (parseError) {
            console.warn("[LocalAI] Failed to parse script JSON:", content);
            return generateFallbackScript(goal);
        }

        return {
            hook: parsed.hook || "Check out this product!",
            body: parsed.body || "Amazing features and quality.",
            cta: parsed.cta || "Link in bio!",
            hashtags: parsed.hashtags || ["#ProductReel", "#NewDrop", "#ShopNow"],
            onScreenText: parsed.onScreenText || [],
            caption: parsed.caption || "Amazing product!",
        };
    }, "Ollama Script Generation");
}

// ============================================================================
// Groq Client (Text Generation - Free Tier)
// ============================================================================

/**
 * Generate text using Groq API (Llama 3 - Free Tier)
 * Rate limits: 20 RPM, 10K tokens/day
 */
export async function groqGenerate(
    prompt: string,
    options: LocalAIClientOptions = {}
): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        console.warn("[LocalAI] GROQ_API_KEY not set, skipping Groq");
        throw new Error("GROQ_API_KEY not configured");
    }

    return retryWithBackoff(async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout for Groq

        try {
            const response = await fetch(GROQ_API_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: GROQ_MODEL,
                    messages: [
                        {
                            role: "system",
                            content: options.json
                                ? "You are a helpful AI. Output ONLY valid JSON."
                                : "You are a social media expert specializing in viral Instagram content."
                        },
                        { role: "user", content: prompt }
                    ],
                    temperature: options.temperature ?? 0.7,
                    max_tokens: 1024,
                }),
                signal: controller.signal,
            });
            clearTimeout(timeout);

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(`Groq API Error: ${response.status} ${JSON.stringify(err)}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || "";
        } catch (error) {
            clearTimeout(timeout);
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error("Groq API Timeout");
            }
            throw error;
        }
    }, "Groq Llama 3");
}

/**
 * Generate trending hashtags using Groq
 */
export async function generateHashtags(
    productInfo: string,
    style: string,
    trends?: string[]
): Promise<string[]> {
    const prompt = `Generate 10 Instagram hashtags for this product:

Product: ${productInfo}
Style: ${style}
${trends?.length ? `Trending now: ${trends.join(", ")}` : ""}

Mix of:
- 3 niche hashtags specific to product
- 4 medium hashtags (10K-100K posts)
- 3 viral hashtags (1M+ posts)

Return ONLY a JSON array of strings, no markdown.`;

    const result = await groqGenerate(prompt, { json: true, temperature: 0.5 });

    try {
        const parsed = JSON.parse(result);
        return Array.isArray(parsed) ? parsed : JSON.parse(result.replace(/[\s\S]*?\[/, "[").replace(/\][\s\S]*/, "]"));
    } catch {
        return ["#Product", "#ShopNow", "#NewDrop", "#Fashion", "#Style"];
    }
}

/**
 * Generate audio/music suggestions using Groq
 */
export async function generateAudioSuggestions(
    mood: string,
    duration: number = 30
): Promise<{ audio_type: string; suggestions: string[]; beat_tips: string[] }> {
    const prompt = `Suggest audio for a ${duration}-second ${mood} Instagram Reel.

Return JSON:
{
  "audio_type": "type of audio (trending song, original, etc)",
  "suggestions": ["3 specific audio suggestions with details"],
  "beat_tips": ["3 tips for syncing visuals to beat"]
}`;

    const result = await groqGenerate(prompt, { json: true, temperature: 0.6 });

    try {
        return JSON.parse(result);
    } catch {
        return {
            audio_type: "trending audio",
            suggestions: ["Use trending sounds in your niche", "Consider royalty-free options"],
            beat_tips: ["Sync cuts to downbeats", "Use jump cuts on beat drops"],
        };
    }
}

// ============================================================================
// Edge-TTS (Free Cloud TTS)
// ============================================================================

/**
 * Generate voiceover using Edge TTS (free, high quality)
 */
export async function generateVoiceover(
    text: string,
    options: {
        voice?: string;
        rate?: string;
        pitch?: string;
    } = {}
): Promise<{ audioUrl?: string; audioBase64?: string; text: string }> {
    const voice = options.voice || "en-US-GuyNeural"; // Male voice
    const rate = options.rate || "+0%";
    const pitch = options.pitch || "+0Hz";

    // Edge TTS endpoint (Microsoft's free TTS service)
    const ttsUrl = `https://${OLLAMA_HOST.replace("http://", "").replace("https://", "")}:8000/tts`;

    // Try local TTS server first, then fallback
    try {
        const response = await fetch(ttsUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, voice, rate, pitch }),
        });

        if (response.ok) {
            const audioBuffer = await response.arrayBuffer();
            const base64 = Buffer.from(audioBuffer).toString("base64");
            return {
                audioBase64: `data:audio/mp3;base64,${base64}`,
                text,
            };
        }
    } catch {
        // Local TTS not available, return text for manual recording
        console.warn("[LocalAI] Edge-TTS not available, using text fallback");
    }

    // Fallback: Return text for manual recording
    return { text, audioUrl: "MANUAL_RECORDING_REQUIRED" };
}

// ============================================================================
// Unified Local AI Client
// ============================================================================

export class LocalAIClient {
    private ollamaAvailable: boolean | null = null;
    private groqAvailable: boolean | null = null;

    /**
     * Check if Ollama is running
     */
    async checkOllamaStatus(): Promise<boolean> {
        if (this.ollamaAvailable !== null) {
            return this.ollamaAvailable;
        }
        try {
            const response = await fetch(`${OLLAMA_HOST}/api/tags`, {
                method: "GET",
                signal: AbortSignal.timeout(5000),
            });
            this.ollamaAvailable = response.ok;
            return this.ollamaAvailable;
        } catch {
            this.ollamaAvailable = false;
            return false;
        }
    }

    /**
     * Check if Groq API is configured
     */
    checkGroqStatus(): boolean {
        if (this.groqAvailable !== null) {
            return this.groqAvailable;
        }
        this.groqAvailable = !!process.env.GROQ_API_KEY;
        return this.groqAvailable;
    }

    /**
     * Generate complete reel content from product image
     */
    async generateReelContent(
        imageBase64: string,
        options: {
            goal?: "reach" | "engagement" | "conversion";
            productContext?: string;
            includeVoiceover?: boolean;
        } = {}
    ): Promise<{
        script: ScriptGenerationResult;
        imageAnalysis: ImageAnalysisResult;
        voiceover?: { audioUrl?: string; audioBase64?: string; text: string };
    }> {
        const { goal = "reach", productContext, includeVoiceover = false } = options;

        // Parallel: Analyze image and generate script
        const [imageAnalysis, script] = await Promise.all([
            this.analyzeProductImage(imageBase64, productContext),
            this.generateReelScriptFromImage(imageBase64, { goal, productContext }),
        ]);

        // Optionally generate voiceover
        let voiceover;
        if (includeVoiceover) {
            const voiceoverText = `${script.hook} ${script.body} ${script.cta}`;
            voiceover = await this.generateVoiceover(voiceoverText);
        }

        return { script, imageAnalysis, voiceover };
    }

    /**
     * Wrapper methods for convenience
     */
    async analyzeProductImage(imageBase64: string, productContext?: string): Promise<ImageAnalysisResult> {
        return analyzeProductImage(imageBase64, productContext);
    }

    async generateReelScriptFromImage(
        imageBase64: string,
        options: { goal?: "reach" | "engagement" | "conversion"; productContext?: string; trends?: string[] }
    ): Promise<ScriptGenerationResult> {
        return generateReelScriptFromImage(imageBase64, options);
    }

    async generateHashtags(productInfo: string, style: string, trends?: string[]): Promise<string[]> {
        return generateHashtags(productInfo, style, trends);
    }

    async generateAudioSuggestions(mood: string, duration?: number): Promise<{ audio_type: string; suggestions: string[]; beat_tips: string[] }> {
        return generateAudioSuggestions(mood, duration);
    }

    async generateVoiceover(text: string, options?: { voice?: string; rate?: string; pitch?: string }): Promise<{ audioUrl?: string; audioBase64?: string; text: string }> {
        return generateVoiceover(text, options);
    }

    async groqGenerate(prompt: string, options?: LocalAIClientOptions): Promise<string> {
        return groqGenerate(prompt, options);
    }
}

// ============================================================================
// Fallback Script Generator
// ============================================================================

function generateFallbackScript(goal: string): ScriptGenerationResult {
    const templates: Record<string, ScriptGenerationResult> = {
        reach: {
            hook: "Wait for this! 🖤",
            body: "This product is about to change everything. The quality, the style, the vibe — it's all there.",
            cta: "Follow for more drops like this!",
            hashtags: ["#Viral", "#Trending", "#NewDrop", "#MustHave", "#ShopNow", "#FashionTips", "#StyleInspo"],
            onScreenText: ["WAIT FOR THIS 🖤", "Game changer alert!", "Link in bio 👆"],
            caption: "wait for this drop 😮‍💨\n\nlink in bio 👆",
        },
        engagement: {
            hook: "Left or Right? Comment below! 👇",
            body: "Show side-by-side comparison. Let the product speak for itself.",
            cta: "Comment your choice below!",
            hashtags: ["#CommentBelow", "#VoteNow", "#LeftOrRight", "#FashionTips", "#StyleInspo"],
            onScreenText: ["LEFT OR RIGHT? 👈👉", "Comment below! 👇", "Which one you choosing?"],
            caption: "left or right? 👇\n\ndrop a comment!",
        },
        conversion: {
            hook: "Limited stock — tap the link before it's gone! 🔥",
            body: "Show product details, benefits, and social proof. Create urgency.",
            cta: "Shop now — link in bio!",
            hashtags: ["#LimitedStock", "#ShopNow", "#SaleOn", "#DontMissOut", "#Quick"],
            onScreenText: ["LIMITED STOCK 🔥", "Tap link in bio NOW!", "Only a few left!"],
            caption: "limited stock available 🔥\n\ntap link in bio before it's gone!\n\n hurry up! 🏃‍♂️",
        },
    };

    return templates[goal] || templates["reach"];
}

// ============================================================================
// Singleton Export
// ============================================================================

export const localAIClient = new LocalAIClient();
