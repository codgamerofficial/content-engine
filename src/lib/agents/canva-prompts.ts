import type { CanvaPromptOutput, ReelScriptOutput } from "@/types/agents";

export async function runCanvaPrompts(
    reelScript?: ReelScriptOutput
): Promise<CanvaPromptOutput> {
    const reelTheme = reelScript?.hook_0_to_2_seconds || "streetwear attitude";

    return {
        instagram_post_prompt:
            "Create a 1080x1080 square post. Background: pure black (#000000). Center a high-contrast product photo of a RIIQX oversized tee on a dark concrete surface. Lighting: single harsh spotlight from top-left creating dramatic shadows. Bottom-left corner: RIIQX logo in off-white (#F5F5F0), small and clean. Bottom-right: price '₹1,299' in condensed bold font (Bebas Neue). No borders, no decorative elements. The product should feel like it's floating in darkness. Mood: premium, minimal, editorial.",

        carousel_prompts: {
            slide_1:
                "Cover slide — 1080x1350 portrait. Solid black background. Large bold white text centered: 'WHY RIIQX?' in Oswald/Anton font. Below in smaller DM Sans: 'Swipe to find out →'. Subtle diagonal neon green (#39FF14) line accent in bottom corner. No imagery, pure typography.",

            slide_2:
                "Slide 2 — 1080x1350. Left half: close-up texture shot of premium cotton fabric in moody lighting. Right half: black background with white text: 'PREMIUM FABRIC' as headline, 'GSM 220+ heavyweight cotton that drapes, not clings.' in body text. Clean two-column layout.",

            slide_3:
                "Slide 3 — 1080x1350. Full-bleed photo of a model in RIIQX fit standing in front of a graffiti wall at night. Overlay text at bottom: 'DESIGNED FOR THE STREETS' in bold condensed font. Slight film grain filter. The image should feel candid, not posed.",

            slide_4:
                "Slide 4 — 1080x1350. Black background. Three outfit photos arranged vertically showing the same RIIQX tee styled 3 ways: with joggers, with cargo pants, with shorts. Each labeled '01', '02', '03'. Header: 'ONE TEE. THREE WAYS.' Small text below each: brief styling note.",

            slide_5:
                "Final slide — 1080x1350. Black background. Center text: 'YOUR NEXT SIGNATURE PIECE' in large bold font. Below: 'Shop now at riiqx.com' with a neon green (#39FF14) underline. RIIQX logo centered at bottom. CTA arrow pointing right. Clean, premium, action-oriented.",
        },

        reel_cover_prompt: `Create a 1080x1920 vertical Reel cover thumbnail. Dark moody background — blurred urban night scene (city lights bokeh). Center: a model silhouette wearing streetwear, backlit for dramatic effect. Bold text overlay at top: '${reelTheme.slice(0, 40).toUpperCase()}...' in white condensed font with slight glow. RIIQX logo small, bottom center in off-white. The overall feel should make someone STOP scrolling — mysterious, bold, intriguing.`,
    };
}
