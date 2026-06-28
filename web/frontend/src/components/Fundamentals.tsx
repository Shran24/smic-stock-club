import type { Fundamentals as F } from "../types";
import { fmtNumber, fmtCurrency, fmtPercent, fmtLargeNumber } from "../format";

type Rating = "good" | "fair" | "weak" | null;

// Simple, transparent per-metric judgments (educational, not advice).
function rate(metric: string, v: number | null): Rating {
  if (v === null || v === undefined) return null;
  switch (metric) {
    case "pe":
    case "forwardPe":
      if (v <= 0) return "weak";
      return v < 25 ? "good" : v < 40 ? "fair" : "weak";
    case "eps":
      return v > 0 ? "good" : "weak";
    case "revenueGrowth": // fraction
      return v >= 0.15 ? "good" : v >= 0.05 ? "fair" : "weak";
    case "profitMargin":
      return v >= 0.15 ? "good" : v >= 0.05 ? "fair" : "weak";
    case "debtToEquity": // reported as a percentage
      return v < 100 ? "good" : v < 200 ? "fair" : "weak";
    case "roe":
      return v >= 0.15 ? "good" : v >= 0.05 ? "fair" : "weak";
    case "freeCashFlow":
      return v > 0 ? "good" : "weak";
    default:
      return null;
  }
}

function HealthChip({ rating }: { rating: Rating }) {
  if (!rating) return null;
  const cfg = {
    good: { label: "Good", dot: "bg-pos", text: "text-pos" },
    fair: { label: "Fair", dot: "bg-gold-500", text: "text-gold-600" },
    weak: { label: "Weak", dot: "bg-neg", text: "text-neg" },
  }[rating];
  return (
    <span className={`mt-1 inline-flex items-center gap-1.5 text-xs font-bold ${cfg.text}`}>
      <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export default function Fundamentals({ f }: { f: F }) {
  const rows: { metric: string; label: string; value: string; raw: number | null; explanation: string }[] = [
    { metric: "pe", label: "P/E Ratio", value: fmtNumber(f.pe), raw: f.pe,
      explanation: "Price-to-Earnings. Compares share price to earnings. A HIGH P/E can mean the stock is expensive (or that fast growth is expected); a LOW P/E can mean it is cheaper relative to earnings." },
    { metric: "forwardPe", label: "Forward P/E", value: fmtNumber(f.forwardPe), raw: f.forwardPe,
      explanation: "Like the P/E ratio, but based on EXPECTED future earnings. Comparing it to the regular P/E hints at whether earnings are expected to grow." },
    { metric: "eps", label: "EPS (Earnings Per Share)", value: fmtCurrency(f.eps), raw: f.eps,
      explanation: "How much profit the company makes per share. Positive and growing EPS is a good sign; negative EPS means it is losing money." },
    { metric: "revenueGrowth", label: "Revenue Growth", value: fmtPercent(f.revenueGrowth), raw: f.revenueGrowth,
      explanation: "How fast total sales are growing versus last year. Higher growth usually means the business is expanding." },
    { metric: "profitMargin", label: "Profit Margin", value: fmtPercent(f.profitMargin), raw: f.profitMargin,
      explanation: "Of every dollar of sales, how much becomes profit. Higher margins mean the company turns sales into profit more efficiently." },
    { metric: "debtToEquity", label: "Debt-to-Equity", value: fmtNumber(f.debtToEquity), raw: f.debtToEquity,
      explanation: "How much the company borrows vs. its own money. Lower is generally safer. (Reported as a percentage, so 150 means 1.5x.)" },
    { metric: "roe", label: "Return on Equity (ROE)", value: fmtPercent(f.roe), raw: f.roe,
      explanation: "How well the company turns shareholders' money into profit. Higher ROE usually means a better-run, more profitable business." },
    { metric: "freeCashFlow", label: "Free Cash Flow", value: fmtLargeNumber(f.freeCashFlow), raw: f.freeCashFlow,
      explanation: "Spare cash left after running the business and paying for equipment. Positive free cash flow is a sign of financial strength." },
  ];

  return (
    <div className="card divide-y divide-line">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-[1fr_2.4fr] sm:items-center">
          <div>
            <div className="text-sm font-semibold text-ink-soft">{r.label}</div>
            <div className="num mt-0.5 font-display text-[24px] font-bold text-ink">{r.value}</div>
            <HealthChip rating={rate(r.metric, r.raw)} />
          </div>
          <p className="text-[13px] leading-relaxed text-ink-muted">{r.explanation}</p>
        </div>
      ))}
    </div>
  );
}
