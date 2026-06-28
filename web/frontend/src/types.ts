// Shape of the JSON returned by the FastAPI backend (api.py).

export interface Identity {
  name: string;
  sector: string | null;
  industry: string | null;
  exchange: string | null;
  domain: string | null;
}

export interface Overview {
  price: number | null;
  marketCap: number | null;
  beta: number | null;
  high52: number | null;
  low52: number | null;
  dividendYield: number | null;
}

export interface Fundamentals {
  pe: number | null;
  forwardPe: number | null;
  eps: number | null;
  revenueGrowth: number | null;
  profitMargin: number | null;
  debtToEquity: number | null;
  roe: number | null;
  freeCashFlow: number | null;
}

export interface Technicals {
  sma50: number | null;
  sma200: number | null;
  rsi: number | null;
  macdHist: number | null;
  return1m: number | null;
  return3m: number | null;
  return6m: number | null;
  return1y: number | null;
  volumeTrend: number | null;
  trend: string;
}

export interface Recommendation {
  label: string;
  score: number;
  confidence: string;
  categoryScores: Record<string, number>;
  explanations: string[];
}

export interface ChartData {
  dates: string[];
  close: (number | null)[];
  sma50: (number | null)[];
  sma200: (number | null)[];
  volume: (number | null)[];
  benchmark: (number | null)[];
}

export interface Analysis {
  ticker: string;
  valid: boolean;
  fetchedAt: number | null;
  identity: Identity;
  overview: Overview;
  fundamentals: Fundamentals;
  technicals: Technicals;
  recommendation: Recommendation;
  chart: ChartData;
}

// --- Trading game ---

export interface Me {
  authenticated: boolean;
  name?: string;
  cash?: number;
  isAdmin?: boolean;
}

export interface PortfolioHolding {
  ticker: string;
  shares: number;
  avgCost: number;
  price: number | null;
  value: number;
  pl: number;
  plPct: number;
}

export interface Portfolio {
  name: string;
  cash: number;
  holdingsValue: number;
  totalValue: number;
  totalReturnPct: number;
  holdings: PortfolioHolding[];
}

export interface LeaderRow {
  rank: number;
  name: string;
  totalValue: number;
  returnPct: number;
}

export interface CompareRow {
  ticker: string;
  name: string;
  domain: string | null;
  price: number | null;
  pe: number | null;
  eps: number | null;
  revenueGrowth: number | null;
  marketCap: number | null;
  return1y: number | null;
  score: number;
  label: string;
  confidence: string;
  spark: (number | null)[];
}
