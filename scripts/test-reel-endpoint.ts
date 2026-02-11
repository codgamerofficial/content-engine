
import { generateFullReelContent } from "../src/lib/agents/reel-script";
import { localAIClient } from "../src/lib/ai-client-local";
import fs from "fs";
import path from "path";

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

async function testReelLibrary() {
    console.log("🎬 Testing generateFullReelContent directly...");

    // Create a minimal 1x1 white pixel base64 image (valid jpeg)
    const mockImage = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q==";

    try {
        // Run generation directly (bypassing API)
        const result = await generateFullReelContent(mockImage, {
            goal: "reach",
            includeVoiceover: true,
        });

        console.log("\n✅ Generation Result:");
        console.log("Script Hook:", result.script.hook_0_to_2_seconds);
        console.log("Analysis Desc:", result.imageAnalysis.description);
        console.log("Voiceover URL:", result.voiceover?.audioBase64 ? "Generated" : "None");

    } catch (error) {
        console.error("\n❌ Library Error:", error);
    }
}

testReelLibrary();
