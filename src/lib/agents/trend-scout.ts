import type { TrendScoutOutput } from "@/types/agents";

const TREND_TEMPLATES: TrendScoutOutput[] = [
    {
        trend_name: "Silent Fit Check Walk",
        trend_summary:
            "Model walks toward the camera in slow-mo with no dialogue, just a beat drop revealing the full outfit. Text overlay shows brand name and product details. Works best in urban settings.",
        why_it_is_viral:
            "The mystery element hooks viewers. No speaking = universal appeal. The slow-motion reveal creates anticipation. Works across cultures and languages.",
        recommended_reel_format: "POV / Outfit Reveal",
        hook_style:
            "Open with a blurred or close-up shot of fabric/detail, then pull back to reveal the full fit",
        visual_style:
            "Dark moody lighting, urban backdrop (parking garage, rooftop, night street), high contrast, slow-mo transition at beat drop",
        virality_score_out_of_10: 9,
        how_riiqx_can_adapt:
            "Shoot a model in RIIQX oversized tee + cargo pants walking through a dimly lit urban setting. Use a trending lo-fi or bass-heavy track. Text overlay: 'When the fit speaks louder than words — RIIQX'. End frame: product link + price.",
        audio_vibe: "lofi",
    },
    {
        trend_name: "Get Ready With Me — Street Edition",
        trend_summary:
            "A fast-paced GRWM showing the transition from basic/home clothes to a complete streetwear look. Uses jump cuts synced to music beats.",
        why_it_is_viral:
            "Transformation content triggers dopamine. Relatability of getting ready + aspirational end result. Music sync makes it rewatchable.",
        recommended_reel_format: "GRWM / Transformation",
        hook_style:
            "Start in messy/basic clothes with text 'POV: you have 10 mins to look fire 🔥'",
        visual_style:
            "Split-screen or jump cuts, bedroom-to-mirror setup, warm indoor lighting transitioning to cool outdoor tones",
        virality_score_out_of_10: 8,
        how_riiqx_can_adapt:
            "Show someone in plain basics, then quick cuts synced to beats showing them putting on RIIQX pieces — hoodie, joggers, accessories. Final shot: mirror selfie with full RIIQX fit. Caption: 'Basic to RIIQX in 10 seconds.'",
        audio_vibe: "phonk",
    },
    {
        trend_name: "Outfit Rating POV",
        trend_summary:
            "Camera stays static while different outfits walk into frame. Each gets a rating overlay (text or emoji scale). The brand's outfit always gets the highest rating.",
        why_it_is_viral:
            "Interactive feel — viewers mentally rate along. Creates debate in comments. The ranking format is inherently engaging and shareable.",
        recommended_reel_format: "POV / Rating / Comparison",
        hook_style:
            "Text on screen: 'Rating outfits from 1-10... wait for the last one 😳'",
        visual_style:
            "Clean white or concrete backdrop, consistent framing, bold rating text overlay, final outfit gets special effects (glow, slow-mo)",
        virality_score_out_of_10: 8,
        how_riiqx_can_adapt:
            "Show 3-4 generic outfits getting 5-7 ratings, then the RIIQX fit walks in and gets a 10/10 with a dramatic beat drop. End card: 'Cop the look — link in bio'. Drives both engagement (comments debating ratings) and traffic.",
        audio_vibe: "upbeat",
    },
];

export async function runTrendScout(): Promise<TrendScoutOutput[]> {
    // In production, this would call Gemini API to generate fresh trends
    // For now, return curated templates that rotate based on day
    const dayIndex = new Date().getDay();
    const trend1 = TREND_TEMPLATES[dayIndex % TREND_TEMPLATES.length];
    const trend2 =
        TREND_TEMPLATES[(dayIndex + 1) % TREND_TEMPLATES.length];
    return [trend1, trend2];
}
