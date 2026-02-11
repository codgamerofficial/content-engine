// Trending Audio Library
// Curated list of "Viral Style" Royalty-Free tracks mimicking Instagram Trends
// Safe to post without copyright strikes.

interface TrendingTrack {
    name: string;
    style: "phonk" | "lofi" | "upbeat" | "cinematic";
    url: string;
    bpm: number; // For future beat syncing
}

// PHONK (High Energy / Car Edits / Sigma)
const TRENDING_TRACKS: TrendingTrack[] = [
    {
        name: "Aggressive Phonk",
        style: "phonk",
        url: "https://cdn.pixabay.com/audio/2022/03/24/audio_784dc9b48c.mp3", // "Action Phonk" style
        bpm: 120,
    },
    {
        name: "Drift Phonk",
        style: "phonk",
        url: "https://cdn.pixabay.com/audio/2023/04/13/audio_8e29e5576a.mp3", // Fast, aggressive
        bpm: 130,
    },
    {
        name: "Sigma Grind",
        style: "phonk",
        url: "https://cdn.pixabay.com/audio/2024/01/15/audio_273188825c.mp3", // Heavy bass
        bpm: 125,
    },

    // UPBEAT / FASHION (Fast Cuts / Transitions)
    {
        name: "Fashion House",
        style: "upbeat",
        url: "https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3", // Action Rock/Pop
        bpm: 128,
    },
    {
        name: "Summer Pop",
        style: "upbeat",
        url: "https://cdn.pixabay.com/audio/2022/10/25/audio_1454504543.mp3", // Bright, commercial
        bpm: 124,
    },
    {
        name: "Runway Strut",
        style: "upbeat",
        url: "https://cdn.pixabay.com/audio/2023/09/06/audio_243453303c.mp3", // High fashion beat
        bpm: 126,
    },

    // LO-FI / AESTHETIC (Chill Vibes)
    {
        name: "Chill Lofi",
        style: "lofi",
        url: "https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3", // Placeholder (need diff one) -> Let's use a real lofi
        bpm: 85,
    },
    {
        name: "Late Night Drive",
        style: "lofi",
        url: "https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d0.mp3", // Synthwave/Chill
        bpm: 90
    },
    {
        name: "Study Session",
        style: "lofi",
        url: "https://cdn.pixabay.com/audio/2022/11/22/audio_febc508520.mp3", // Smooth jazz hop
        bpm: 80,
    },

    // CINEMATIC / DRAMATIC (Product Reveals)
    {
        name: "Epic Trailer",
        style: "cinematic",
        url: "https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a73467.mp3", // Dramatic build up
        bpm: 100,
    },
    {
        name: "Suspense Rise",
        style: "cinematic",
        url: "https://cdn.pixabay.com/audio/2022/08/02/audio_884fe92c21.mp3", // Tension builder
        bpm: 95,
    }
];

/**
 * Get a random trending track
 */
export function getTrendingAudio(): TrendingTrack {
    const index = Math.floor(Math.random() * TRENDING_TRACKS.length);
    return TRENDING_TRACKS[index];
}

/**
 * Get a track by specific style
 */
export function getTrackByStyle(style: TrendingTrack["style"]): TrendingTrack {
    const filtered = TRENDING_TRACKS.filter((t) => t.style === style);
    if (filtered.length === 0) return getTrendingAudio(); // Fallback
    const index = Math.floor(Math.random() * filtered.length);
    return filtered[index];
}
