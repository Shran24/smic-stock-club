import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { searchSymbols } from "../api";
import type { SymbolMatch } from "../types";

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
  const [matches, setMatches] = useState<SymbolMatch[]>([]);
  const [open, setOpen] = useState(false);
  // Set when we change the input programmatically, so we don't re-open the
  // dropdown after picking a suggestion / sample.
  const skipSearch = useRef(false);

  useEffect(() => {
    if (skipSearch.current) {
      skipSearch.current = false;
      return;
    }
    const q = value.trim();
    if (q.length < 2) {
      setMatches([]);
      setOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const found = await searchSymbols(q);
        setMatches(found);
        setOpen(found.length > 0);
      } catch {
        setMatches([]);
        setOpen(false);
      }
    }, 250); // debounce typing
    return () => clearTimeout(timer);
  }, [value]);

  const submit = () => {
    const t = value.trim();
    if (!t) return;
    setOpen(false);
    onSearch(t); // backend resolves company names -> ticker
  };

  const pick = (m: SymbolMatch) => {
    skipSearch.current = true;
    setValue(m.symbol);
    setMatches([]);
    setOpen(false);
    onSearch(m.symbol);
  };

  const quickPick = (t: string) => {
    skipSearch.current = true;
    setValue(t);
    setMatches([]);
    setOpen(false);
    onSearch(t);
  };

  const surprise = () => {
    let pickTicker = value.trim().toUpperCase();
    while (pickTicker === value.trim().toUpperCase()) {
      pickTicker = SURPRISE_POOL[Math.floor(Math.random() * SURPRISE_POOL.length)];
    }
    quickPick(pickTicker);
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
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
              if (e.key === "Escape") setOpen(false);
            }}
            onFocus={() => matches.length > 0 && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Search a company or ticker — e.g. Apple or AAPL"
            className="w-full rounded-xl2 border border-line bg-surface py-3.5 pl-12 pr-3 font-bold tracking-wide text-ink shadow-card outline-none transition placeholder:font-medium placeholder:text-ink-muted focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20"
          />

          {open && matches.length > 0 && (
            <ul className="absolute z-40 mt-2 max-h-72 w-full overflow-auto rounded-xl2 border border-line bg-surface py-1 shadow-cardhover">
              {matches.map((m) => (
                <li key={m.symbol}>
                  <button
                    onMouseDown={(e) => e.preventDefault()} // keep focus so onBlur doesn't cancel
                    onClick={() => pick(m)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition hover:bg-panel"
                  >
                    <span className="truncate text-sm font-semibold text-ink">{m.name}</span>
                    <span className="num flex-none rounded-md bg-forest-tint px-2 py-0.5 text-xs font-bold text-forest-700 dark:text-forest-400">
                      {m.symbol}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
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
            onClick={() => quickPick(s)}
            className="num cursor-pointer rounded-lg border border-line bg-panel px-2.5 py-1 text-xs font-bold text-ink-muted transition hover:border-forest-500/50 hover:bg-forest-tint hover:text-forest-800"
          >
            {s}
          </button>
        ))}
        <button
          onClick={surprise}
          className="ml-1 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gold-200 bg-gold-100 px-2.5 py-1 text-xs font-bold text-gold-700 transition hover:border-gold-400 dark:text-gold-400"
        >
          <Icon name="shuffle" size={13} />
          Surprise me
        </button>
      </div>
    </div>
  );
}
