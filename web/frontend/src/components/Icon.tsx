// Lucide-style line icons as a single reusable <Icon> component.
// (Same icon set used in the Streamlit version, ported to React.)

import * as React from "react";

const PATHS: Record<string, React.ReactNode> = {
  logo: <><path d="M3 3v18h18" /><path d="M19 9l-5 5-4-4-3 3" /></>,
  dollar: <><path d="M12 1v22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
  briefcase: <><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>,
  "trending-up": <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></>,
  activity: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
  building: <><rect x="3" y="2" width="18" height="20" rx="2" /><path d="M9 22v-4h6v4" /><path d="M9 6h.01M9 10h.01M9 14h.01M15 6h.01M15 10h.01M15 14h.01" /></>,
  tag: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><path d="M7 7h.01" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></>,
  factory: <><path d="M3 21h18" /><path d="M5 21V8l4 3V8l4 3V8l4 3v10" /><path d="M9 21v-4M13 21v-4" /></>,
  "arrow-up": <><path d="M12 19V5" /><path d="M5 12l7-7 7 7" /></>,
  "arrow-down": <><path d="M12 5v14" /><path d="M19 12l-7 7-7-7" /></>,
  coins: <><circle cx="8" cy="8" r="6" /><path d="M18.09 10.37A6 6 0 1 1 10.34 18" /><path d="M7 6h1v4" /><path d="M16.71 13.88l.71.71-2.83 2.83" /></>,
  "bar-chart": <><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></>,
  "line-chart": <><path d="M3 3v18h18" /><path d="M19 9l-5 5-4-4-3 3" /></>,
  target: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>,
  star: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" />,
  gauge: <><path d="M12 14l4-4" /><path d="M3.34 19a10 10 0 1 1 17.32 0" /></>,
  "pie-chart": <><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></>,
  search: <><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></>,
  scale: <><path d="M12 3v18" /><path d="M7 21h10" /><path d="M3 7h18" /><path d="M16 16l3-8 3 8c-2 1.5-4 1.5-6 0z" /><path d="M2 16l3-8 3 8c-2 1.5-4 1.5-6 0z" /></>,
  info: <><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></>,
  shuffle: <><path d="M16 3h5v5" /><path d="M4 20 21 3" /><path d="M21 16v5h-5" /><path d="M15 15l6 6" /><path d="M4 4l5 5" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
};

export function Icon({
  name,
  size = 20,
  strokeWidth = 2,
  className,
}: {
  name: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name] ?? PATHS.info}
    </svg>
  );
}
