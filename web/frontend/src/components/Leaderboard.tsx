import { useEffect, useState } from "react";
import { fetchLeaderboard, deleteUser } from "../api";
import { useAuth } from "../AuthContext";
import type { LeaderRow } from "../types";
import { fmtCurrency } from "../format";
import SectionHeader from "./SectionHeader";

const MEDAL = ["🥇", "🥈", "🥉"];

export default function Leaderboard() {
  const { me } = useAuth();
  const [rows, setRows] = useState<LeaderRow[] | null>(null);

  const load = () => fetchLeaderboard().then(setRows).catch(() => setRows([]));
  useEffect(() => {
    load();
  }, []);

  const remove = async (name: string) => {
    if (!window.confirm(`Remove "${name}" from the game? This permanently deletes their account and holdings.`)) return;
    try {
      await deleteUser(name);
      await load();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Could not remove player.");
    }
  };

  if (!rows) return <div className="card p-8 text-center text-ink-muted">Loading leaderboard…</div>;

  return (
    <div className="space-y-5">
      <SectionHeader icon="star" title="Leaderboard" subtitle="Everyone starts with $100,000 — highest total value wins" />
      {rows.length === 0 ? (
        <div className="card p-8 text-center text-ink-muted">No players yet. Be the first to log in and start trading!</div>
      ) : (
        <div className="card overflow-x-auto p-1">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs font-bold uppercase tracking-wide text-ink-muted">
                <th className="p-4">Rank</th>
                <th className="p-4">Player</th>
                <th className="p-4">Total Value</th>
                <th className="p-4">Return</th>
                {me?.isAdmin && <th className="p-4 text-right">Admin</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isMe = me?.authenticated && me.name === r.name;
                return (
                  <tr
                    key={r.name}
                    className={`border-b border-line/70 ${isMe ? "bg-forest-tint/60" : ""}`}
                  >
                    <td className="p-4 text-lg">{MEDAL[r.rank - 1] ?? <span className="num font-bold text-ink-muted">#{r.rank}</span>}</td>
                    <td className="p-4 font-bold text-ink">
                      {r.name} {isMe && <span className="text-xs font-semibold text-forest-600">(you)</span>}
                    </td>
                    <td className="num p-4 font-semibold text-ink">{fmtCurrency(r.totalValue)}</td>
                    <td className={`num p-4 font-bold ${r.returnPct >= 0 ? "text-pos" : "text-neg"}`}>
                      {r.returnPct >= 0 ? "+" : ""}
                      {r.returnPct.toFixed(2)}%
                    </td>
                    {me?.isAdmin && (
                      <td className="p-4 text-right">
                        {!isMe && (
                          <button
                            onClick={() => remove(r.name)}
                            className="cursor-pointer rounded-lg border border-neg/40 px-3 py-1 text-xs font-bold text-neg transition hover:bg-neg/10"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
