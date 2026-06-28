import { useState } from "react";
import { useAuth } from "../AuthContext";
import { trade } from "../api";
import { fmtCurrency } from "../format";

// Buy/sell panel for the game, shown on a stock's analysis.
export default function TradePanel({ ticker, price }: { ticker: string; price: number | null }) {
  const { me, refresh, openLogin } = useAuth();
  const [shares, setShares] = useState("1");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (!me?.authenticated) {
    return (
      <div className="card flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <div className="font-display text-lg font-bold text-ink">Play the trading game</div>
          <p className="text-sm text-ink-muted">
            Log in to buy or sell {ticker} with $100,000 in play money and climb the leaderboard.
          </p>
        </div>
        <button
          onClick={openLogin}
          className="rounded-xl bg-gradient-to-br from-forest-800 to-forest-600 px-5 py-2.5 font-bold text-cream-50 shadow-glow transition hover:-translate-y-0.5"
        >
          Log in to trade
        </button>
      </div>
    );
  }

  const doTrade = async (side: "buy" | "sell") => {
    const n = parseFloat(shares);
    if (!n || n <= 0) {
      setMsg({ type: "err", text: "Enter a positive number of shares." });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const p = await trade(side, ticker, n);
      setMsg({ type: "ok", text: `${side === "buy" ? "Bought" : "Sold"} ${n} ${ticker}. Cash: ${fmtCurrency(p.cash)}` });
      await refresh();
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Trade failed." });
    } finally {
      setBusy(false);
    }
  };

  const est = price && parseFloat(shares) ? price * parseFloat(shares) : null;

  return (
    <div className="card p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="font-display text-lg font-bold text-ink">
          Trade {ticker} <span className="text-sm font-semibold text-ink-muted">(game)</span>
        </div>
        <div className="text-sm text-ink-muted">
          Buying power: <span className="num font-bold text-ink">{fmtCurrency(me.cash ?? 0)}</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="number"
          min="0"
          value={shares}
          onChange={(e) => setShares(e.target.value)}
          className="num w-28 rounded-xl border border-line bg-panel px-3 py-2.5 text-ink outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20"
        />
        <span className="text-sm text-ink-muted">
          shares {est != null && <>· ≈ <span className="num font-semibold text-ink">{fmtCurrency(est)}</span></>}
        </span>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => doTrade("buy")}
            disabled={busy}
            className="rounded-xl bg-gradient-to-br from-forest-800 to-forest-600 px-6 py-2.5 font-bold text-cream-50 shadow-glow transition hover:-translate-y-0.5 disabled:opacity-60"
          >
            Buy
          </button>
          <button
            onClick={() => doTrade("sell")}
            disabled={busy}
            className="rounded-xl border border-line bg-surface px-6 py-2.5 font-bold text-ink transition hover:border-neg/50 disabled:opacity-60"
          >
            Sell
          </button>
        </div>
      </div>
      {msg && (
        <p className={`mt-3 rounded-lg px-3 py-2 text-sm ${msg.type === "ok" ? "bg-pos/10 text-pos" : "bg-neg/10 text-neg"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
