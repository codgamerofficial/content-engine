import type { ContentStrategyOutput } from "@/types/agents";

export async function runContentStrategy(): Promise<ContentStrategyOutput> {
    const dayOfWeek = new Date().getDay();

    // Adjust strategy based on day
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    return {
        weekly_posting_plan: {
            reels_per_week: "5-6 (one per day, rest day on Sunday)",
            posts_per_week: "2 (product shots on Tuesday and Friday)",
            carousels_per_week:
                "2 (educational/brand story on Wednesday, styling guide on Saturday)",
        },
        best_posting_times_IST: [
            "Monday 12:30 PM — lunch break scroll peak",
            "Tuesday 7:00 PM — post-work unwinding time",
            "Wednesday 9:00 PM — prime Reel discovery hour",
            "Thursday 6:30 PM — early evening engagement window",
            "Friday 8:00 PM — weekend mood kicks in, high save rate",
            "Saturday 11:00 AM — weekend browsing + shopping intent",
            isWeekend
                ? "TODAY: Post between 11 AM - 1 PM IST for maximum reach (weekend browsing peak)"
                : "TODAY: Post between 7 PM - 9 PM IST for maximum reach (weekday engagement peak)",
        ],
        content_mix_strategy:
            "Follow the 4-1-1 rule adapted for streetwear: For every 6 posts — 4 should be entertainment/vibe content (fit checks, transitions, aesthetic Reels), 1 should be educational (styling tips, fabric quality, brand story), and 1 should be direct conversion (product showcase with CTA). Never post more than 2 conversion posts in a week — it kills the organic vibe. Prioritize Reels for reach, use carousels for saves, and stories for daily engagement and polls.",
        growth_hacks: [
            "🔥 Reply to EVERY comment within 30 minutes of posting — the algorithm rewards early engagement velocity",
            "🎯 Use the 'Share to Story' hack: After posting a Reel, share it to your Story with a poll ('Fire or not? 🔥'). This double-dips on reach",
            "💬 Comment on 20-30 fashion/streetwear pages daily BEFORE posting your content — this primes the algorithm to show your content to similar audiences",
            "📌 Pin your 3 best-performing Reels to your profile grid — new visitors decide in 3 seconds if they'll follow",
            "🔄 Repost your best Reel from 30+ days ago with a new caption — Instagram doesn't penalize reposting and you capture a new audience",
            "⏰ Post Reels at off-peak times (6 AM IST) occasionally — less competition means your Reel gets more initial push from the algorithm",
            "🏷️ Use only 5-8 highly targeted hashtags instead of 30 generic ones — the algorithm now prefers focused relevance over volume",
            "📊 Check Insights every Monday — double down on what got saves (not likes). Saves = algorithm fuel in 2026",
        ],
    };
}
