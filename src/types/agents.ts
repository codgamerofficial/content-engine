// Agent 1 — Trend Scout
export interface TrendScoutOutput {
    trend_name: string;
    trend_summary: string;
    why_it_is_viral: string;
    recommended_reel_format: string;
    hook_style: string;
    visual_style: string;
    virality_score_out_of_10: number;
    how_riiqx_can_adapt: string;
    audio_vibe: "phonk" | "lofi" | "upbeat" | "cinematic";
}

// Agent 2 — Brand Intelligence
export interface BrandIntelOutput {
    brand_personality: string;
    core_emotions_to_trigger: string[];
    visual_identity_rules: {
        colors: string;
        fonts: string;
        imagery_style: string;
    };
    content_do_not_list: string[];
    product_story_angles: string[];
    ideal_customer_mindset: string;
}

// Agent 3 — Viral Reel Script
export interface ReelScriptOutput {
    reel_goal: "reach" | "engagement" | "conversion";
    hook_0_to_2_seconds: string;
    scene_breakdown: string[];
    on_screen_text: string[];
    caption: string;
    hashtags: string[];
    cta: string;
}

// Agent 4 — Canva Design Prompt
export interface CanvaPromptOutput {
    instagram_post_prompt: string;
    carousel_prompts: {
        slide_1: string;
        slide_2: string;
        slide_3: string;
        slide_4: string;
        slide_5: string;
    };
    reel_cover_prompt: string;
}

// Agent 5 — Content Strategy
export interface ContentStrategyOutput {
    weekly_posting_plan: {
        reels_per_week: string;
        posts_per_week: string;
        carousels_per_week: string;
    };
    best_posting_times_IST: string[];
    content_mix_strategy: string;
    growth_hacks: string[];
}

// Agent 6 — Performance & Learning
export interface PerformanceOutput {
    top_performing_content_patterns: string[];
    low_performing_patterns_to_avoid: string[];
    recommendations_for_next_7_days: string[];
    conversion_optimization_tips: string[];
}

// Orchestrator
export interface OrchestratorOutput {
    generated_at: string;
    trends: TrendScoutOutput[];
    brand_intel: BrandIntelOutput;
    reel_script: ReelScriptOutput;
    canva_prompts: CanvaPromptOutput;
    content_strategy: ContentStrategyOutput;
    performance: PerformanceOutput;
    execution?: import("../lib/agents/reel-execution").ReelExecutionResult;
}

export type AgentId =
    | "trend-scout"
    | "brand-intel"
    | "reel-script"
    | "canva-prompts"
    | "content-strategy"
    | "performance";

export type AgentOutput =
    | TrendScoutOutput
    | TrendScoutOutput[]
    | BrandIntelOutput
    | ReelScriptOutput
    | CanvaPromptOutput
    | ContentStrategyOutput
    | PerformanceOutput;
