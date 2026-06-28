// Number-formatting helpers (ported from the Python utils.py so the React
// frontend formats financial figures exactly the same way).

const NA = "N/A";

export function fmtNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return NA;
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return NA;
  return "$" + value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtLargeNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return NA;
  const units: [number, string][] = [
    [1e12, "T"],
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "K"],
  ];
  for (const [threshold, suffix] of units) {
    if (Math.abs(value) >= threshold) {
      return "$" + (value / threshold).toFixed(2) + suffix;
    }
  }
  return "$" + value.toFixed(2);
}

/**
 * Format a value as a percentage.
 * @param alreadyPercent set true when the number is e.g. 12.5 meaning 12.5%.
 *        Otherwise we assume a fraction like 0.125 meaning 12.5%.
 */
export function fmtPercent(
  value: number | null | undefined,
  alreadyPercent = false
): string {
  if (value === null || value === undefined) return NA;
  const v = alreadyPercent ? value : value * 100;
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";
}

/** -1, 0, or +1 — used to color up/down deltas. */
export function sign(value: number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return value > 0 ? 1 : value < 0 ? -1 : 0;
}
