
import fs from "fs";
import path from "path";
import { localAIClient } from "../src/lib/ai-client-local";

// Manually load .env.local
try {
    const envPath = path.join(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        content.split("\n").forEach(line => {
            const parts = line.split("=");
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join("=").trim();
                process.env[key] = value;
            }
        });
        console.log("Loaded .env.local");
    }
} catch (e) {
    console.error("Error loading .env.local", e);
}

async function verifyLocalAI() {
    console.log("\n🤖 Verifying Local AI Setup...");

    // 1. Check Ollama
    console.log("\nChecking Ollama Status...");
    const ollamaStatus = await localAIClient.checkOllamaStatus();
    console.log(ollamaStatus ? "✅ Ollama is running" : "❌ Ollama is NOT running (or unreachable)");

    // 2. Check Groq
    console.log("\nChecking Groq Configuration...");
    const groqStatus = localAIClient.checkGroqStatus();
    console.log(groqStatus ? "✅ GROQ_API_KEY is configured" : "❌ GROQ_API_KEY is missing");

    // 3. Test Text Generation (Groq)
    if (groqStatus) {
        console.log("\nTesting Groq Text Generation...");
        try {
            const text = await localAIClient.groqGenerate("Say hello in one word", { json: false });
            console.log(`✅ Groq Response: "${text}"`);
        } catch (error) {
            console.error("❌ Groq Generation Failed:", error instanceof Error ? error.message : error);
        }
    }

    // 4. Test TTS (Edge-TTS)
    console.log("\nTesting Edge-TTS...");
    try {
        const tts = await localAIClient.generateVoiceover("Testing voiceover system.");
        if (tts.audioBase64) {
            console.log("✅ Edge-TTS generated audio successfully (via local server)");
        } else {
            console.log("⚠️ Edge-TTS unavailable, falling back to text (Manual Recording mode)");
        }
    } catch (error) {
        console.error("error testing TTS:", error);
    }

    console.log("\nVerification Complete.");
}

verifyLocalAI();
