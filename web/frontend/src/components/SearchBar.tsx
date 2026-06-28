import { useState } from "react";
import { Icon } from "./Icon";

const SAMPLES = ["AAPL", "MSFT", "TSLA", "NVDA", "AMZN", "GOOGL", "META", "KO"];

// Larger pool of well-known tickers for the "Surprise me" button.
const SURPRISE_POOL = [
  "AAPL", "MSFT", "TSLA", "NVDA", "AMZN", "GOOGL", "META", "KO", "NFLX", "DIS",
  "AMD", "INTC", "JPM", "V", "MA", "WMT", "NKE", "SBUX", "PYPL", "UBER",
  "ADBE", "CRM", "ORCL", "IBM", "BA", "PEP", "MCD", "COST", "QCOM", "T",
];

export default function SearchBar({
  initial = "AAPL",
  loading,
  onSearch,
}: {
  initial?: string;
  loading: boolean;
  onSearch: (ticker: string) => void;
}) {
  const [value, setValue] = useState(initial);

  const submit = () => {
    const t = value.trim().toUpperCase();
    if (t) onSearch(t);
  };

  const surprise = () => {
    // Pick a random ticker different from the current one.
    let pick = value.trim().toUpperCase();
    while (pick === value.trim().toUpperCase()) {
      pick = SURPRISE_POOL[Math.floor(Math.random() * SURPRISE_POOL.length)];
    }
    setValue(pick);
    onSearch(pick);
  };

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted">
            <Icon name="search" size={18} />
          </span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Enter a ticker, e.g. AAPL"
            className="num w-full rounded-xl2 border border-line bg-surface py-3.5 pl-12 pr-3 font-bold uppercase tracking-wide text-ink shadow-card outline-none transition placeholder:font-medium placeholder:normal-case placeholder:text-ink-muted focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20"
          />
        </div>
        <button
          onClick={submit}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl2 bg-gradient-to-br from-forest-800 to-forest-600 px-7 py-3.5 font-bold text-cream-50 shadow-glow transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Icon name="trending-up" size={18} />
          {loading ? "Analyzing…" : "Analyze"}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-ink-muted">Try:</span>
        {SAMPLES.map((s) => (
          <button
            key={s}
            onClick={() => {
              setValue(s);
              onSearch(s);
            }}
            className="num cursor-pointer rounded-lg border border-line bg-panel px-2.5 py-1 text-xs font-bold text-ink-muted transition hover:border-forest-500/50 hover:bg-forest-tint hover:text-forest-800"
          >
            {s}
          </button>
        ))}
        <button
          onClick={surprise}
          className="ml-1 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gold-200 bg-gold-100 px-2.5 py-1 text-xs font-bold text-gold-700 transition hover:border-gold-400"
        >
          <Icon name="shuffle" size={13} />
          Surprise me
        </button>
      </div>
    </div>
  );
}
