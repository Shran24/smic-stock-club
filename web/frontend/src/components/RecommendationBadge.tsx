import { useEffect, useState } from "react";
import type { Recommendation } from "../types";
import { Icon } from "./Icon";
import { CountUp } from "./anim";

// Gradient banner in the brand palette. Green = positive, gold = neutral,
// muted red = negative.
const GRADIENTS: Record<string, string> = {
  "Strong Buy": "from-forest-800 to-forest-600",
  Buy: "from-forest-800 to-forest-600",
  Hold: "from-gold-600 to-gold-400",
  "Weak Hold / Watchlist": "from-gold-700 to-gold-500",
  Avoid: "from-[#8c3b30] to-[#c0503f]",
};

export default function RecommendationBadge({ rec }: { rec: Recommendation }) {
  const gradient = GRADIENTS[rec.label] ?? "from-forest-800 to-forest-600";

  // Animate the progress bar from 0 -> score each time a new stock loads.
  const [barWidth, setBarWidth] = useState(0);
  useEffect(() => {
    setBarWidth(0);
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setBarWidth(Math.min(rec.score, 100)))
    );
    return () => cancelAnimationFrame(id);
  }, [rec.score]);

  return (
    <div
      className={`relative overflow-hidden rounded-xl2 bg-gradient-to-r ${gradient} px-7 py-6 text-cream-50 shadow-cardhover`}
    >
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-gold-400">
            <Icon name="star" size={24} />
          </span>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider opacity-85">
              Educational Recommendation
            </div>
            <div className="font-display text-[30px] font-bold leading-tight">{rec.label}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="num font-display text-[30px] font-bold leading-none">
            <CountUp value={rec.score} format={(n) => String(Math.round(n))} />
            <span className="text-lg font-semibold opacity-70"> / 100</span>
          </div>
          <span className="mt-1.5 inline-block rounded-full bg-white/15 px-3 py-0.5 text-xs font-semibold">
            Confidence: {rec.confidence}
          </span>
        </div>
      </div>
      <div className="relative mt-4 h-2 w-full overflow-hidden rounded-full bg-black/20">
        <div
          className="h-full rounded-full bg-cream-50/90 transition-[width] duration-[900ms] ease-out"
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
}
