// Instagram Graph API Client
// Auto-discovers the IG Business Account via the linked Facebook Page.
// Requires: META_ACCESS_TOKEN (User token with instagram_basic, instagram_content_publish, pages_show_list)

const GRAPH_API_BASE = "https://graph.facebook.com/v21.0";

function getUserToken(): string {
    const token = process.env.META_ACCESS_TOKEN;
    if (!token) throw new Error("META_ACCESS_TOKEN is not set in .env.local");
    return token;
}

// ─── Auto-discover Page + IG Account ────────────────────

interface PageInfo {
    pageId: string;
    pageName: string;
    pageAccessToken: string;
    igAccountId: string;
}

async function discoverPageAndIG(): Promise<PageInfo> {
    const userToken = getUserToken();

    // Step 1: Get all Pages the user manages
    const pagesRes = await fetch(
        `${GRAPH_API_BASE}/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${userToken}`
    );

    if (!pagesRes.ok) {
        const err = await pagesRes.json();
        throw new Error(
            `Failed to fetch Pages: ${err.error?.message || pagesRes.statusText}`
        );
    }

    const pagesData = await pagesRes.json();
    const pages = pagesData.data as Array<{
        id: string;
        name: string;
        access_token: string;
        instagram_business_account?: { id: string };
    }>;

    if (!pages || pages.length === 0) {
        throw new Error(
            "No Facebook Pages found. Make sure your token has pages_show_list permission."
        );
    }

    // Step 2: Find the first page with a linked Instagram account
    const pageWithIG = pages.find((p) => p.instagram_business_account?.id);

    if (!pageWithIG) {
        const pageNames = pages.map((p) => p.name).join(", ");
        throw new Error(
            `None of your Pages (${pageNames}) have an Instagram account linked. ` +
            `Go to your Facebook Page Settings → Linked Accounts → Instagram to connect.`
        );
    }

    return {
        pageId: pageWithIG.id,
        pageName: pageWithIG.name,
        pageAccessToken: pageWithIG.access_token,
        igAccountId: pageWithIG.instagram_business_account!.id,
    };
}

// ─── Account Info ────────────────────────────────────────

export async function getAccountInfo(): Promise<{
    id: string;
    username: string;
    name: string;
    profile_picture_url?: string;
    followers_count?: number;
    media_count?: number;
}> {
    const { igAccountId, pageAccessToken } = await discoverPageAndIG();

    const res = await fetch(
        `${GRAPH_API_BASE}/${igAccountId}?fields=id,username,name,profile_picture_url,followers_count,media_count&access_token=${pageAccessToken}`
    );

    if (!res.ok) {
        const err = await res.json();
        throw new Error(
            `Instagram API Error: ${err.error?.message || res.statusText}`
        );
    }

    return res.json();
}

// ─── Single Image Post ───────────────────────────────────

export async function postSingleImage(
    imageUrl: string,
    caption: string
): Promise<{ id: string; success: boolean }> {
    const { igAccountId, pageAccessToken } = await discoverPageAndIG();

    // Step 1: Create media container
    const createRes = await fetch(
        `${GRAPH_API_BASE}/${igAccountId}/media`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                image_url: imageUrl,
                caption,
                access_token: pageAccessToken,
            }),
        }
    );

    if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(
            `Failed to create media container: ${err.error?.message || createRes.statusText}`
        );
    }

    const { id: creationId } = await createRes.json();

    // Step 2: Publish
    const publishRes = await fetch(
        `${GRAPH_API_BASE}/${igAccountId}/media_publish`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                creation_id: creationId,
                access_token: pageAccessToken,
            }),
        }
    );

    if (!publishRes.ok) {
        const err = await publishRes.json();
        throw new Error(
            `Failed to publish: ${err.error?.message || publishRes.statusText}`
        );
    }

    const { id } = await publishRes.json();
    return { id, success: true };
}

// ─── Carousel Post ───────────────────────────────────────

