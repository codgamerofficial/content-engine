import type { ReelScriptOutput, TrendScoutOutput } from "@/types/agents";

const REEL_TEMPLATES: ReelScriptOutput[] = [
    {
        reel_goal: "reach",
        hook_0_to_2_seconds:
            "Camera slowly pans up from shoes to face in a dark parking garage. Text flashes: 'They said streetwear is dead...'",
        scene_breakdown: [
            "Scene 1 (0-2s): Low-angle shot of sneakers on concrete. Moody bass starts. Text: 'They said streetwear is dead...'",
            "Scene 2 (2-5s): Beat drops. Quick cuts showing outfit details — RIIQX logo on chest, oversized fit silhouette, sleeve detail. Each cut syncs to beat.",
            "Scene 3 (5-10s): Model walks forward in slow-mo, full outfit visible. Camera pulls back. Text: '...we just made it louder.' RIIQX logo card.",
            "Scene 4 (10-15s): End frame with product flat-lay on black surface. 'Shop the look — link in bio' with subtle price overlay.",
        ],
        on_screen_text: [
            "They said streetwear is dead...",
            "...we just made it louder.",
            "RIIQX — Wear the statement.",
            "₹1,299 | Link in bio",
        ],
        caption:
            "streetwear isn't a trend. it's a language.\n\nnew drop just hit different. the oversized silhouette tee that doesn't need an introduction.\n\ntap the link. wear the attitude. 🖤",
        hashtags: [
            "#RIIQX",
            "#Streetwear",
            "#StreetStyle",
            "#IndianStreetwear",
            "#OOTD",
            "#FitCheck",
            "#UrbanFashion",
            "#GenZFashion",
            "#DarkAesthetic",
            "#NewDrop",
        ],
        cta: "Link in bio → New drop just landed",
    },
    {
        reel_goal: "engagement",
        hook_0_to_2_seconds:
            "Split screen: Left side shows a plain white tee. Right side is black. Text: 'Pick a side.'",
        scene_breakdown: [
            "Scene 1 (0-2s): Split screen comparison. Left: basic plain tee. Right: RIIQX graphic tee. Text: 'Pick a side.'",
            "Scene 2 (2-6s): Camera zooms into the RIIQX side. Model puts on the tee with attitude. Quick styling montage — chains, watch, cap.",
            "Scene 3 (6-10s): Full outfit mirror check. Model nods approvingly. Text: 'Thought so.'",
            "Scene 4 (10-12s): Comment prompt overlay: 'Left or Right? Drop a 🖤 for RIIQX'",
        ],
        on_screen_text: [
            "Pick a side.",
            "Basic or Bold?",
            "Thought so. 🖤",
            "Drop a 🖤 if you chose right",
        ],
        caption:
            "there are two types of people.\n\nthe ones who blend in. and the ones who don't.\n\nwhich one are you? comment below 👇",
        hashtags: [
            "#RIIQX",
            "#BasicVsBold",
            "#StreetFashion",
            "#StyleChoice",
            "#IndianStreetStyle",
            "#FashionReels",
            "#OOTD",
            "#WearYourAttitude",
        ],
        cta: "Comment '🖤' if you chose the right side",
    },
    {
        reel_goal: "conversion",
        hook_0_to_2_seconds:
            "Close-up of hands unboxing a black package. Text: 'POV: Your RIIQX order just arrived'",
        scene_breakdown: [
            "Scene 1 (0-3s): Hands open a matte black box with RIIQX branding. ASMR-style audio. Camera is top-down.",
            "Scene 2 (3-6s): Pull out the tee/hoodie slowly. Show fabric texture close-up. Natural light highlights the quality.",
            "Scene 3 (6-10s): Quick transition to wearing the outfit. Mirror shot. Confident head nod.",
            "Scene 4 (10-15s): Product card with name, price, and 'Swipe up / Link in bio'. Customer review text overlay: '★★★★★ Best streetwear I own'",
        ],
        on_screen_text: [
            "POV: Your RIIQX order just arrived",
            "The quality is insane 🤯",
            "From box to drip in 10 seconds",
            "Shop now → Link in bio",
        ],
        caption:
            "unboxing hits different when it's RIIQX.\n\nthe fabric. the fit. the feeling.\n\nthis isn't just a tee — it's your next signature piece.\n\n→ tap link in bio to cop yours before it's gone",
        hashtags: [
            "#RIIQX",
            "#Unboxing",
            "#StreetWearUnboxing",
            "#NewInWardrobe",
            "#IndianFashion",
            "#QualityOverQuantity",
            "#ShopNow",
        ],
        cta: "Tap link in bio — limited stock on this drop",
    },
];

export async function runReelScript(
    trends?: TrendScoutOutput[]
): Promise<ReelScriptOutput> {
    // Pick reel template based on day rotation + trend alignment
    const dayIndex = new Date().getDay();
    const template = REEL_TEMPLATES[dayIndex % REEL_TEMPLATES.length];

    // If trends provided, enhance the caption with trend context
    if (trends && trends.length > 0) {
        return {
            ...template,
            caption:
                template.caption +
                `\n\ninspired by the '${trends[0].trend_name}' wave 🌊`,
        };
    }

    return template;
}
