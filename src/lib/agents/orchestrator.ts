import type { OrchestratorOutput } from "@/types/agents";
import { runTrendScout } from "./trend-scout";
import { runBrandIntel } from "./brand-intel";
import { runReelScript } from "./reel-script";
import { runCanvaPrompts } from "./canva-prompts";
import { runContentStrategy } from "./content-strategy";
import { runPerformance } from "./performance";
import { executeReelWorkflow } from "./reel-execution";

export async function runOrchestrator(): Promise<OrchestratorOutput> {
    // Step 1: Identify trends
    const trends = await runTrendScout();

    // Step 2: Analyze brand (runs in parallel with trends)
    const brandIntel = await runBrandIntel();

    // Step 3: Generate reel script (depends on trends)
    const reelScript = await runReelScript(undefined, trends);

    // Step 4: Generate design prompts (depends on reel script)
    const canvaPrompts = await runCanvaPrompts(reelScript);

    // Step 5: Content strategy
    const contentStrategy = await runContentStrategy();

    // Step 6: Performance analysis
    const performance = await runPerformance();

    // Step 7: EXECUTION — Generate & Post Reel
    // In a real system, this might be async/queued. Here we await it for the demo.
    // We auto-publish by default.
    // Pick the vibe from the first trend
    const audioVibe = trends[0]?.audio_vibe || "upbeat";
    // Use the hook from the script/trend
    const hookText = reelScript.hook_0_to_2_seconds;
    const execution = await executeReelWorkflow(undefined, true, audioVibe, hookText);

    return {
        generated_at: new Date().toISOString(),
        trends,
        brand_intel: brandIntel,
        reel_script: reelScript,
        canva_prompts: canvaPrompts,
        content_strategy: contentStrategy,
        performance,
        execution, // <--- New field
    };
}
