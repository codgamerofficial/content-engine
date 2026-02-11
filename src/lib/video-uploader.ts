// Video Uploader — Uploads generated video to file.io for a temporary public URL
// Instagram Reels API requires the video to be at a publicly accessible URL

import * as fs from "fs";
import * as path from "path";

interface UploadResult {
    url: string;
    expiresAt: string;
}

/**
 * Upload a video file to file.io for a temporary public URL.
 * Files are available for one download (or expire after 14 days).
 */
export async function uploadVideo(videoPath: string): Promise<UploadResult> {
    if (!fs.existsSync(videoPath)) {
        throw new Error(`Video file not found: ${videoPath}`);
    }

    const fileBuffer = fs.readFileSync(videoPath);
    const fileName = path.basename(videoPath);

    // Create FormData with the video file
    const formData = new FormData();
    formData.append(
        "file",
        new Blob([fileBuffer], { type: "video/mp4" }),
        fileName
    );
    formData.append("expires", "1d"); // Expire after 1 day
    formData.append("autoDelete", "false"); // Don't delete after first download (IG needs multiple fetches)

    const res = await fetch("https://file.io", {
        method: "POST",
        body: formData,
    });

    if (!res.ok) {
        throw new Error(`file.io upload failed: ${res.statusText}`);
    }

    const data = await res.json();

    if (!data.success) {
        throw new Error(`file.io upload error: ${data.message || "Unknown error"}`);
    }

    return {
        url: data.link,
        expiresAt: data.expires || "1 day",
    };
}

/**
 * Alternative: Upload to tmpfiles.org (backup if file.io is down)
 */
export async function uploadVideoBackup(
    videoPath: string
): Promise<UploadResult> {
    if (!fs.existsSync(videoPath)) {
        throw new Error(`Video file not found: ${videoPath}`);
    }

    const fileBuffer = fs.readFileSync(videoPath);
    const fileName = path.basename(videoPath);

    const formData = new FormData();
    formData.append(
        "file",
        new Blob([fileBuffer], { type: "video/mp4" }),
        fileName
    );

    const res = await fetch("https://tmpfiles.org/api/v1/upload", {
        method: "POST",
        body: formData,
    });

    if (!res.ok) {
        throw new Error(`tmpfiles.org upload failed: ${res.statusText}`);
    }

    const data = await res.json();

    if (data.status !== "success") {
        throw new Error(`tmpfiles.org error: ${JSON.stringify(data)}`);
    }

    // tmpfiles.org returns URL like https://tmpfiles.org/123456/video.mp4
    // Need to convert to direct download: https://tmpfiles.org/dl/123456/video.mp4
    const directUrl = data.data.url.replace(
        "tmpfiles.org/",
        "tmpfiles.org/dl/"
    );

    return {
        url: directUrl,
        expiresAt: "1 hour",
    };
}

/**
 * Try uploading with primary service, fall back to backup
 */
export async function uploadVideoWithFallback(
    videoPath: string
): Promise<UploadResult> {
    try {
        return await uploadVideo(videoPath);
    } catch (primaryErr) {
        console.warn("Primary upload (file.io) failed, trying backup...", primaryErr);
        try {
            return await uploadVideoBackup(videoPath);
        } catch (backupErr) {
            throw new Error(
                `All upload services failed. Primary: ${primaryErr instanceof Error ? primaryErr.message : String(primaryErr)}. Backup: ${backupErr instanceof Error ? backupErr.message : String(backupErr)}`
            );
        }
    }
}
