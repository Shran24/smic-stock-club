import { useEffect, useMemo, useState } from "react";

// Renders a company logo with a robust fallback chain so EVERY company shows one:
//   1. Financial Modeling Prep (keyed by ticker — works without a website)
//   2. DuckDuckGo icon (keyed by web domain)
//   3. Google favicon (keyed by web domain)
//   4. ticker monogram
function candidatesFor(ticker: string, domain: string | null): string[] {
  const list: string[] = [];
  if (ticker) {
    list.push(`https://financialmodelingprep.com/image-stock/${encodeURIComponent(ticker)}.png`);
  }
  if (domain) {
    list.push(`https://icons.duckduckgo.com/ip3/${domain}.ico`);
    list.push(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`);
  }
  return list;
}

export default function CompanyLogo({
  domain,
  ticker,
  imgClassName,
  monogram,
}: {
  domain: string | null;
  ticker: string;
  imgClassName?: string;
  monogram: React.ReactNode;
}) {
  const candidates = useMemo(() => candidatesFor(ticker, domain), [ticker, domain]);
  const [idx, setIdx] = useState(0);

  // Reset to the first source whenever the company changes.
  useEffect(() => setIdx(0), [ticker, domain]);

  if (candidates.length === 0 || idx >= candidates.length) {
    return <>{monogram}</>;
  }

  return (
    <img
      src={candidates[idx]}
      alt={`${ticker} logo`}
      loading="lazy"
      onError={() => setIdx((i) => i + 1)}
      className={imgClassName}
    />
  );
}
