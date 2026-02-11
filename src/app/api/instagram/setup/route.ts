import { NextResponse } from "next/server";
import { getAccountInfo } from "@/lib/instagram";

export const dynamic = "force-dynamic";

// GET — Verify Instagram connection
export async function GET() {
    try {
        const info = await getAccountInfo();
        return NextResponse.json({
            connected: true,
            ...info,
        });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { connected: false, error: message },
            { status: 200 } // Return 200 so frontend can handle gracefully
        );
    }
}
