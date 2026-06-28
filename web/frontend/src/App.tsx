import { useEffect, useState, type ReactNode } from "react";
import type { Analysis, CompareRow } from "./types";
import { fetchAnalysis, fetchComparison } from "./api";
import { fmtCurrency, fmtLargeNumber, fmtPercent, fmtNumber, sign } from "./format";

import { Icon } from "./components/Icon";
import SectionHeader from "./components/SectionHeader";
import SearchBar from "./components/SearchBar";
import IdentityCard from "./components/IdentityCard";
import MagicStatCard from "./components/MagicStatCard";
import RecommendationBadge from "./components/RecommendationBadge";
import ScoreBreakdown from "./components/ScoreBreakdown";
import Fundamentals from "./components/Fundamentals";
import Technicals from "./components/Technicals";
import PriceChart from "./components/PriceChart";
import CompareTable from "./components/CompareTable";
import CompanyLogo from "./components/CompanyLogo";
import TradePanel from "./components/TradePanel";
import Portfolio from "./components/Portfolio";
import Leaderboard from "./components/Leaderboard";
import ChangePasswordModal from "./components/ChangePasswordModal";
import { CountUp, DashboardSkeleton } from "./components/anim";
import { useAuth } from "./AuthContext";

const DISCLAIMER =
  "This tool is for educational purposes only and should not be used as professional financial advice. It cannot predict the future. Always do your own research before making real investment decisions.";

/* ---- small descriptive helpers (for the stat-card subtitles) ---- */
function capCategory(marketCap: number | null): string {
  if (marketCap === null) return "Market cap";
  if (marketCap >= 2e12) return "Mega Cap";
  if (marketCap >= 1e10) return "Large Cap";
  if (marketCap >= 2e9) return "Mid Cap";
  if (marketCap >= 3e8) return "Small Cap";
  return "Micro Cap";
}
function volatilityDesc(beta: number | null): string {
  if (beta === null) return "Volatility";
  if (beta < 0.8) return "Low volatility";
  if (beta <= 1.2) return "Moderate volatility";
  return "High volatility";
}

/* ------------------------------------------------------------------ */
/*  Reusable bits                                                      */
/* ------------------------------------------------------------------ */

// Always-on aurora background: soft green / gold / deep-green blobs that
// slowly drift and breathe behind the whole app (pure CSS, GPU-friendly).
function AnimatedBackground() {
  return (
    <div className="aurora" aria-hidden="true">
      <div className="aurora-blob aurora-gold-top" />
      <div className="aurora-blob aurora-gold" />
      <div className="aurora-blob aurora-deep" />
    </div>
  );
}

// Club logo: shows the SMIC image from public/smic-logo.png; if that file is
// not present yet, it falls back to the green tile + chart icon.
function BrandMark() {
  const [imgOk, setImgOk] = useState(true);
  if (imgOk) {
    return (
      <img
        src="/smic-logo.png"
        alt="SMIC logo"
        onError={() => setImgOk(false)}
        className="h-14 w-14 flex-none rounded-2xl object-cover shadow-glow"
      />
    );
  }
  return (
    <div className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-forest-800 text-cream-50 shadow-glow">
      <Icon name="logo" size={30} strokeWidth={2.2} />
    </div>
  );
}

// User-toggled dark mode. Defaults to light; the choice is saved in the browser
// and applied before paint by the inline script in index.html (no flash).
function ThemeToggle() {
  const [dark, setDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* ignore */
    }
  };
  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-ink-muted shadow-card transition hover:text-ink"
    >
      <Icon name={dark ? "sun" : "moon"} size={18} />
    </button>
  );
}

function Hero() {
  return (
    <div className="relative mb-5 overflow-hidden rounded-[24px] border border-line bg-surface p-6 shadow-card sm:px-8">
      <ThemeToggle />
      {/* soft decorative blobs */}
      <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-forest-tint/70 blur-2xl" />
      <div className="pointer-events-none absolute -right-4 top-10 h-40 w-40 rounded-full bg-gold-100/80 blur-2xl" />
      <div className="relative flex items-center gap-5">
        <BrandMark />
        <div>
          <h1 className="font-display text-[30px] font-bold tracking-tight text-ink sm:text-[36px]">
            Stock Market Investment Club
          </h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            Educational Stock Recommender — learn how investors evaluate stocks.
          </p>
          <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-gold-200 bg-gold-100 px-3 py-1 text-[11.5px] font-bold uppercase tracking-wide text-gold-700 dark:text-gold-400">
            <Icon name="info" size={13} />
            For educational use only · Not financial advice
          </span>
        </div>
      </div>
    </div>
  );
}

