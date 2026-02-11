import { getProductById, getRandomProduct, Product } from "@/lib/products";
import { generateReelScript } from "@/lib/agents/content-generator";
import { generateProductVideo, cleanupReelFiles } from "@/lib/video-generator";
import { uploadVideoWithFallback } from "@/lib/video-uploader";
import { postReel } from "@/lib/instagram";

export interface ReelExecutionResult {
    success: boolean;
    product: { id: string; title: string };
    video: {
        duration: number;
        resolution: string;
        publicUrl: string;
        expiresAt: string;
    };
    content: {
        type: "reel";
        caption: string;
        hashtags: string[];
        cta: string;
        hook: string;
        scenes: string[];
    };
    posted?: { mediaId: string };
    postError?: string;
    error?: string;
}

export async function executeReelWorkflow(
    productId?: string,
    autoPublish: boolean = true,
    audioStyle?: "phonk" | "lofi" | "upbeat" | "cinematic",
    hookText?: string
): Promise<ReelExecutionResult> {
    let product: Product | undefined;

    // 1. Get product
    if (productId) {
        product = await getProductById(productId);
        if (!product) throw new Error(`Product not found: ${productId}`);
    } else {
        product = await getRandomProduct();
    }

    try {
        // 2. Generate AI Reel caption
        const reelScript = await generateReelScript(product);
        const fullCaption = `${reelScript.caption}\n\n${reelScript.hashtags.join(" ")}\n\n${reelScript.cta}`;

        // 3. Generate video from product images
        const video = await generateProductVideo(product, reelScript.caption, audioStyle, hookText);

        // 4. Upload video for public URL
        const upload = await uploadVideoWithFallback(video.videoPath);

        const result: ReelExecutionResult = {
            success: true,
            product: { id: product.id, title: product.title },
            video: {
                duration: video.duration,
                resolution: video.resolution,
                publicUrl: upload.url,
                expiresAt: upload.expiresAt,
            },
            content: {
                type: "reel",
                caption: reelScript.caption,
                hashtags: reelScript.hashtags,
                cta: reelScript.cta,
                hook: reelScript.hook,
                scenes: reelScript.scenes,
            },
        };

        // 5. Post to Instagram as Reel
        if (autoPublish) {
            try {
                const postResult = await postReel(upload.url, fullCaption);
                result.posted = { mediaId: postResult.id };
            } catch (postErr) {
                result.postError =
                    postErr instanceof Error ? postErr.message : "Reel posting failed";
            }
        }

        // 6. Cleanup temp files
        try {
            cleanupReelFiles(product.id);
        } catch {
            // Non-critical
        }

        return result;
    } catch (error) {
        // Ensure cleanup happens even on error
        if (product) {
            try {
                cleanupReelFiles(product.id);
            } catch { }
        }
        throw error;
    }
}
