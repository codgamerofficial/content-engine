// Auto-Post Pipeline
// Generates AI content for a product and posts it to Instagram automatically

import { getProductById, getRandomProduct, type Product } from "@/lib/products";
import {
    generatePost,
    generateCarousel,
    generateReelScript,
    type GeneratedPost,
    type GeneratedCarousel,
    type GeneratedReelScript,
} from "@/lib/agents/content-generator";
import { postSingleImage, postCarousel } from "@/lib/instagram";

export interface AutoPostResult {
    success: boolean;
    product: { id: string; name: string };
    content: GeneratedPost | GeneratedCarousel | GeneratedReelScript;
    posted?: { mediaId: string };
    error?: string;
}

export async function runAutoPost(
    productId?: string,
    contentType: "image" | "carousel" | "reel" = "image",
    autoPublish: boolean = true
): Promise<AutoPostResult> {
    // 1. Pick product (now async — fetches from Shopify)
    let product: Product | undefined;

    if (productId) {
        product = await getProductById(productId);
    } else {
        product = await getRandomProduct();
    }

    if (!product) {
        throw new Error(`Product not found: ${productId}`);
    }

    // 2. Generate content
    let content: GeneratedPost | GeneratedCarousel | GeneratedReelScript;

    if (contentType === "image") {
        content = await generatePost(product);
    } else if (contentType === "carousel") {
        content = await generateCarousel(product);
    } else {
        content = await generateReelScript(product);
    }

    const result: AutoPostResult = {
        success: true,
        product: { id: product.id, name: product.title },
        content,
    };

    // 3. Auto-publish (only for image and carousel — Reels need actual video)
    if (autoPublish && contentType !== "reel") {
        try {
            const fullCaption = buildCaption(content);

            if (content.type === "image") {
                const postResult = await postSingleImage(content.imageUrl, fullCaption);
                result.posted = { mediaId: postResult.id };
            } else if (content.type === "carousel") {
                const imageUrls = content.slides.map((s) => s.imageUrl);
                if (imageUrls.length >= 2) {
                    const postResult = await postCarousel(imageUrls, fullCaption);
                    result.posted = { mediaId: postResult.id };
                } else {
                    const postResult = await postSingleImage(imageUrls[0], fullCaption);
                    result.posted = { mediaId: postResult.id };
                }
            }
        } catch (err) {
            result.error = err instanceof Error ? err.message : "Post failed";
            result.success = false;
        }
    }

    return result;
}

function buildCaption(
    content: GeneratedPost | GeneratedCarousel | GeneratedReelScript
): string {
    return `${content.caption}\n\n${content.hashtags.join(" ")}\n\n${content.cta}`;
}
