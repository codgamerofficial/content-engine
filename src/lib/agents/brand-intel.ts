import type { BrandIntelOutput } from "@/types/agents";

export async function runBrandIntel(): Promise<BrandIntelOutput> {
    return {
        brand_personality:
            "RIIQX is the brand for the unapologetically bold. It doesn't ask for attention — it commands it. Think of it as the intersection of street culture, minimalist design, and raw confidence. It's not luxury, it's not fast fashion — it's a statement. The brand speaks to those who dress for themselves, not for validation.",
        core_emotions_to_trigger: [
            "Confidence — 'I look like I know what I'm doing'",
            "Exclusivity — 'Not everyone gets this aesthetic'",
            "Identity — 'This brand IS me'",
            "Aspiration — 'I'm leveling up my style game'",
            "Rebellion — 'I don't follow trends, I set them'",
        ],
        visual_identity_rules: {
            colors:
                "Primary: Pure Black (#000), Off-White (#F5F5F0). Accents: Neon Green (#39FF14) for CTAs, Deep Grey (#1A1A1A) for backgrounds. Never use pastels or warm tones.",
            fonts:
                "Headlines: Bold condensed sans-serif (Oswald, Anton, or Bebas Neue). Body: Clean geometric sans (Inter, DM Sans). Never use serif or script fonts.",
            imagery_style:
                "High contrast, desaturated backgrounds with subject in focus. Urban environments only — concrete, steel, neon lights, graffiti walls. Models should look candid, never posed or smiling directly at camera. Clothing must be the hero of every shot.",
        },
        content_do_not_list: [
            "No bright/colorful flat-lay product shots — they kill the vibe",
            "No cheesy sales language ('Buy now!', 'Limited offer!', 'Don't miss out!')",
            "No stock photography or generic lifestyle imagery",
            "No influencer-dependent content that can't stand alone",
            "No memes that dilute the premium positioning",
            "No comparison posts putting down other brands",
            "No excessive use of emojis in captions (max 2-3)",
        ],
        product_story_angles: [
            "The origin story: Why RIIQX was created (rebellion against cookie-cutter fashion)",
            "Behind the fabric: Material quality and design process deep-dives",
            "Street stories: Real people wearing RIIQX in their daily urban life",
            "The fit decode: How to style one RIIQX piece 3 different ways",
            "Culture drops: Tying releases to cultural moments (music drops, festivals, seasons)",
        ],
        ideal_customer_mindset:
            "18-28 year old who scrolls Instagram 2+ hours daily. They discover brands through Reels, not ads. They value aesthetics over discounts. They screenshot fits for inspiration. They want to feel like they found something before it went mainstream. Price-conscious but will pay ₹999-₹1999 for something that looks ₹3000+. They care more about how clothes photograph than how they feel.",
    };
}
