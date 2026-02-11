import type { PerformanceOutput } from "@/types/agents";

export async function runPerformance(): Promise<PerformanceOutput> {
    return {
        top_performing_content_patterns: [
            "🎬 Outfit transition Reels (beat-synced) — avg 3-5x higher reach than static posts",
            "📦 Unboxing POV Reels — highest save rate (people save for 'later purchase')",
            "🔥 'Rate my fit' interactive Reels — highest comment rate (2-3x avg), drives algorithmic push",
            "🖤 Dark aesthetic product shots — 40% higher engagement than bright/colorful alternatives for streetwear audience",
            "📖 Carousel storytelling ('Why we made this') — highest share rate, builds brand loyalty",
            "⏱️ Under 15-second Reels with 3+ scenes — optimal completion rate which Instagram rewards heavily",
        ],
        low_performing_patterns_to_avoid: [
            "❌ Static product photos with white backgrounds — feel like marketplace listings, not brand content",
            "❌ Long-form talking head videos — Gen Z skips within 2 seconds if there's no visual hook",
            "❌ Discount/sale announcement posts — attract deal-seekers, not brand loyalists. Kills perceived value",
            "❌ Reposted TikToks with watermark — Instagram actively suppresses these in recommendations",
            "❌ Text-heavy graphics without product imagery — low engagement, feels like a lecture",
            "❌ Posting more than 3 times a day — cannibalizes your own reach, algorithm distributes attention",
        ],
        recommendations_for_next_7_days: [
            "Day 1 (Today): Post 1 outfit transition Reel using the 'Silent Fit Check' format. Target: 7-9 PM IST",
            "Day 2: Share a 5-slide carousel: 'How to style one RIIQX tee 3 ways'. Target: saves over likes",
            "Day 3: Post an unboxing POV Reel. Keep it under 12 seconds. Use ASMR audio trend",
            "Day 4: Rest day — focus on engaging with 30+ comments on competitor/similar brand pages",
            "Day 5: 'Rate my fit' interactive Reel. Ask viewers to rate 1-10 in comments",
            "Day 6: Behind-the-scenes Story series showing design process or fabric selection (5-7 stories)",
            "Day 7: Repost your best-performing Reel from 2+ weeks ago with a fresh caption",
        ],
        conversion_optimization_tips: [
            "💰 Add product price directly on Reel (text overlay) — removes friction. Viewers who stay after seeing price have high purchase intent",
            "🔗 Update link-in-bio BEFORE posting conversion content. The link should go directly to the featured product, not your homepage",
            "📱 Use Instagram Shopping tags on every post — even non-conversion content. It's free real estate",
            "⭐ Feature 1 customer review screenshot in your Stories daily — social proof converts 3x better than brand claims",
            "🎯 Create a pinned Story Highlight called 'SHOP' with your top 5 products. New followers check Highlights before scrolling your feed",
            "📊 Track 'Website Clicks' metric in Insights, not just likes. A post with 100 likes and 50 clicks beats a post with 10K likes and 2 clicks",
        ],
    };
}
