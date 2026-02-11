// Video Generator — Creates "Hype Mode" product promo videos (Reels)
// Features: Fast pacing (0.6s), Music, Neon Effects, Flash Transitions
// Output: 1080×1920 vertical MP4

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import type { Product } from "@/lib/products";
import { getTrendingAudio, getTrackByStyle } from "@/lib/agents/trending-audio";
// @ts-expect-error no types for google-tts-api
import * as googleTTS from "google-tts-api";

const REEL_WIDTH = 1080;
const REEL_HEIGHT = 1920;
// HYPE MODE: Fast cuts!
const IMAGE_DURATION = 0.6; // 0.6s per image for fast pacing
const TRANSITION_DURATION = 0.1; // Very fast transition

// ... (getFFmpegPath function stays the same) ...

// Try to find FFmpeg path
function getFFmpegPath(): string {
    try {
        execSync("ffmpeg -version", { stdio: "ignore" });
        return "ffmpeg";
    } catch {
        // Check common Windows paths
        const localAppData = process.env.LOCALAPPDATA || "";
        const possiblePaths = [
            path.join(localAppData, "Microsoft", "WinGet", "Packages", "Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe", "ffmpeg-8.0.1-full_build", "bin", "ffmpeg.exe"),
            path.join(localAppData, "Microsoft", "WinGet", "Packages", "Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe", "ffmpeg-7.1-full_build", "bin", "ffmpeg.exe"),
            "C:\\ffmpeg\\bin\\ffmpeg.exe",
        ];

        for (const p of possiblePaths) {
            if (fs.existsSync(p)) return `"${p}"`;
        }

        // Robust search in WinGet folder (recursive but shallow enough to be fast/safe)
        try {
            const winGetDir = path.join(localAppData, "Microsoft", "WinGet", "Packages");
            if (fs.existsSync(winGetDir)) {
                // Helper to recursively find a file
                const findFile = (dir: string, fileName: string, depth: number = 0): string | null => {
                    if (depth > 4) return null; // Limit recursion depth
                    try {
                        const entries = fs.readdirSync(dir, { withFileTypes: true });
                        for (const entry of entries) {
                            const fullPath = path.join(dir, entry.name);
                            if (entry.isDirectory()) {
                                const found = findFile(fullPath, fileName, depth + 1);
                                if (found) return found;
                            } else if (entry.isFile() && entry.name.toLowerCase() === fileName.toLowerCase()) {
                                return fullPath;
                            }
                        }
                    } catch { /* ignore access errors */ }
                    return null;
                };

                const foundFFmpeg = findFile(winGetDir, "ffmpeg.exe");
                if (foundFFmpeg) return `"${foundFFmpeg}"`;
            }
        } catch { }

        console.warn("FFmpeg not found in PATH or common locations. Defaulting to 'ffmpeg'.");
        return "ffmpeg";
    }
}

const FFMPEG_CMD = getFFmpegPath();

interface VideoGenerationResult {
    videoPath: string;
    duration: number;
    resolution: string;
}

