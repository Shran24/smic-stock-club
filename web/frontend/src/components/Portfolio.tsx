import { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import { fetchPortfolio } from "../api";
import type { Portfolio as P } from "../types";
import { fmtCurrency, fmtNumber, fmtPercent } from "../format";
import { Icon } from "./Icon";
import MagicStatCard from "./MagicStatCard";
import SectionHeader from "./SectionHeader";

export default function Portfolio() {
  const { me, openLogin } = useAuth();
  const [p, setP] = useState<P | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!me?.authenticated) return;
    setLoading(true);
    setErr(null);
    fetchPortfolio()
      .then(setP)
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed to load."))
      .finally(() => setLoading(false));
  }, [me?.authenticated]);

  if (!me?.authenticated) {
    return (
      <div className="card p-8 text-center">
        <p className="text-ink-muted">Log in to view your portfolio and play the game.</p>
        <button
          onClick={openLogin}
          className="mt-4 rounded-xl bg-gradient-to-br from-forest-800 to-forest-600 px-5 py-2.5 font-bold text-cream-50 shadow-glow"
        >
          Log in
        </button>
      </div>
    );
  }
  if (loading) return <div className="card p-8 text-center text-ink-muted">Loading your portfolio…</div>;
  if (err) return <div className="card p-6 text-neg">{err}</div>;
  if (!p) return null;

  const ret = p.totalReturnPct;
  const sign = ret > 0 ? 1 : ret < 0 ? -1 : 0;

  return (
    <div className="space-y-6">
      <SectionHeader icon="briefcase" title={`${p.name}'s Portfolio`} subtitle="Your trading-game holdings (play money)" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MagicStatCard icon={<Icon name="dollar" />} label="Total Value" value={fmtCurrency(p.totalValue)} />
        <MagicStatCard icon={<Icon name="coins" />} label="Cash" value={fmtCurrency(p.cash)} />
        <MagicStatCard
          icon={<Icon name="trending-up" />}
          label="Total Return"
          value={fmtPercent(ret, true)}
          deltaText={sign !== 0 ? "vs $100,000 start" : undefined}
          sign={sign}
        />
      </div>

      {p.holdings.length === 0 ? (
        <div className="card p-8 text-center text-ink-muted">
          No holdings yet. Search a stock and use its <span className="font-semibold text-ink">Trade</span> panel to buy your first shares.
        </div>
      ) : (
        <div className="card overflow-x-auto p-1">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs font-bold uppercase tracking-wide text-ink-muted">
                <th className="p-4">Ticker</th>
                <th className="p-4">Shares</th>
                <th className="p-4">Avg Cost</th>
                <th className="p-4">Price</th>
                <th className="p-4">Value</th>
                <th className="p-4">Profit / Loss</th>
              </tr>
            </thead>
            <tbody>
              {p.holdings.map((h) => (
                <tr key={h.ticker} className="border-b border-line/70">
                  <td className="num p-4 font-bold text-ink">{h.ticker}</td>
                  <td className="num p-4 text-ink">{fmtNumber(h.shares)}</td>
                  <td className="num p-4 text-ink">{fmtCurrency(h.avgCost)}</td>
                  <td className="num p-4 text-ink">{fmtCurrency(h.price)}</td>
                  <td className="num p-4 font-semibold text-ink">{fmtCurrency(h.value)}</td>
                  <td className={`num p-4 font-bold ${h.pl >= 0 ? "text-pos" : "text-neg"}`}>
                    {h.pl >= 0 ? "+" : ""}
                    {fmtCurrency(h.pl)} ({h.pl >= 0 ? "+" : ""}
                    {h.plPct.toFixed(1)}%)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
