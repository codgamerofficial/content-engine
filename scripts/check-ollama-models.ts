
async function checkModels() {
    try {
        const response = await fetch("http://localhost:11434/api/tags");
        if (!response.ok) {
            console.error("❌ Failed to fetch models:", response.status);
            return;
        }
        const data = await response.json();
        const models = data.models || [];
        console.log("Installed Models:");
        models.forEach((m: any) => console.log(`- ${m.name}`));

        const hasLlava = models.some((m: any) => m.name.includes("llava:7b-v1.6"));
        if (hasLlava) {
            console.log("\n✅ Llava model found!");
        } else {
            console.error("\n❌ Llava model NOT found. Use 'ollama pull llava:7b-v1.6'");
        }
    } catch (error) {
        console.error("❌ Error checking models:", error);
    }
}

checkModels();
