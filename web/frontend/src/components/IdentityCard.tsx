import type { Identity } from "../types";
import CompanyLogo from "./CompanyLogo";
import { LiveDot } from "./anim";

// Branded header: the company logo (fetched from its web domain) or a clean
// monogram fallback, plus name and metadata chips.
function formatUpdated(fetchedAt: number | null): string | null {
  if (!fetchedAt) return null;
  const t = new Date(fetchedAt * 1000).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return `Updated ${t}`;
}

export default function IdentityCard({
  ticker,
  identity,
  fetchedAt,
}: {
  ticker: string;
  identity: Identity;
  fetchedAt: number | null;
}) {
  const chips = [identity.sector, identity.exchange].filter(Boolean) as string[];
  const updated = formatUpdated(fetchedAt);

  return (
    <div className="card flex items-center gap-5 p-5">
      <div className="flex h-16 w-16 flex-none items-center justify-center overflow-hidden rounded-2xl border border-line bg-surface">
        <CompanyLogo
          domain={identity.domain}
          ticker={ticker}
          imgClassName="h-11 w-11 object-contain"
          monogram={
            <span className="num text-[22px] font-extrabold text-gold-600">{ticker.slice(0, 2)}</span>
          }
        />
      </div>
      <div className="min-w-0">
        <div className="truncate font-display text-[30px] font-bold leading-tight text-ink">
          {identity.name}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="num rounded-full bg-forest-800 px-3 py-0.5 text-xs font-bold tracking-wide text-cream-50">
            {ticker}
          </span>
          {chips.map((c) => (
            <span key={c} className="chip">
              {c}
            </span>
          ))}
          <LiveDot label="Live" />
          {updated && <span className="text-[11px] font-medium text-ink-muted">· {updated}</span>}
        </div>
      </div>
    </div>
  );
}
