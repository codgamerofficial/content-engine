import { NextResponse } from "next/server";
import { postReel } from "@/lib/instagram";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { video_url, caption, cover_url } = body;

        if (!video_url) {
            return NextResponse.json(
                { error: "video_url is required" },
                { status: 400 }
            );
        }

        const result = await postReel(video_url, caption || "", cover_url);
        return NextResponse.json(result);
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Unknown error";
        console.error("[INSTAGRAM_REEL]", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
