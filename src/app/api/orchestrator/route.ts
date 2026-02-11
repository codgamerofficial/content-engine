import { NextResponse } from "next/server";
import { runOrchestrator } from "@/lib/agents/orchestrator";

export const dynamic = "force-dynamic";

export async function POST() {
    try {
        const result = await runOrchestrator();
        return NextResponse.json(result);
    } catch (error) {
        console.error("[ORCHESTRATOR_ERROR]", error);
        return NextResponse.json(
            { error: "Orchestrator failed" },
            { status: 500 }
        );
    }
}
