import type { Technicals as T } from "../types";
import { fmtNumber, fmtCurrency, fmtPercent } from "../format";
import TrendMascot from "./TrendMascot";

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-panel p-4 transition-colors hover:border-forest-400/50">
      <div className="text-[12px] font-semibold text-ink-muted">{label}</div>
      <div className="num mt-0.5 text-lg font-bold text-ink">{value}</div>
    </div>
  );
}

export default function Technicals({ t }: { t: T }) {
  const items: [string, string][] = [
    ["50-Day Avg", fmtCurrency(t.sma50)],
    ["200-Day Avg", fmtCurrency(t.sma200)],
    ["RSI (momentum)", fmtNumber(t.rsi)],
    ["MACD Histogram", fmtNumber(t.macdHist)],
    ["1-Month Return", fmtPercent(t.return1m, true)],
    ["3-Month Return", fmtPercent(t.return3m, true)],
    ["6-Month Return", fmtPercent(t.return6m, true)],
    ["1-Year Return", fmtPercent(t.return1y, true)],
  ];

  return (
    <div>
      <TrendMascot trend={t.trend} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map(([label, value]) => (
          <MiniMetric key={label} label={label} value={value} />
        ))}
      </div>
      {t.volumeTrend !== null && (
        <p className="mt-3 text-[13px] text-ink-muted">
          <span className="font-semibold text-ink-soft">Volume trend:</span> Recent trading volume is{" "}
          {t.volumeTrend > 0 ? "rising" : "falling"} ({t.volumeTrend > 0 ? "+" : ""}
          {t.volumeTrend.toFixed(1)}% vs. its longer-term average). Rising volume can mean growing
          interest in the stock.
        </p>
      )}
    </div>
  );
}
