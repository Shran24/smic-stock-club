import type { CompareRow } from "../types";
import { fmtCurrency, fmtNumber, fmtPercent, fmtLargeNumber } from "../format";
import CompanyLogo from "./CompanyLogo";
import Sparkline from "./Sparkline";

function LogoCell({ row }: { row: CompareRow }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 flex-none items-center justify-center overflow-hidden rounded-lg border border-line bg-surface">
        <CompanyLogo
          domain={row.domain}
          ticker={row.ticker}
          imgClassName="h-6 w-6 object-contain"
          monogram={<span className="num text-xs font-bold text-gold-600">{row.ticker.slice(0, 2)}</span>}
        />
      </span>
      <div>
        <div className="num text-sm font-bold text-ink">{row.ticker}</div>
        <div className="max-w-[120px] truncate text-[11px] text-ink-muted">{row.name}</div>
      </div>
    </div>
  );
}

function scoreColor(score: number): string {
  if (score >= 65) return "text-pos";
  if (score >= 45) return "text-gold-600";
  return "text-neg";
}

export default function CompareTable({ rows }: { rows: CompareRow[] }) {
  const metrics: { label: string; render: (r: CompareRow) => string }[] = [
    { label: "Current Price", render: (r) => fmtCurrency(r.price) },
    { label: "P/E Ratio", render: (r) => fmtNumber(r.pe) },
    { label: "EPS", render: (r) => fmtCurrency(r.eps) },
    { label: "Revenue Growth", render: (r) => fmtPercent(r.revenueGrowth) },
    { label: "Market Cap", render: (r) => fmtLargeNumber(r.marketCap) },
    { label: "1-Year Return", render: (r) => fmtPercent(r.return1y, true) },
  ];

  return (
    <div className="card overflow-x-auto p-1">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line">
            <th className="p-4 text-left text-xs font-bold uppercase tracking-wide text-ink-muted">
              Metric
            </th>
            {rows.map((r) => (
              <th key={r.ticker} className="p-4 text-left">
                <LogoCell row={r} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-line/70">
            <td className="p-4 text-ink-muted">60-Day Trend</td>
            {rows.map((r) => (
              <td key={r.ticker} className="p-4">
                <Sparkline data={r.spark} />
              </td>
            ))}
          </tr>
          {metrics.map((m) => (
            <tr key={m.label} className="border-b border-line/70">
              <td className="p-4 text-ink-muted">{m.label}</td>
              {rows.map((r) => (
                <td key={r.ticker} className="num p-4 font-bold text-ink">
                  {m.render(r)}
                </td>
              ))}
            </tr>
          ))}
          <tr className="border-b border-line/70">
            <td className="p-4 text-ink-muted">Overall Score</td>
            {rows.map((r) => (
              <td key={r.ticker} className={`num p-4 text-lg font-extrabold ${scoreColor(r.score)}`}>
                {r.score}
              </td>
            ))}
          </tr>
          <tr className="border-b border-line/70">
            <td className="p-4 text-ink-muted">Recommendation</td>
            {rows.map((r) => (
              <td key={r.ticker} className="p-4 font-bold text-ink">
                {r.label}
              </td>
            ))}
          </tr>
          <tr>
            <td className="p-4 text-ink-muted">Confidence</td>
            {rows.map((r) => (
              <td key={r.ticker} className="p-4 font-bold text-ink">
                {r.confidence}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
