import { NextResponse } from "next/server";
import { runAutoPost } from "@/lib/agents/auto-post";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow up to 60s for AI generation + posting

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            product_id,
            content_type = "image",
            auto_publish = true,
        } = body;

        const result = await runAutoPost(product_id, content_type, auto_publish);
        return NextResponse.json(result);
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Auto-post failed";
        console.error("[AUTO_POST_ERROR]", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
