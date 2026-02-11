import { NextResponse } from "next/server";
import { postSingleImage } from "@/lib/instagram";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { image_url, caption } = body;

        if (!image_url) {
            return NextResponse.json(
                { error: "image_url is required" },
                { status: 400 }
            );
        }

        const result = await postSingleImage(image_url, caption || "");
        return NextResponse.json(result);
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Unknown error";
        console.error("[INSTAGRAM_POST]", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
