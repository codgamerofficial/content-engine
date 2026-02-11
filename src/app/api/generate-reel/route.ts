import { NextResponse } from "next/server";
import { executeReelWorkflow } from "@/lib/agents/reel-execution";
import { generateFullReelContent } from "@/lib/agents/reel-script";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // Up to 2 min for video generation + upload + posting

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { product_id, auto_publish = true, imageBase64, goal } = body;

        // If imageBase64 provided, use AI to generate script directly from image
        if (imageBase64) {
            console.log("[GenerateReel] Using AI image analysis for script generation...");

            const result = await generateFullReelContent(imageBase64, {
                goal: goal || "reach",
                includeVoiceover: true,
            });

            return NextResponse.json({
                success: true,
                source: "ai-image-analysis",
                script: result.script,
                imageAnalysis: result.imageAnalysis,
                voiceover: result.voiceover,
                message: "AI-generated reel script from image analysis",
            });
        }

        // Otherwise, use the existing workflow with product_id
        const result = await executeReelWorkflow(product_id, auto_publish);

        return NextResponse.json({
            source: "template-based",
            ...result,
            success: true,
        });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Reel generation failed";
        console.error("[GENERATE_REEL_ERROR]", message);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
