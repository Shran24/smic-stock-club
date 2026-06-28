import { useEffect, useState } from "react";

/* Becomes true one frame after mount — used to trigger grow-in transitions. */
export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setM(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return m;
}

/* Animates a number from 0 up to `value` (easeOutCubic) when it changes. */
export function CountUp({
  value,
  format,
  duration = 900,
  className,
}: {
  value: number | null;
  format: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === null) return;
    let raf = 0;
    const start = performance.now();
    const to = value;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(to * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  if (value === null) return <span className={className}>N/A</span>;
  return <span className={className}>{format(display)}</span>;
}

/* Small pulsing green "live" indicator. */
export function LiveDot({ label = "Live" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-pos">
      <span className="live-dot relative inline-block h-2 w-2 rounded-full bg-pos" />
      <span className="text-[11px] font-bold uppercase tracking-wide">{label}</span>
    </span>
  );
}

/* One shimmering placeholder block. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ""}`} />;
}

/* Full-dashboard shimmering skeleton shown while data loads. */
export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="card flex items-center gap-5 p-5">
        <Skeleton className="h-16 w-16 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card space-y-3 p-5">
            <Skeleton className="h-11 w-11 rounded-full" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-28" />
          </div>
        ))}
      </div>
      <Skeleton className="h-28 w-full rounded-xl2" />
      <Skeleton className="h-64 w-full rounded-xl2" />
    </div>
  );
}
