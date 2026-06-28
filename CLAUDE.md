# SMIC — Stock Market Investment Club app

Handoff / orientation doc. A new Claude Code session reads this automatically.
**The source of truth is the code in this repo** (also on GitHub) — not any chat history.

## What this is
An educational stock app for a high-school investment club, with two parts:
1. **Stock analyzer** — enter a ticker → company overview, fundamentals (explained
   in plain English with Good/Fair/Weak chips), technicals, a 0–100 recommendation,
   charts (price/volume, 1M–5Y range, S&P 500 overlay), and a 3-stock compare.
2. **Trading game** — members sign up, get $100,000 play money, buy/sell at live
   prices, and compete on a leaderboard. Admins can remove players & reset passwords.

## Two codebases
- **`/` (root)** — the ORIGINAL Streamlit app (`app.py` + `utils.py` + `recommender.py`
  + `logos.py`). Still works (`streamlit run app.py`) but the React app below is canonical.
- **`/web`** — the CANONICAL full-stack app that is deployed:
  - `web/backend/` — FastAPI (`api.py`) that serves the API **and** the built frontend.
    - `db.py` (SQLAlchemy; SQLite locally, Postgres in prod via `DATABASE_URL`)
    - `models.py` (User, Holding, Transaction; `STARTING_BALANCE=100000`)
    - `game.py` (buy/sell at live price, portfolio valuation, leaderboard)
    - `auth.py` (username+password, PBKDF2 hashing, signed-cookie sessions, admin helpers)
    - It imports `utils.py`/`recommender.py`/`logos.py` from the repo root.
  - `web/frontend/` — Vite + React + TypeScript + Tailwind.
    - Theme: cream + forest-green + gold; serif (Fraunces) headings + Plus Jakarta Sans.
    - **Dark mode** = `.dark` class on `<html>` + CSS variables in `src/index.css`
      (tokens in `tailwind.config.js` reference `rgb(var(--x))`). Toggle saved in localStorage.
    - Key components in `src/components/`; auth state in `src/AuthContext.tsx`.

## Run locally (Windows / PowerShell)
One process (FastAPI serves the built frontend):
```powershell
cd "C:\Users\shaan\SMIC Python\web\frontend"; npm install; npm run build
cd "C:\Users\shaan\SMIC Python\web\backend"; py -m pip install -r requirements.txt
py -m uvicorn api:app --port 8000   # open http://localhost:8000
```
Helper: `web\run.ps1`. Dev mode (hot reload): run vite (`npm run dev`, :5173) + uvicorn
with `--reload`; vite proxies `/api` to :8000.
**After any frontend change you must `npm run build` for :8000 to reflect it.**

## Environment variables
| Var | Purpose |
|-----|---------|
| `DATABASE_URL` | Postgres in prod (Neon). Falls back to local SQLite `game.db`. `postgres://` is auto-normalized to `postgresql://`. |
| `SESSION_SECRET` | Signs login cookies. Required in prod. |
| `SESSION_HTTPS` | `1` in prod (secure cookies over https). |
| `ADMIN_USERS` | Comma-separated usernames who get admin powers (Remove / Reset PW). Currently `Shaan Patel`. |
| `FINNHUB_API_KEY` | Fundamentals source. Yahoo blocks `.info` from cloud IPs, so `utils.fundamentals_from_finnhub` fills P/E, EPS, margins, etc. from Finnhub (mapped to yfinance keys/units). Price/charts still come from yfinance `history()`. |
| `ALLOW_DEV_LOGIN` | LOCAL ONLY. `1` enables `/auth/dev-login` for testing. Never set in prod. |

## API (all under `/api`, plus `/auth`)
`GET /api/analyze/{ticker}`, `GET /api/compare?tickers=`, `GET /api/health`,
`POST /auth/signup|login|logout`, `GET /api/me`, `GET /api/portfolio`,
`POST /api/trade {side,ticker,shares}`, `GET /api/leaderboard`,
`DELETE /api/admin/users/{name}` (admin), `POST /api/admin/users/{name}/reset-password` (admin),
`POST /api/change-password {currentPassword,newPassword}`.

## Deployment (live 24/7)
- **GitHub:** https://github.com/Shran24/smic-stock-club  (push → Render auto-redeploys)
- **Host:** Render Web Service, **Docker** (root `Dockerfile`, multi-stage: build frontend → run backend).
- **Database:** Neon (free, permanent Postgres) via `DATABASE_URL`.
- **Keep-alive:** UptimeRobot pings `/api/health` every 5 min (avoids free-tier cold starts).
- **Live URL:** https://smic-stock-club.onrender.com  (don't rename the Render service — it changes the URL).
- Custom domain: not set up (optional).

## Gotchas learned the hard way
- **Rebuild `dist`** after frontend edits (or Render rebuilds it via Docker on deploy).
- **Tailwind config changes need a dev-server restart** (Vite doesn't hot-reload it).
- yfinance is an unofficial scraper — flaky; `utils.fetch_stock` has a 15-min TTL cache.
- Mascot images (`web/frontend/public/bull.png`,`bear.png`) had gray-grid backgrounds removed
  via **color keying** (gray bg removed, warm animal kept); referenced with `?v=N` to cache-bust.
- Render free tier sleeps when idle (UptimeRobot mitigates).
- Don't commit `node_modules`, `dist`, `game.db`, or `.claude/` (see `.gitignore`).

## Tests
`tests/test_recommender.py` covers the scoring model (run with `pytest` or `python tests/test_recommender.py`).
