
import fs from "fs";
import path from "path";
import { aiClient } from "../src/lib/ai-client";

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
    } else {
        console.warn(".env.local not found!");
    }
} catch (e) {
    console.error("Error loading .env.local", e);
}

async function testAI() {
    console.log("🤖 Testing Unified AI Client...");
    console.log(`GROQ_API_KEY present: ${!!process.env.GROQ_API_KEY}`);
    console.log(`GEMINI_API_KEY present: ${!!process.env.GEMINI_API_KEY}`);

    try {
        const result = await aiClient.generate("Say 'Hello from AI' in a cool way.", { json: false });
        console.log("\n✅ AI Response:");
        console.log(result);
    } catch (error) {
        console.error("\n❌ AI Generation Failed:", error);
    }
}

testAI();