export async function generateProductVideo(
    product: Product,
    caption?: string,
    audioStyle?: "phonk" | "lofi" | "upbeat" | "cinematic",
    hookText?: string
): Promise<VideoGenerationResult> {
    // Create temp directory for this reel
    const reelDir = path.join(os.tmpdir(), "riiqx-reels", product.id);
    fs.mkdirSync(reelDir, { recursive: true });

    const outputPath = path.join(reelDir, "reel.mp4");
    const audioPath = path.join(reelDir, "audio.mp3");
    const ttsPath = path.join(reelDir, "tts.mp3");

    // 1a. Generate TTS for Hook (if provided)
    if (hookText && hookText.length > 0) {
        try {
            console.log("Generating AI Voiceover for hook:", hookText);
            const url = googleTTS.getAudioUrl(hookText, {
                lang: "en",
                slow: false,
                host: "https://translate.google.com",
            });
            await downloadFile(url, ttsPath);
        } catch (err) {
            console.warn("TTS generation failed:", err);
        }
    }

    // 1b. Download Random Trending Audio
    try {
        // Use specific style if provided, otherwise random
        const track = audioStyle
            ? getTrackByStyle(audioStyle)
            : getTrendingAudio();

        console.log(`Using trending audio: ${track.name} (${track.style})`);
        if (!fs.existsSync(audioPath)) {
            await downloadFile(track.url, audioPath);
        }
    } catch (err) {
        console.warn("Failed to download audio, proceeding silent:", err);
    }

    // 2. Download Images
    const imagePaths: string[] = [];
    // Use up to 12 images for Hype Mode (needs more content for fast cuts)
    const sourceImages = product.images.slice(0, 12);

    for (let i = 0; i < sourceImages.length; i++) {
        const imgPath = path.join(reelDir, `img_${i}.jpg`);
        await downloadFile(sourceImages[i], imgPath);
        imagePaths.push(imgPath);
    }

    if (imagePaths.length === 0) {
        throw new Error("No product images available");
    }

    // Loop images to fill at least 7 seconds
    // With 0.6s duration, we need ~12 clips for 7s
    while (imagePaths.length * IMAGE_DURATION < 7) {
        imagePaths.push(...imagePaths);
    }
    // Cap at 15 seconds max (Instagram Reel sweet spot)
    if (imagePaths.length * IMAGE_DURATION > 15) {
        imagePaths.length = Math.floor(15 / IMAGE_DURATION);
    }

    const totalDuration = imagePaths.length * IMAGE_DURATION;

    // 3. Build Hype Filter Complex
    const filterComplex = buildHypeFilterComplex(imagePaths, product);

    // 4. Build FFmpeg Command
    // Structure: Inputs (Images) -> Input (Audio) -> Filter -> Map -> Encode

    const inputArgs = imagePaths
        .map((p) => `-loop 1 -t ${IMAGE_DURATION + TRANSITION_DURATION} -i "${p}"`)
        .join(" "); // Note: loop 1 and t duration for image inputs

    // Audio handling: Mix TTS (if exists) with Music
    // Strategy: If TTS exists, use amix. If not, just music.
    // Ideally use 'sidechain' ducking but amix is simpler for v1.
    // If TTS exists: [tts]volume=1.5[voc];[music]volume=0.3[bg];[voc][bg]amix=inputs=2:duration=first:dropout_transition=2[a]

    let audioInputArgs = "";
    let audioFilter = "";
    let mapAudio = "";

    const hasMusic = fs.existsSync(audioPath);
    const hasTTS = fs.existsSync(ttsPath);

    if (hasMusic && hasTTS) {
        // Both: Mix them
        // Inputs: 0..N-1 images. N = Music. N+1 = TTS.
        const musicIndex = imagePaths.length;
        const ttsIndex = imagePaths.length + 1;

        audioInputArgs = `-stream_loop -1 -i "${audioPath}" -i "${ttsPath}"`;
        // Duck music volume to 0.4, boost TTS to 1.5
        audioFilter = `;[${musicIndex}:a]volume=0.4[bg];[${ttsIndex}:a]volume=1.5[voc];[bg][voc]amix=inputs=2:duration=longest[mixed_audio]`;
        mapAudio = `-map "[final]" -map "[mixed_audio]"`;
    } else if (hasMusic) {
        // Only Music
        const musicIndex = imagePaths.length;
        audioInputArgs = `-stream_loop -1 -i "${audioPath}"`;
        mapAudio = `-map "[final]" -map ${musicIndex}:a`;
    } else if (hasTTS) {
        // Only TTS
        const ttsIndex = imagePaths.length;
        audioInputArgs = `-i "${ttsPath}"`;
        mapAudio = `-map "[final]" -map ${ttsIndex}:a`;
    } else {
        // Silent
        mapAudio = `-map "[final]"`;
    }

    const ffmpegCmd = [
        `${FFMPEG_CMD} -y`,
        inputArgs, // Images
        audioInputArgs,
        `-filter_complex "${filterComplex}${audioFilter}"`,
        mapAudio,
        "-c:v libx264",
        "-preset fast",
        "-crf 23",
        "-pix_fmt yuv420p",
        "-r 30",
        `-t ${totalDuration}`,
        "-af \"afade=t=out:st=" + (totalDuration - 2) + ":d=2\"", // Audio fade out
        `-shortest`, // Stop when shortest stream ends (usually video due to -t)
        `"${outputPath}"`,
    ].join(" ");

    try {
        execSync(ffmpegCmd, {
            stdio: "pipe",
            timeout: 180000, // 3 min timeout for hype generation
            windowsHide: true,
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("FFmpeg Hype Mode failed, trying fallback:", msg);
        // Fallback to simple video if hype mode fails
        return generateSimpleVideo(imagePaths, product, outputPath, totalDuration);
    }

    if (!fs.existsSync(outputPath)) {
        throw new Error("Video generation failed — output file not created");
    }

    return {
        videoPath: outputPath,
        duration: totalDuration,
        resolution: `${REEL_WIDTH}x${REEL_HEIGHT}`,
    };
}

/**
 * Build "Hype Mode" filter complex:
 * - Aggressive Zoom/Pan
 * - High Saturation/Contrast
 * - Neon Text Overlays (flashing)
 */
function buildHypeFilterComplex(
    imagePaths: string[],
    product: Product
): string {
    const filters: string[] = [];

    const productName = product.title
        .replace(/'/g, "'\\''")
        .replace(/"/g, '\\"')
        .replace(/:/g, "\\:")
        .toUpperCase()
        .substring(0, 15); // Short for hype

    const priceText = `RS. ${product.price}`;

    const NEON_GREEN = "0x39FF14"; // RIIQX Green
    const NEON_PINK = "0xFF0099";

    for (let i = 0; i < imagePaths.length; i++) {
        // Zoom: Alternating In/Out
        const z = i % 2 === 0 ? "1.5-0.002*on" : "1.0+0.002*on";
        const x = "(iw-iw/zoom)/2";
        const y = "(ih-ih/zoom)/2";

        // Text Overlay logic
        // 1. Branding (RIIQX) - Always on top
        // 2. Product Name - Center - Flashes on EVEN clips
        // 3. Price - Bottom - Flashes on ODD clips

        // Using box=1 to make text pop against any background
        const branding = `drawtext=text='RIIQX':fontcolor=${NEON_GREEN}:fontsize=80:x=(w-text_w)/2:y=100:shadowcolor=black:shadowx=5:shadowy=5`;
        const title = (i % 2 === 0)
            ? `drawtext=text='${productName}':fontcolor=white:fontsize=90:x=(w-text_w)/2:y=(h-text_h)/2:shadowcolor=black:shadowx=5:shadowy=5:box=1:boxcolor=black@0.6:boxborderw=10`
            : "";
        const price = (i % 2 !== 0)
            ? `drawtext=text='${priceText}':fontcolor=${NEON_PINK}:fontsize=100:x=(w-text_w)/2:y=h-400:shadowcolor=black:shadowx=5:shadowy=5:box=1:boxcolor=black@0.6:boxborderw=10`
            : "";

        const textFilters = [branding, title, price].filter(Boolean).join(",");

        filters.push(
            `[${i}:v]scale=${REEL_WIDTH * 2}:${REEL_HEIGHT * 2},` +
            `zoompan=z='${z}':x='${x}':y='${y}':d=${IMAGE_DURATION * 30}:s=${REEL_WIDTH}x${REEL_HEIGHT}:fps=30,` +
            `eq=saturation=1.5:contrast=1.2,` + // Boost colors
            (textFilters ? `${textFilters},` : "") +
            `setsar=1` +
            `[v${i}]`
        );
    }

    // Concat
    const concatInputs = imagePaths.map((_, i) => `[v${i}]`).join("");
    filters.push(
        `${concatInputs}concat=n=${imagePaths.length}:v=1:a=0[final]`
    );

    return filters.join(";");
}

/**
 * Fallback: simpler video generation without complex filters
 */
async function generateSimpleVideo(
    imagePaths: string[],
    product: Product,
    outputPath: string,
    totalDuration: number
): Promise<VideoGenerationResult> {
    const reelDir = path.dirname(outputPath);
    const concatFile = path.join(reelDir, "concat.txt");

    const resizedPaths: string[] = [];
    for (let i = 0; i < imagePaths.length; i++) {
        const resizedPath = path.join(reelDir, `resized_${i}.jpg`);
        try {
            execSync(
                `${FFMPEG_CMD} -y -i "${imagePaths[i]}" -vf "scale=${REEL_WIDTH}:${REEL_HEIGHT}:force_original_aspect_ratio=decrease,pad=${REEL_WIDTH}:${REEL_HEIGHT}:(ow-iw)/2:(oh-ih)/2:color=black" "${resizedPath}"`,
                { stdio: "pipe", timeout: 30000, windowsHide: true }
            );
            resizedPaths.push(resizedPath);
        } catch {
            resizedPaths.push(imagePaths[i]);
        }
    }

    const concatContent = resizedPaths
        .map((p) => `file '${p.replace(/\\/g, "/")}'\nduration ${IMAGE_DURATION}`)
        .join("\n");
    fs.writeFileSync(concatFile, concatContent + `\nfile '${resizedPaths[resizedPaths.length - 1].replace(/\\/g, "/")}'`);

    try {
        execSync(
            `${FFMPEG_CMD} -y -f concat -safe 0 -i "${concatFile}" -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -r 30 -t ${totalDuration} "${outputPath}"`,
            { stdio: "pipe", timeout: 120000, windowsHide: true }
        );
    } catch {
        throw new Error("Simple video generation failed");
    }

    return {
        videoPath: outputPath,
        duration: totalDuration,
        resolution: `${REEL_WIDTH}x${REEL_HEIGHT}`,
    };
}


/**
 * Download helper
 */
async function downloadFile(url: string, destPath: string): Promise<void> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to download: ${url}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(destPath, buffer);
}

/**
 * Cleanup temp files
 */
export function cleanupReelFiles(productId: string): void {
    const reelDir = path.join(os.tmpdir(), "riiqx-reels", productId);
    if (fs.existsSync(reelDir)) {
        try {
            fs.rmSync(reelDir, { recursive: true, force: true });
        } catch { }
    }
}
