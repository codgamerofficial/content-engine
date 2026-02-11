
import fs from "fs";
import path from "path";
// Adjust import to relative path from scripts/ to src/lib/
import { getAccountInfo } from "../src/lib/instagram";

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

async function verify() {
    console.log("Checking Instagram Connection...");
    console.log("Token present:", !!process.env.META_ACCESS_TOKEN);

    try {
        const info = await getAccountInfo();
        console.log("✅ Success! Connected to:", info.username);
        console.log("Account ID:", info.id);
    } catch (error) {
        console.error("❌ Failed Connection:", error instanceof Error ? error.message : error);
        if (process.env.META_ACCESS_TOKEN) {
            console.log("Token length:", process.env.META_ACCESS_TOKEN.length);
            console.log("Token start/end:", process.env.META_ACCESS_TOKEN.substring(0, 5) + "..." + process.env.META_ACCESS_TOKEN.substring(process.env.META_ACCESS_TOKEN.length - 5));
        }
    }
}

verify();
