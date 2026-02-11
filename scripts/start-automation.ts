import { exec } from "child_process";

const INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
const API_URL = "http://localhost:3000/api/orchestrator";

async function runOrchestrator() {
    console.log(`[${new Date().toISOString()}] Triggering Orchestrator...`);
    try {
        const response = await fetch(API_URL, {
            method: "POST",
        });

        if (response.ok) {
            const data = await response.json();
            console.log("Orchestrator Run Successful:", JSON.stringify(data, null, 2));
        } else {
            console.error("Orchestrator Failed:", response.status, response.statusText);
            const text = await response.text();
            console.error("Error Details:", text);
        }
    } catch (error) {
        console.error("Failed to connect to Orchestrator:", error);
    }
}

async function startLoop() {
    console.log("Starting 24/7 Automation Loop...");
    console.log(`Target: ${API_URL}`);
    console.log(`Interval: ${INTERVAL_MS / 1000 / 60} minutes`);

    // Run immediately on start
    await runOrchestrator();

    // Loop
    setInterval(runOrchestrator, INTERVAL_MS);
}

startLoop();
