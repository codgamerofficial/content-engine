import { NextResponse } from "next/server";
import { postCarousel } from "@/lib/instagram";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { image_urls, caption } = body;

        if (!image_urls || !Array.isArray(image_urls) || image_urls.length < 2) {
            return NextResponse.json(
                { error: "image_urls array (min 2) is required" },
                { status: 400 }
            );
        }

        if (image_urls.length > 10) {
            return NextResponse.json(
                { error: "Maximum 10 images per carousel" },
                { status: 400 }
            );
        }

        const result = await postCarousel(image_urls, caption || "");
        return NextResponse.json(result);
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Unknown error";
        console.error("[INSTAGRAM_CAROUSEL]", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
