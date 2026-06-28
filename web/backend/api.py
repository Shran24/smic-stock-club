"""
api.py
======
FastAPI backend for the Stock Market Investment Club dashboard (React frontend).

This is a thin API layer. It does NOT re-implement any analysis — it reuses the
existing Python modules from the project root:
    - utils.py        (data fetching + technical indicators)
    - recommender.py  (scoring model, recommendation, explanations)

Endpoints:
    GET /api/health
    GET /api/analyze/{ticker}          -> full analysis for one stock
    GET /api/compare?tickers=A,B,C     -> compact comparison rows (up to 3)

Run with:
    uvicorn api:app --reload --port 8000
"""

import math
import os
import sys
from pathlib import Path
from urllib.parse import urlparse

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

# --- Make the project-root modules importable (utils/recommender/logos) ------
# api.py lives at  <root>/web/backend/api.py , so the project root is 2 up.
ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import utils          # noqa: E402  (import after sys.path tweak)
import recommender    # noqa: E402

# Trading-game modules
from db import Base, engine, get_db          # noqa: E402
import models                                # noqa: E402,F401  (registers tables)
import game                                  # noqa: E402
from auth import router as auth_router, current_user  # noqa: E402


app = FastAPI(title="Stock Market Club API", version="1.0.0")

# Signed-cookie sessions (used by Google OAuth + login). Set SESSION_SECRET in
# production; SESSION_HTTPS=1 once you're served over https.
app.add_middleware(
    SessionMiddleware,
    secret_key=os.environ.get("SESSION_SECRET", "dev-secret-change-me"),
    same_site="lax",
    https_only=os.environ.get("SESSION_HTTPS") == "1",
)

# Allow the Vite dev server (and the production build) to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# Create the database tables if they don't exist yet.
Base.metadata.create_all(bind=engine)
app.include_router(auth_router)


# ---------------------------------------------------------------------------
# JSON-SAFE HELPERS
# ---------------------------------------------------------------------------

def num(value):
    """Return a JSON-safe float (None for missing / NaN / infinite values)."""
    if value is None:
        return None
    try:
        f = float(value)
    except (TypeError, ValueError):
        return None
    if math.isnan(f) or math.isinf(f):
        return None
    return f


def series_to_list(series):
    """Convert a pandas Series of numbers into a JSON-safe list (NaN -> None)."""
    if series is None:
        return []
    return [num(v) for v in series.tolist()]


def domain_of(website):
    """
    Extract a bare domain (e.g. 'apple.com') from a company's website URL.
    The frontend uses this to fetch the company logo from a favicon service,
    so every company with a website gets a logo.
    """
    if not website:
        return None
    w = str(website).strip()
    if not w:
        return None
    if "://" not in w:
        w = "http://" + w
    host = urlparse(w).netloc.lower()
    if host.startswith("www."):
        host = host[4:]
    return host or None


# ---------------------------------------------------------------------------
# RESPONSE BUILDERS
# ---------------------------------------------------------------------------

def build_analysis(ticker: str):
    """Fetch + analyze one ticker and shape it into the JSON the frontend wants."""
    data = utils.fetch_stock(ticker)
    if not data["valid"]:
        return None

    info = data["info"]
    history = data["history"]
    tech = utils.build_technicals(history)
    result = recommender.analyze(info, tech)

    g = lambda key: utils.safe_get(info, key)  # noqa: E731  (terse local getter)

    # Price history for the charts (dates as ISO strings).
    dates = [d.strftime("%Y-%m-%d") for d in history.index]

    # Benchmark: S&P 500 (SPY), aligned to this stock's dates so the frontend
    # can overlay "did it beat the market?". SPY is cached, so this is cheap.
    benchmark = []
    if data["ticker"] != "SPY":
        try:
            spy = utils.fetch_stock("SPY")
            if spy["valid"] and "Close" in spy["history"]:
                spy_map = {
                    d.strftime("%Y-%m-%d"): num(v)
                    for d, v in zip(spy["history"].index, spy["history"]["Close"].tolist())
                }
                benchmark = [spy_map.get(d) for d in dates]
        except Exception:
            benchmark = []

    macd = tech.get("macd") or {}

    return {
        "ticker": data["ticker"],
        "valid": True,
        "fetchedAt": data.get("fetched_at"),  # epoch seconds, for "Last updated"
        "identity": {
            "name": g("longName") or g("shortName") or data["ticker"],
            "sector": g("sector"),
            "industry": g("industry"),
            "exchange": g("fullExchangeName") or g("exchange"),
            "domain": domain_of(g("website")),    # -> frontend builds the logo URL
        },
        "overview": {
            "price": tech.get("current_price"),
            "marketCap": num(g("marketCap")),
            "beta": num(g("beta")),
            "high52": num(g("fiftyTwoWeekHigh")),
            "low52": num(g("fiftyTwoWeekLow")),
            "dividendYield": num(g("dividendYield")),
        },
        "fundamentals": {
            "pe": num(g("trailingPE")),
            "forwardPe": num(g("forwardPE")),
            "eps": num(g("trailingEps")),
            "revenueGrowth": num(g("revenueGrowth")),
            "profitMargin": num(g("profitMargins")),
            "debtToEquity": num(g("debtToEquity")),
            "roe": num(g("returnOnEquity")),
            "freeCashFlow": num(g("freeCashflow")),
        },
        "technicals": {
            "sma50": tech.get("sma_50"),
            "sma200": tech.get("sma_200"),
            "rsi": tech.get("rsi"),
            "macdHist": macd.get("histogram"),
            "return1m": tech.get("return_1m"),
            "return3m": tech.get("return_3m"),
            "return6m": tech.get("return_6m"),
            "return1y": tech.get("return_1y"),
            "volumeTrend": tech.get("volume_trend"),
            "trend": utils.trend_label(tech),
        },
        "recommendation": {
            "label": result["recommendation"],
            "score": result["overall_score"],
            "confidence": result["confidence"],
            "categoryScores": result["category_scores"],
            "explanations": result["explanations"],
        },
        "chart": {
            "dates": dates,
            "close": series_to_list(history["Close"]) if "Close" in history else [],
            "sma50": series_to_list(tech.get("sma_50_series")),
            "sma200": series_to_list(tech.get("sma_200_series")),
            "volume": series_to_list(history["Volume"]) if "Volume" in history else [],
            "benchmark": benchmark,
        },
    }


