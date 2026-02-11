// AI Content Generator Agent
// Uses Gemini API to generate product-specific captions, carousels, and Reel scripts.
// Falls back to template-based generation if no API key.

import type { Product } from "@/lib/products";

// ─── Types ───────────────────────────────────────────────

export interface GeneratedPost {
    type: "image";
    caption: string;
    hashtags: string[];
    cta: string;
    imageUrl: string;
}

export interface GeneratedCarousel {
    type: "carousel";
    caption: string;
    hashtags: string[];
    cta: string;
    slides: { imageUrl: string; overlayText: string }[];
}

export interface GeneratedReelScript {
    type: "reel";
    hook: string;
    scenes: string[];
    caption: string;
    hashtags: string[];
    cta: string;
}

export type GeneratedContent =
    | GeneratedPost
    | GeneratedCarousel
    | GeneratedReelScript;

// ─── Gemini API ──────────────────────────────────────────

async function callGemini(prompt: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("NO_API_KEY");

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.9,
                    maxOutputTokens: 1500,
                    responseMimeType: "application/json",
                },
            }),
        }
    );

    if (!res.ok) {
        const err = await res.json();
        throw new Error(`Gemini API error: ${JSON.stringify(err)}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ─── Generate Single Post ────────────────────────────────

export async function generatePost(product: Product): Promise<GeneratedPost> {
    const prompt = `You are an expert Instagram content strategist for RIIQX, a premium Indian streetwear brand targeting Gen-Z.

Generate a SINGLE Instagram image post for this product:
- Name: ${product.title}
- Description: ${product.description}
- Price: ₹${product.price}
- Category: ${product.category}
- Tags: ${product.tags.join(", ")}

Return JSON with this EXACT structure:
{
  "caption": "An engaging Instagram caption (2-4 lines, use line breaks, emojis, brand voice — confident, raw, street-smart. Mention the product naturally. No cringe.)",
  "hashtags": ["#RIIQX", "#Streetwear", ...8-12 more relevant hashtags],
  "cta": "A compelling call-to-action (e.g., 'Link in bio → cop yours before it sells out')"
}

Rules:
- Caption must feel authentic, not salesy
- Use lowercase for captions (street style)
- Include price naturally
- Reference Indian street culture when appropriate
- Make it scroll-stopping`;

    try {
        const raw = await callGemini(prompt);
        const parsed = JSON.parse(raw);
        return {
            type: "image",
            caption: parsed.caption,
            hashtags: parsed.hashtags,
            cta: parsed.cta,
            imageUrl: product.images[0],
        };
    } catch (err) {
        if (err instanceof Error && err.message === "NO_API_KEY") {
            return generatePostFallback(product);
        }
        console.error("Gemini post generation failed, using fallback:", err);
        return generatePostFallback(product);
    }
}

function generatePostFallback(product: Product): GeneratedPost {
    const captions = [
        `this ain't just any ${product.category.toLowerCase() || "fit"}. it's a whole mood.\n\n${product.title.toLowerCase()} — ₹${product.price}. premium fabric. zero compromise.\n\ncop yours before they're gone 🖤`,
        `the streets don't wait. neither should your wardrobe.\n\nnew drop: ${product.title.toLowerCase()}\n₹${product.price} | limited stock.\n\ntap the link. own the moment.`,
        `when the fit hits different, you just know.\n\n${product.title.toLowerCase()} — built for those who refuse to blend in.\n\n₹${product.price} | link in bio 🔥`,
    ];

    return {
        type: "image",
        caption: captions[Math.floor(Math.random() * captions.length)],
        hashtags: [
            "#RIIQX",
            "#Streetwear",
            "#IndianStreetwear",
            "#StreetStyle",
            "#OOTD",
            "#FitCheck",
            "#NewDrop",
            "#GenZFashion",
            `#${(product.category || "Fashion").replace(/\s/g, "")}`,
            "#UrbanFashion",
        ],
        cta: "Link in bio → limited stock on this drop",
        imageUrl: product.images[0],
    };
}

// ─── Generate Carousel ───────────────────────────────────

export async function generateCarousel(
    product: Product
): Promise<GeneratedCarousel> {
    const prompt = `You are an expert Instagram content strategist for RIIQX, a premium Indian streetwear brand.

Generate a 5-slide Instagram CAROUSEL post for this product:
- Name: ${product.title}
- Description: ${product.description}
- Price: ₹${product.price}
- Category: ${product.category}

Return JSON with this EXACT structure:
{
  "caption": "An engaging carousel caption (tell a story, build curiosity, 3-5 lines)",
  "hashtags": ["#RIIQX", ...10 more relevant hashtags],
  "cta": "Swipe-worthy CTA",
  "slides": [
    { "overlayText": "Bold text for slide 1 (hook/question)" },
    { "overlayText": "Text for slide 2 (problem/pain point)" },
    { "overlayText": "Text for slide 3 (the product solution)" },
    { "overlayText": "Text for slide 4 (social proof/detail)" },
    { "overlayText": "Text for slide 5 (CTA with price)" }
  ]
}

Rules:
- Slide 1 must be a HOOK that makes people swipe
- Each slide should build on the previous
- Last slide = strong CTA with price
- Keep overlay text SHORT (max 10 words per slide)
- Carousel theme should tell a story`;

    try {
        const raw = await callGemini(prompt);
        const parsed = JSON.parse(raw);
        return {
            type: "carousel",
            caption: parsed.caption,
            hashtags: parsed.hashtags,
            cta: parsed.cta,
            slides: (parsed.slides || []).map(
                (s: { overlayText: string }, i: number) => ({
                    imageUrl: product.images[i % product.images.length],
                    overlayText: s.overlayText,
                })
            ),
        };
    } catch (err) {
        if (err instanceof Error && err.message === "NO_API_KEY") {
            return generateCarouselFallback(product);
        }
        console.error("Gemini carousel generation failed, using fallback:", err);
        return generateCarouselFallback(product);
    }
}

