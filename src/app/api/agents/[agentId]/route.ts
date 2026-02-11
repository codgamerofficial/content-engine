import { NextResponse } from "next/server";
import { runTrendScout } from "@/lib/agents/trend-scout";
import { runBrandIntel } from "@/lib/agents/brand-intel";
import { runReelScript } from "@/lib/agents/reel-script";
import { runCanvaPrompts } from "@/lib/agents/canva-prompts";
import { runContentStrategy } from "@/lib/agents/content-strategy";
import { runPerformance } from "@/lib/agents/performance";
import type { AgentId } from "@/types/agents";

export const dynamic = "force-dynamic";

const AGENT_MAP: Record<AgentId, () => Promise<unknown>> = {
    "trend-scout": runTrendScout,
    "brand-intel": runBrandIntel,
    "reel-script": () => runReelScript(),
    "canva-prompts": () => runCanvaPrompts(),
    "content-strategy": runContentStrategy,
    performance: runPerformance,
};

export async function POST(
    request: Request,
    { params }: { params: Promise<{ agentId: string }> }
) {
    try {
        const { agentId } = await params;
        const runner = AGENT_MAP[agentId as AgentId];

        if (!runner) {
            return NextResponse.json(
                { error: `Unknown agent: ${agentId}` },
                { status: 400 }
            );
        }

        const result = await runner();
        return NextResponse.json(result);
    } catch (error) {
        console.error("[AGENT_ERROR]", error);
        return NextResponse.json({ error: "Agent failed" }, { status: 500 });
    }
}