def build_compare_row(ticker: str):
    """Compact summary row used by the comparison table."""
    data = utils.fetch_stock(ticker)
    if not data["valid"]:
        return None

    info = data["info"]
    tech = utils.build_technicals(data["history"])
    result = recommender.analyze(info, tech)

    # ~last 60 trading days of close prices, for a sparkline in the compare table.
    closes = series_to_list(data["history"]["Close"]) if "Close" in data["history"] else []
    spark = closes[-60:]

    return {
        "ticker": data["ticker"],
        "name": utils.safe_get(info, "longName") or utils.safe_get(info, "shortName") or data["ticker"],
        "domain": domain_of(utils.safe_get(info, "website")),
        "price": tech.get("current_price"),
        "pe": num(utils.safe_get(info, "trailingPE")),
        "eps": num(utils.safe_get(info, "trailingEps")),
        "revenueGrowth": num(utils.safe_get(info, "revenueGrowth")),
        "marketCap": num(utils.safe_get(info, "marketCap")),
        "return1y": tech.get("return_1y"),
        "score": result["overall_score"],
        "label": result["recommendation"],
        "confidence": result["confidence"],
        "spark": spark,
    }


# ---------------------------------------------------------------------------
# ROUTES
# ---------------------------------------------------------------------------

@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/analyze/{ticker}")
def analyze(ticker: str):
    payload = build_analysis(ticker)
    if payload is None:
        raise HTTPException(
            status_code=404,
            detail=f"Could not find data for '{ticker.upper()}'. "
                   "Please check the symbol and try again (e.g. AAPL, MSFT, TSLA).",
        )
    return payload


@app.get("/api/compare")
def compare(tickers: str = ""):
    symbols = [t.strip().upper() for t in tickers.split(",") if t.strip()][:3]
    if not symbols:
        raise HTTPException(status_code=400, detail="Provide 1-3 tickers, e.g. ?tickers=AAPL,MSFT,NVDA")

    rows, missing = [], []
    for sym in symbols:
        row = build_compare_row(sym)
        (rows if row else missing).append(row if row else sym)

    return {"rows": rows, "missing": missing}


# ---------------------------------------------------------------------------
# TRADING GAME ROUTES
# ---------------------------------------------------------------------------

class TradeIn(BaseModel):
    side: str       # "buy" or "sell"
    ticker: str
    shares: float


@app.get("/api/me")
def api_me(user=Depends(current_user)):
    """Who's logged in."""
    if not user:
        return {"authenticated": False}
    return {"authenticated": True, "name": user.name, "cash": user.cash}


@app.get("/api/portfolio")
def api_portfolio(user=Depends(current_user), db: Session = Depends(get_db)):
    if not user:
        raise HTTPException(401, "Log in to view your portfolio.")
    return game.portfolio(db, user)


@app.post("/api/trade")
def api_trade(payload: TradeIn, user=Depends(current_user), db: Session = Depends(get_db)):
    if not user:
        raise HTTPException(401, "Log in to trade.")
    try:
        if payload.side == "buy":
            game.buy(db, user, payload.ticker, payload.shares)
        elif payload.side == "sell":
            game.sell(db, user, payload.ticker, payload.shares)
        else:
            raise HTTPException(400, "side must be 'buy' or 'sell'.")
    except ValueError as e:
        raise HTTPException(400, str(e))
    return game.portfolio(db, user)


@app.get("/api/leaderboard")
def api_leaderboard(db: Session = Depends(get_db)):
    return game.leaderboard(db)


# ---------------------------------------------------------------------------
# SERVE THE BUILT REACT FRONTEND (single-process deployment)
# ---------------------------------------------------------------------------
# If the frontend has been built (web/frontend/dist), serve it from this same
# app so the whole thing runs on one port. Build it with:  npm run build
# This mount is added AFTER the /api routes so it never shadows them.
FRONTEND_DIST = ROOT / "web" / "frontend" / "dist"
if FRONTEND_DIST.is_dir():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="frontend")
