// TrendMascot
// -----------
// A "market mood" badge driven by the backend's `technicals.trend`. It ALWAYS
// renders one of three states:
//   Upward trend   -> BULL  (public/bull.png), gentle bob,  green
//   Downward trend -> BEAR  (public/bear.png), gentle sway, red
//   otherwise      -> NEUTRAL (public/neutral.png if present, else an icon), gold
//
// If a mascot image is missing, it falls back to a small icon (so the badge
// still appears). Descriptive market mood only — not financial advice.

import { useEffect, useState } from "react";
import { Icon } from "./Icon";

type Kind = "bull" | "bear" | "flat";

function kindFor(trend: string): Kind {
  const t = (trend || "").toLowerCase();
  if (t.includes("up")) return "bull";
  if (t.includes("down")) return "bear";
  return "flat";
}

const CONFIG: Record<
  Kind,
  { mood: string; src: string; icon: string; color: string; tint: string; border: string; anim: string }
> = {
  bull: { mood: "Bullish", src: "/bull.png?v=3", icon: "trending-up", color: "text-pos", tint: "bg-forest-tint", border: "border-forest-400/40", anim: "mascot-bull" },
  bear: { mood: "Bearish", src: "/bear.png?v=3", icon: "arrow-down", color: "text-neg", tint: "bg-neg/10", border: "border-neg/30", anim: "mascot-bear" },
  flat: { mood: "Neutral", src: "/neutral.png", icon: "activity", color: "text-gold-600", tint: "bg-gold-100", border: "border-gold-200", anim: "mascot-bull" },
};

export default function TrendMascot({ trend }: { trend: string }) {
  const kind = kindFor(trend);
  const c = CONFIG[kind];
  const [imgFailed, setImgFailed] = useState(false);

  // Reset the image-failed flag when the state changes.
  useEffect(() => setImgFailed(false), [kind]);

  return (
    <div className={`mascot-in mb-4 flex items-center gap-4 rounded-xl2 border ${c.border} ${c.tint} p-4`}>
      <div className={`flex h-20 w-20 flex-none items-center justify-center ${c.color}`}>
        {imgFailed ? (
          <Icon name={c.icon} size={40} />
        ) : (
          <img
            src={c.src}
            alt={`${c.mood} market`}
            onError={() => setImgFailed(true)}
            className={`h-20 w-20 object-contain ${c.anim}`}
            style={{ filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.22))" }}
          />
        )}
      </div>
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">Market Mood</div>
        <div className={`font-display text-xl font-bold ${c.color}`}>{c.mood}</div>
        <div className="text-sm text-ink-soft">{trend}</div>
      </div>
    </div>
  );
}
