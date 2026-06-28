import { memo, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { ChartData } from "../types";

type Tab = "price" | "volume";
type Range = "1M" | "3M" | "6M" | "1Y" | "5Y";

const TABS: { id: Tab; label: string }[] = [
  { id: "price", label: "Price & Moving Averages" },
  { id: "volume", label: "Volume" },
];

const RANGE_DAYS: Record<Range, number> = { "1M": 21, "3M": 63, "6M": 126, "1Y": 252, "5Y": Infinity };
const RANGES: Range[] = ["1M", "3M", "6M", "1Y", "5Y"];

const GREEN = "#327a48";
const GOLD = "#c2992f";
const DEEP = "#173a23";
const GRID = "rgba(120,130,110,0.18)";
const AXIS = "#8b8b95";

const tooltipStyle = {
  background: "#ffffff",
  border: "1px solid #e7e0d0",
  borderRadius: 12,
  fontFamily: '"Plus Jakarta Sans", sans-serif',
  fontSize: 12,
  color: "#20291f",
  boxShadow: "0 8px 24px rgba(40,50,30,0.12)",
};

function PriceChart({ chart, ticker }: { chart: ChartData; ticker: string }) {
  const [tab, setTab] = useState<Tab>("price");
  const [range, setRange] = useState<Range>("1Y");
  const [showBench, setShowBench] = useState(false);

  const hasBench = useMemo(() => (chart.benchmark ?? []).some((v) => v != null), [chart]);

  const allData = useMemo(
    () =>
      chart.dates.map((date, i) => ({
        date,
        close: chart.close[i],
        sma50: chart.sma50[i],
        sma200: chart.sma200[i],
        volume: chart.volume[i],
        bench: chart.benchmark?.[i] ?? null,
      })),
    [chart]
  );

  const data = useMemo(() => {
    const n = RANGE_DAYS[range];
    return n === Infinity ? allData : allData.slice(Math.max(0, allData.length - n));
  }, [allData, range]);

  // Normalized % change from the start of the visible range (for the benchmark overlay).
  const normData = useMemo(() => {
    if (!showBench) return [];
    const baseC = data.find((d) => d.close != null)?.close ?? null;
    const baseB = data.find((d) => d.bench != null)?.bench ?? null;
    return data.map((d) => ({
      date: d.date,
      stock: baseC && d.close != null ? (d.close / baseC - 1) * 100 : null,
      spx: baseB && d.bench != null ? (d.bench / baseB - 1) * 100 : null,
    }));
  }, [data, showBench]);

  const tickInterval = Math.max(1, Math.floor(data.length / 8));
  const benchMode = tab === "price" && showBench;

  const btn = (active: boolean) =>
    `cursor-pointer rounded-xl border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
      active ? "border-transparent bg-forest-800 text-cream-50" : "border-line bg-surface text-ink-muted hover:text-ink"
    }`;
  const pill = (active: boolean) =>
    `num cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-bold transition-colors ${
      active ? "border-transparent bg-forest-800 text-cream-50" : "border-line bg-surface text-ink-muted hover:text-ink"
    }`;

  return (
    <div className="card p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tb) => (
            <button key={tb.id} onClick={() => setTab(tb.id)} className={btn(tab === tb.id)}>
              {tb.label}
            </button>
          ))}
          {tab === "price" && hasBench && (
            <button onClick={() => setShowBench((s) => !s)} className={btn(showBench)}>
              vs S&P 500
            </button>
          )}
        </div>
        <div className="flex gap-1.5">
          {RANGES.map((r) => (
            <button key={r} onClick={() => setRange(r)} className={pill(range === r)}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="font-display text-base font-bold text-ink">
        {benchMode
          ? `${ticker} vs S&P 500 — % change · ${range}`
          : `${ticker} ${tab === "volume" ? "Trading Volume" : "Price & Moving Averages"} · ${range}`}
      </div>

      <ResponsiveContainer width="100%" height={380}>
        {tab === "volume" ? (
          <BarChart data={data} margin={{ top: 16, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="date" stroke={AXIS} tick={{ fontSize: 11 }} interval={tickInterval} />
            <YAxis stroke={AXIS} tick={{ fontSize: 11 }} width={48} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(50,122,72,0.08)" }} />
            <Bar dataKey="volume" fill={GREEN} radius={[2, 2, 0, 0]} />
          </BarChart>
        ) : benchMode ? (
          <LineChart data={normData} margin={{ top: 16, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="date" stroke={AXIS} tick={{ fontSize: 11 }} interval={tickInterval} />
            <YAxis stroke={AXIS} tick={{ fontSize: 11 }} width={48} unit="%" />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v.toFixed(1)}%`} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="stock" name={ticker} stroke={GREEN} strokeWidth={2.4} dot={false} />
            <Line type="monotone" dataKey="spx" name="S&P 500" stroke={GOLD} strokeWidth={2} dot={false} />
          </LineChart>
        ) : (
          <AreaChart data={data} margin={{ top: 16, right: 8, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="fillPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GREEN} stopOpacity={0.24} />
                <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="date" stroke={AXIS} tick={{ fontSize: 11 }} interval={tickInterval} />
            <YAxis stroke={AXIS} tick={{ fontSize: 11 }} width={48} domain={["auto", "auto"]} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="close" name="Close" stroke={GREEN} strokeWidth={2.4} fill="url(#fillPrice)" />
            <Line type="monotone" dataKey="sma50" name="50-Day Avg" stroke={GOLD} strokeWidth={1.8} dot={false} />
            <Line type="monotone" dataKey="sma200" name="200-Day Avg" stroke={DEEP} strokeWidth={1.8} dot={false} />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

export default memo(PriceChart);