// Plain-English one-line verdict built from the category scores + trend.
const STRONG: Record<string, string> = {
  Valuation: "an attractive valuation",
  Growth: "strong growth",
  Profitability: "high profitability",
  "Financial Health": "a solid balance sheet",
  "Technical Trend": "positive momentum",
};
const WEAK: Record<string, string> = {
  Valuation: "a stretched valuation",
  Growth: "weak growth",
  Profitability: "thin profitability",
  "Financial Health": "a strained balance sheet",
  "Technical Trend": "weak momentum",
};

function buildVerdict(scores: Record<string, number>, trend: string): string {
  const entries = Object.entries(scores);
  if (!entries.length) return "";
  const best = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
  const worst = entries.reduce((a, b) => (b[1] < a[1] ? b : a));
  const t = trend.toLowerCase();
  const trendPhrase = t.includes("up") ? "trending upward" : t.includes("down") ? "trending downward" : "moving sideways";

  let s = `Shows ${STRONG[best[0]] ?? "balanced fundamentals"}`;
  if (worst[0] !== best[0] && worst[1] < 55) s += `, but ${WEAK[worst[0]]}`;
  return `${s}. The stock is ${trendPhrase}.`;
}

// Slim bar that pins ticker + price + score to the top once you scroll down.
function StickyHeader({ data }: { data: Analysis }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 340);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div
      className={`fixed inset-x-0 top-0 z-30 border-b border-line bg-surface/95 backdrop-blur transition-transform duration-300 ${
        show ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-2 truncate">
          <span className="num font-extrabold text-ink">{data.ticker}</span>
          <span className="truncate text-sm text-ink-muted">{data.identity.name}</span>
        </div>
        <div className="flex flex-none items-center gap-3">
          <span className="num font-bold text-ink">{fmtCurrency(data.overview.price)}</span>
          <span className="num rounded-full bg-forest-800 px-2.5 py-0.5 text-xs font-bold text-cream-50">
            {data.recommendation.score}/100 · {data.recommendation.label}
          </span>
        </div>
      </div>
    </div>
  );
}

// Welcome / empty state shown before any stock is analyzed.
const TRENDING = ["AAPL", "NVDA", "MSFT", "TSLA", "AMZN", "GOOGL"];
function Landing({ onPick }: { onPick: (t: string) => void }) {
  return (
    <div className="card p-8 text-center">
      <h3 className="font-display text-2xl font-bold text-ink">Analyze any stock</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">
        Search a ticker above, or jump into one of these to see the full educational breakdown.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {TRENDING.map((t) => (
          <button
            key={t}
            onClick={() => onPick(t)}
            className="flex cursor-pointer flex-col items-center gap-2 rounded-xl2 border border-line bg-panel p-4 transition hover:-translate-y-0.5 hover:border-forest-500/40 hover:shadow-card"
          >
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-line bg-surface">
              <CompanyLogo domain={null} ticker={t} imgClassName="h-6 w-6 object-contain"
                monogram={<span className="num text-xs font-bold text-gold-600">{t.slice(0, 2)}</span>} />
            </span>
            <span className="num text-sm font-bold text-ink">{t}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Banner({ tone, children }: { tone: "warn" | "error" | "info"; children: ReactNode }) {
  const styles = {
    warn: "border-gold-200 bg-gold-100/70 text-ink-soft",
    error: "border-neg/30 bg-neg/10 text-neg",
    info: "border-forest-400/40 bg-forest-tint text-ink-soft",
  }[tone];
  return <div className={`rounded-xl2 border px-4 py-3 text-sm ${styles}`}>{children}</div>;
}

/* ------------------------------------------------------------------ */
/*  Analyze view                                                       */
/* ------------------------------------------------------------------ */

function AnalyzeView() {
  const [data, setData] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (ticker: string) => {
    setLoading(true);
    setError(null);
    try {
      const a = await fetchAnalysis(ticker);
      setData(a);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SearchBar initial="AAPL" loading={loading} onSearch={run} />

      {loading && <DashboardSkeleton />}

      {!loading && error && <Banner tone="error">{error}</Banner>}

      {!loading && !error && !data && <Landing onPick={run} />}

      {!loading && !error && data && (
        <div className="space-y-8">
          <StickyHeader data={data} />
          <IdentityCard ticker={data.ticker} identity={data.identity} fetchedAt={data.fetchedAt} />

          {/* Hero stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MagicStatCard
              icon={<Icon name="dollar" />}
              label="Current Price"
              value={<CountUp value={data.overview.price} format={fmtCurrency} />}
              sub="Market data"
            />
            <MagicStatCard
              icon={<Icon name="briefcase" />}
              label="Market Cap"
              value={<CountUp value={data.overview.marketCap} format={fmtLargeNumber} />}
              sub={capCategory(data.overview.marketCap)}
            />
            <MagicStatCard
              icon={<Icon name="trending-up" />}
              label="1-Year Return"
              value={<CountUp value={data.technicals.return1y} format={(n) => fmtPercent(n, true)} />}
              deltaText={
                data.technicals.return1y === null
                  ? undefined
                  : data.technicals.return1y > 0
                  ? "Up over 12 months"
                  : "Down over 12 months"
              }
              sign={sign(data.technicals.return1y)}
            />
            <MagicStatCard
              icon={<Icon name="activity" />}
              label="Volatility (Beta)"
              value={<CountUp value={data.overview.beta} format={fmtNumber} />}
              sub={volatilityDesc(data.overview.beta)}
            />
          </div>

          {/* "$1,000 invested" callout */}
          {data.technicals.return1y !== null && (
            <div className="card flex flex-wrap items-center justify-between gap-2 px-5 py-4">
              <span className="text-sm text-ink-soft">
                <span className="font-bold text-ink">$1,000 invested</span> one year ago would be worth
              </span>
              <span
                className={`num text-lg font-extrabold ${
                  data.technicals.return1y >= 0 ? "text-pos" : "text-neg"
                }`}
              >
                {fmtCurrency(1000 * (1 + data.technicals.return1y / 100))} (
                {data.technicals.return1y >= 0 ? "+" : ""}
                {data.technicals.return1y.toFixed(1)}%)
              </span>
            </div>
          )}

          {/* Trading game: buy/sell this stock */}
          <TradePanel ticker={data.ticker} price={data.overview.price} />

          {/* Recommendation */}
          <section className="cv-auto">
            <SectionHeader
              icon="target"
              title="Educational Recommendation"
              subtitle="A transparent score — not a guaranteed pick"
            />
            <p className="mb-4 text-[15px] font-medium text-ink-soft">
              {buildVerdict(data.recommendation.categoryScores, data.technicals.trend)}
            </p>
            <RecommendationBadge rec={data.recommendation} />
            <div className="card mt-4 p-5">
              <h4 className="mb-2 font-display text-lg font-bold text-ink">Why this score?</h4>
              <ul className="space-y-1.5 text-sm text-ink-soft">
                {data.recommendation.explanations.map((b, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-0.5 flex-none text-forest-600">
                      <Icon name="target" size={15} />
                    </span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Company overview */}
          <section className="cv-auto">
            <SectionHeader
              icon="building"
              title="Company Overview"
              subtitle="Who this company is and how it's priced"
            />
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <MagicStatCard icon={<Icon name="arrow-up" />} label="52-Week High" value={fmtCurrency(data.overview.high52)} />
              <MagicStatCard icon={<Icon name="arrow-down" />} label="52-Week Low" value={fmtCurrency(data.overview.low52)} />
              <MagicStatCard
                icon={<Icon name="coins" />}
                label="Dividend Yield"
                value={data.overview.dividendYield === null ? "N/A" : fmtPercent(data.overview.dividendYield)}
              />
              <MagicStatCard
                icon={<Icon name="factory" />}
                label="Industry"
                value={<span className="text-base">{data.identity.industry ?? "N/A"}</span>}
              />
            </div>
          </section>

          {/* Fundamentals */}
          <section className="cv-auto">
            <SectionHeader
              icon="bar-chart"
              title="Fundamental Analysis"
              subtitle="The key numbers, each explained in plain language"
            />
            <Fundamentals f={data.fundamentals} />
          </section>

          {/* Technicals + score breakdown */}
          <section className="cv-auto">
            <SectionHeader
              icon="line-chart"
              title="Trend & Technical Analysis"
              subtitle="What the price chart and momentum are doing"
            />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
              <Technicals t={data.technicals} />
              <ScoreBreakdown scores={data.recommendation.categoryScores} />
            </div>
          </section>

          {/* Charts */}
          <section className="cv-auto">
            <SectionHeader icon="pie-chart" title="Visualizations" subtitle="Price, moving averages, and volume" />
            <PriceChart chart={data.chart} ticker={data.ticker} />
          </section>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Compare view                                                       */
/* ------------------------------------------------------------------ */

function CompareView() {
  const [inputs, setInputs] = useState(["AAPL", "MSFT", "NVDA"]);
  const [rows, setRows] = useState<CompareRow[] | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    const tickers = inputs.map((t) => t.trim().toUpperCase()).filter(Boolean);
    if (!tickers.length) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchComparison(tickers);
      setRows(res.rows);
      setMissing(res.missing);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setRows(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-muted">Compare up to 3 stocks side by side.</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {inputs.map((v, i) => (
          <input
            key={i}
            value={v}
            onChange={(e) => {
              const next = [...inputs];
              next[i] = e.target.value;
              setInputs(next);
            }}
            placeholder={`Stock ${i + 1}`}
            className="num rounded-xl2 border border-line bg-surface px-4 py-3 font-bold uppercase text-ink shadow-card outline-none transition focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20"
          />
        ))}
      </div>
      <button
        onClick={run}
        disabled={loading}
        className="flex items-center gap-2 rounded-xl2 bg-gradient-to-br from-forest-800 to-forest-600 px-7 py-3 font-bold text-cream-50 shadow-glow transition hover:-translate-y-0.5 disabled:opacity-60"
      >
        <Icon name="scale" size={18} />
        {loading ? "Comparing…" : "Compare"}
      </button>

      {error && <Banner tone="error">{error}</Banner>}
      {missing.length > 0 && (
        <Banner tone="warn">Could not find data for: {missing.join(", ")} (skipped).</Banner>
      )}
      {rows && rows.length > 0 && <CompareTable rows={rows} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Root                                                               */
/* ------------------------------------------------------------------ */

const TABS = [
  { id: "analyze", label: "Analyze a Stock" },
  { id: "compare", label: "Compare Stocks" },
  { id: "portfolio", label: "My Portfolio" },
  { id: "leaderboard", label: "Leaderboard" },
] as const;
type TabId = (typeof TABS)[number]["id"];

// Login / logout control shown in the tab bar.
function AuthControl() {
  const { me, doLogout, openLogin } = useAuth();
  const [showChangePw, setShowChangePw] = useState(false);
  if (me?.authenticated) {
    return (
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-ink-muted sm:inline">
          Hi, <span className="font-bold text-ink">{me.name}</span> · {fmtCurrency(me.cash ?? 0)}
        </span>
        <button
          onClick={() => setShowChangePw(true)}
          className="hidden cursor-pointer rounded-xl border border-line bg-surface px-4 py-2 text-sm font-bold text-ink-muted transition hover:text-ink sm:inline-block"
        >
          Change password
        </button>
        <button
          onClick={doLogout}
          className="cursor-pointer rounded-xl border border-line bg-surface px-4 py-2 text-sm font-bold text-ink-muted transition hover:text-ink"
        >
          Log out
        </button>
        {showChangePw && <ChangePasswordModal onClose={() => setShowChangePw(false)} />}
      </div>
    );
  }
  return (
    <button
      onClick={openLogin}
      className="cursor-pointer rounded-xl bg-gradient-to-br from-forest-800 to-forest-600 px-4 py-2 text-sm font-bold text-cream-50 shadow-glow transition hover:-translate-y-0.5"
    >
      Log in to play
    </button>
  );
}

export default function App() {
  const [tab, setTab] = useState<TabId>("analyze");

  return (
    <div className="mx-auto max-w-[1380px] px-4 py-8 sm:px-6">
      <AnimatedBackground />
      <Hero />
      <div className="mb-6">
        <Banner tone="warn">{DISCLAIMER}</Banner>
      </div>

      {/* Tabs + auth control */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`cursor-pointer rounded-xl2 border px-5 py-2.5 text-sm font-bold transition-colors ${
                tab === t.id
                  ? "border-transparent bg-forest-800 text-cream-50 shadow-glow"
                  : "border-line bg-surface text-ink-muted hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <AuthControl />
      </div>

      {tab === "analyze" && <AnalyzeView />}
      {tab === "compare" && <CompareView />}
      {tab === "portfolio" && <Portfolio />}
      {tab === "leaderboard" && <Leaderboard />}

      <footer className="mt-12 border-t border-line pt-6 text-center text-xs text-ink-muted">
        This tool is for educational purposes only and should not be used as professional financial
        advice. It does not predict the future and the recommendations are not guaranteed. · Data:
        Yahoo Finance (yfinance). · Company logos shown for identification only.
      </footer>
    </div>
  );
}