export async function postCarousel(
    imageUrls: string[],
    caption: string
): Promise<{ id: string; success: boolean }> {
    const { igAccountId, pageAccessToken } = await discoverPageAndIG();

    if (imageUrls.length < 2 || imageUrls.length > 10) {
        throw new Error("Carousel requires 2-10 images");
    }

    // Step 1: Create individual carousel items
    const childIds: string[] = [];
    for (const url of imageUrls) {
        const res = await fetch(`${GRAPH_API_BASE}/${igAccountId}/media`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                image_url: url,
                is_carousel_item: true,
                access_token: pageAccessToken,
            }),
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(
                `Failed to create carousel item: ${err.error?.message || res.statusText}`
            );
        }

        const { id } = await res.json();
        childIds.push(id);
    }

    // Step 2: Create carousel container
    const containerRes = await fetch(
        `${GRAPH_API_BASE}/${igAccountId}/media`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                media_type: "CAROUSEL",
                children: childIds,
                caption,
                access_token: pageAccessToken,
            }),
        }
    );

    if (!containerRes.ok) {
        const err = await containerRes.json();
        throw new Error(
            `Failed to create carousel: ${err.error?.message || containerRes.statusText}`
        );
    }

    const { id: creationId } = await containerRes.json();

    // Step 3: Publish
    const publishRes = await fetch(
        `${GRAPH_API_BASE}/${igAccountId}/media_publish`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                creation_id: creationId,
                access_token: pageAccessToken,
            }),
        }
    );

    if (!publishRes.ok) {
        const err = await publishRes.json();
        throw new Error(
            `Failed to publish carousel: ${err.error?.message || publishRes.statusText}`
        );
    }

    const { id } = await publishRes.json();
    return { id, success: true };
}

// ─── Reel (Video) Post ───────────────────────────────────

export async function postReel(
    videoUrl: string,
    caption: string,
    coverUrl?: string
): Promise<{ id: string; success: boolean }> {
    const { igAccountId, pageAccessToken } = await discoverPageAndIG();

    const body: Record<string, unknown> = {
        media_type: "REELS",
        video_url: videoUrl,
        caption,
        access_token: pageAccessToken,
    };

    if (coverUrl) {
        body.cover_url = coverUrl;
    }

    // Step 1: Create Reel container
    const createRes = await fetch(
        `${GRAPH_API_BASE}/${igAccountId}/media`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        }
    );

    if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(
            `Failed to create Reel container: ${err.error?.message || createRes.statusText}`
        );
    }

    const { id: creationId } = await createRes.json();

    // Step 2: Wait for video processing
    let status = "IN_PROGRESS";
    let attempts = 0;
    const maxAttempts = 30;

    while (status === "IN_PROGRESS" && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 10000));
        attempts++;

        const statusRes = await fetch(
            `${GRAPH_API_BASE}/${creationId}?fields=status_code&access_token=${pageAccessToken}`
        );

        if (statusRes.ok) {
            const statusData = await statusRes.json();
            status = statusData.status_code || "FINISHED";
        }
    }

    if (status !== "FINISHED" && attempts >= maxAttempts) {
        throw new Error("Reel processing timed out after 5 minutes");
    }

    // Step 3: Publish
    const publishRes = await fetch(
        `${GRAPH_API_BASE}/${igAccountId}/media_publish`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                creation_id: creationId,
                access_token: pageAccessToken,
            }),
        }
    );

    if (!publishRes.ok) {
        const err = await publishRes.json();
        throw new Error(
            `Failed to publish Reel: ${err.error?.message || publishRes.statusText}`
        );
    }

    const { id } = await publishRes.json();
    return { id, success: true };
}

// ─── Token Exchange ──────────────────────────────────────

export async function exchangeForLongLivedToken(
    shortLivedToken: string,
    appId: string,
    appSecret: string
): Promise<{ access_token: string; token_type: string; expires_in: number }> {
    const res = await fetch(
        `${GRAPH_API_BASE}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`
    );

    if (!res.ok) {
        const err = await res.json();
        throw new Error(
            `Token exchange failed: ${err.error?.message || res.statusText}`
        );
    }

    return res.json();
}
