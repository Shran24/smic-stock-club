// Tiny inline-SVG sparkline (no chart library — cheap to render per table cell).
// Green if the period ended higher than it started, red if lower.
export default function Sparkline({
  data,
  width = 104,
  height = 30,
}: {
  data: (number | null)[];
  width?: number;
  height?: number;
}) {
  const pts = data.filter((v): v is number => v != null);
  if (pts.length < 2) return <span className="text-xs text-ink-muted">—</span>;

  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const range = max - min || 1;
  const stepX = width / (pts.length - 1);
  const coords = pts
    .map((v, i) => `${(i * stepX).toFixed(1)},${(height - ((v - min) / range) * height).toFixed(1)}`)
    .join(" ");

  const up = pts[pts.length - 1] >= pts[0];
  const color = up ? "#2f8a4e" : "#c0503f";

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline
        points={coords}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
