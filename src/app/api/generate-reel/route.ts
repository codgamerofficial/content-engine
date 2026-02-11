import { NextResponse } from "next/server";
import { executeReelWorkflow } from "@/lib/agents/reel-execution";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // Up to 2 min for video generation + upload + posting

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { product_id, auto_publish = true } = body;

        const result = await executeReelWorkflow(product_id, auto_publish);

        return NextResponse.json(result);
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Reel generation failed";
        console.error("[GENERATE_REEL_ERROR]", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
