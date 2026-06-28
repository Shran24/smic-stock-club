import { useState } from "react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { useMounted } from "./anim";

// Color shifts red -> gold -> green with the score.
function barColor(score: number): string {
  if (score >= 65) return "bg-pos";
  if (score >= 45) return "bg-gold-500";
  return "bg-neg";
}

// Short axis labels so the radar chart stays readable.
const SHORT: Record<string, string> = {
  Valuation: "Value",
  Growth: "Growth",
  Profitability: "Profit",
  "Financial Health": "Health",
  "Technical Trend": "Trend",
};

export default function ScoreBreakdown({ scores }: { scores: Record<string, number> }) {
  const entries = Object.entries(scores);
  const mounted = useMounted();
  const [view, setView] = useState<"bars" | "radar">("bars");

  const radarData = entries.map(([label, score]) => ({ axis: SHORT[label] ?? label, score }));

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-bold text-ink">Score Breakdown</span>
        <div className="flex gap-1.5">
          {(["bars", "radar"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-bold capitalize transition-colors ${
                view === v
                  ? "border-transparent bg-forest-800 text-cream-50"
                  : "border-line bg-surface text-ink-muted hover:text-ink"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === "bars" ? (
        <div className="space-y-4">
          {entries.map(([label, score]) => (
            <div key={label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-semibold text-ink">{label}</span>
                <span className="num font-bold text-ink-muted">{score}</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-cream-200">
                <div
                  className={`h-full rounded-full ${barColor(score)} transition-all duration-[900ms] ease-out`}
                  style={{ width: mounted ? `${Math.min(score, 100)}%` : "0%" }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart data={radarData} outerRadius="72%">
            <PolarGrid stroke="rgba(120,130,110,0.30)" />
            <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: "#8b8b95", fontWeight: 600 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Radar dataKey="score" stroke="#327a48" fill="#327a48" fillOpacity={0.35} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      )}

      <p className="mt-4 text-xs text-ink-muted">
        Each category is scored 0–100. The overall score is the weighted average of these five.
      </p>
    </div>
  );
}
