// Tiny API client. In dev, Vite proxies /api -> http://localhost:8000 (see
// vite.config.ts); in production the same FastAPI process serves both. We send
// credentials so the session cookie (login) rides along.

import type { Analysis, CompareRow, Me, Portfolio, LeaderRow } from "./types";

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(await errorDetail(res));
  return res.json() as Promise<T>;
}

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await errorDetail(res));
  return res.json() as Promise<T>;
}

async function errorDetail(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (body?.detail) return body.detail;
  } catch {
    /* ignore */
  }
  return `Request failed (${res.status})`;
}

// --- Stock data ---
export const fetchAnalysis = (ticker: string) =>
  getJSON<Analysis>(`/api/analyze/${encodeURIComponent(ticker)}`);

export const fetchComparison = (tickers: string[]) =>
  getJSON<{ rows: CompareRow[]; missing: string[] }>(
    `/api/compare?tickers=${encodeURIComponent(tickers.join(","))}`
  );

// --- Auth ---
export const fetchMe = () => getJSON<Me>("/api/me");
export const signup = (username: string, password: string) =>
  postJSON<{ name: string }>("/auth/signup", { username, password });
export const login = (username: string, password: string) =>
  postJSON<{ name: string }>("/auth/login", { username, password });
export const logout = () => postJSON<{ ok: boolean }>("/auth/logout", {});

// --- Trading game ---
export const fetchPortfolio = () => getJSON<Portfolio>("/api/portfolio");
export const trade = (side: "buy" | "sell", ticker: string, shares: number) =>
  postJSON<Portfolio>("/api/trade", { side, ticker, shares });
export const fetchLeaderboard = () => getJSON<LeaderRow[]>("/api/leaderboard");

// Admin only — remove a player and their data.
export async function deleteUser(name: string): Promise<{ removed: string }> {
  const res = await fetch(`/api/admin/users/${encodeURIComponent(name)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await errorDetail(res));
  return res.json();
}

// Admin only — reset a player's password (for forgotten logins).
export const resetPassword = (name: string, password: string) =>
  postJSON<{ reset: string }>(`/api/admin/users/${encodeURIComponent(name)}/reset-password`, { password });