function generateCarouselFallback(product: Product): GeneratedCarousel {
    return {
        type: "carousel",
        caption: `why ${product.title.toLowerCase()} is YOUR next cop 👇\n\nswipe through. the details speak for themselves.\n\n₹${product.price} | link in bio`,
        hashtags: [
            "#RIIQX",
            "#Streetwear",
            "#IndianStreetwear",
            "#SwipeRight",
            "#OOTD",
            "#FitCheck",
            "#StreetStyle",
            "#NewDrop",
            "#FashionCarousel",
            "#GenZFashion",
        ],
        cta: "Swipe → then tap the link in bio",
        slides: [
            { imageUrl: product.images[0], overlayText: "YOUR NEXT SIGNATURE PIECE" },
            {
                imageUrl: product.images[1 % product.images.length],
                overlayText: "PREMIUM QUALITY FABRIC",
            },
            {
                imageUrl: product.images[0],
                overlayText: "DESIGNED FOR THE STREETS",
            },
            {
                imageUrl: product.images[1 % product.images.length],
                overlayText: "STYLE IT YOUR WAY",
            },
            {
                imageUrl: product.images[0],
                overlayText: `₹${product.price} — LINK IN BIO`,
            },
        ],
    };
}

// ─── Generate Reel Script ────────────────────────────────

export async function generateReelScript(
    product: Product
): Promise<GeneratedReelScript> {
    const prompt = `You are a viral Reels strategist for RIIQX, an Indian streetwear brand.

Generate a viral Instagram REEL SCRIPT for this product:
- Name: ${product.title}
- Description: ${product.description}
- Price: ₹${product.price}

Return JSON with this EXACT structure:
{
  "hook": "The opening 0-2 second hook (must stop the scroll)",
  "scenes": [
    "Scene 1 (0-3s): Detailed description of what happens",
    "Scene 2 (3-6s): ...",
    "Scene 3 (6-10s): ...",
    "Scene 4 (10-15s): End frame with CTA"
  ],
  "caption": "Reel caption (short, punchy, lowercase)",
  "hashtags": ["#RIIQX", ...8-10 hashtags],
  "cta": "Strong conversion CTA"
}

Rules:
- Hook MUST stop the scroll in under 2 seconds
- Include text overlay ideas in scene descriptions
- Reference trending formats (silent reveal, GRWM, POV)
- Music sync points where relevant
- End with clear conversion action`;

    try {
        const raw = await callGemini(prompt);
        const parsed = JSON.parse(raw);
        return {
            type: "reel",
            hook: parsed.hook,
            scenes: parsed.scenes,
            caption: parsed.caption,
            hashtags: parsed.hashtags,
            cta: parsed.cta,
        };
    } catch (err) {
        if (err instanceof Error && err.message === "NO_API_KEY") {
            return generateReelFallback(product);
        }
        console.error("Gemini reel generation failed, using fallback:", err);
        return generateReelFallback(product);
    }
}

function generateReelFallback(product: Product): GeneratedReelScript {
    return {
        type: "reel",
        hook: `Close-up of hands unboxing ${product.title}. Text: 'POV: your RIIQX order just arrived 📦'`,
        scenes: [
            `Scene 1 (0-3s): Hands open matte black RIIQX package. ASMR audio. Top-down camera.`,
            `Scene 2 (3-6s): Pull out ${product.title} slowly. Show fabric texture close-up. Natural light.`,
            `Scene 3 (6-10s): Quick cut to wearing the outfit. Mirror shot. Confident nod.`,
            `Scene 4 (10-15s): Product card: ${product.title} | ₹${product.price} | 'Link in bio'. ★★★★★ overlay.`,
        ],
        caption: `unboxing hits different when it's RIIQX.\n\nthe fabric. the fit. the feeling.\n\n${product.title.toLowerCase()} — ₹${product.price}\n\n→ link in bio`,
        hashtags: [
            "#RIIQX",
            "#Unboxing",
            "#Streetwear",
            "#IndianStreetwear",
            "#NewDrop",
            "#OOTD",
            "#FitCheck",
            "#ShopNow",
        ],
        cta: "Link in bio — limited stock",
    };
}
