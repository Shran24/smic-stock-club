"""
utils.py
========
Helper functions for the Stock Market Investment Club recommender app.

This module is responsible for:
  - Fetching stock data from Yahoo Finance (via the yfinance library)
  - Safely reading values that might be missing
  - Formatting numbers so they are easy to read
  - Calculating technical indicators (moving averages, RSI, MACD, etc.)

Everything here is written to be "safe": if a piece of data is missing,
the functions return None or a friendly "N/A" instead of crashing.
"""

import math
import os
import time
import datetime as dt

import numpy as np
import pandas as pd
import yfinance as yf

# Lightweight in-process TTL cache for fetched stock data. This works in BOTH
# the Streamlit app and the FastAPI backend: it keeps repeat lookups instant
# and smooths over occasional Yahoo Finance hiccups. (It replaces Streamlit's
# st.cache_data so the backend no longer emits a "no Streamlit runtime" warning.)
_CACHE: dict = {}
_CACHE_TTL_SECONDS = 900  # 15 minutes


def _ttl_cache(func):
    """Cache a single-arg fetch by ticker for _CACHE_TTL_SECONDS."""
    def wrapper(ticker):
        key = (ticker or "").strip().upper()
        now = time.time()
        cached = _CACHE.get(key)
        if cached and (now - cached[0]) < _CACHE_TTL_SECONDS:
            return cached[1]
        result = func(ticker)
        # Only cache successful lookups, so a transient failure can be retried.
        if isinstance(result, dict) and result.get("valid"):
            _CACHE[key] = (now, result)
        return result
    return wrapper


# ---------------------------------------------------------------------------
# 1. DATA FETCHING
# ---------------------------------------------------------------------------

# A browser-impersonating HTTP session helps bypass Yahoo's blocking of
# company-info requests from cloud-server IPs (e.g. Render). Falls back to a
# normal session if curl_cffi isn't available.
try:
    from curl_cffi import requests as _cffi_requests
    _CFFI_SESSION = _cffi_requests.Session(impersonate="chrome")
except Exception:
    _CFFI_SESSION = None


def _make_ticker(ticker: str):
    if _CFFI_SESSION is not None:
        try:
            return yf.Ticker(ticker, session=_CFFI_SESSION)
        except Exception:
            pass
    return yf.Ticker(ticker)


# --- Fundamentals fallback via Finnhub --------------------------------------
# Yahoo blocks company "info" from cloud IPs, so when FINNHUB_API_KEY is set we
# pull fundamentals from Finnhub and map them into the SAME keys/units yfinance
# uses, so the rest of the app (recommender, API) needs no changes.
import json as _json
import urllib.request as _urlreq

_FINNHUB_KEY = os.environ.get("FINNHUB_API_KEY")


def _finnhub(path: str):
    url = f"https://finnhub.io/api/v1/{path}&token={_FINNHUB_KEY}"
    with _urlreq.urlopen(url, timeout=10) as resp:
        return _json.loads(resp.read())


def fundamentals_from_finnhub(ticker: str) -> dict:
    """Return a yfinance-style 'info' dict from Finnhub, or {} if unavailable."""
    if not _FINNHUB_KEY:
        return {}
    out = {}
    try:
        p = _finnhub(f"stock/profile2?symbol={ticker}")
        if p.get("marketCapitalization"):
            out["marketCap"] = p["marketCapitalization"] * 1e6  # Finnhub reports millions
        if p.get("name"):
            out["longName"] = p["name"]
        if p.get("finnhubIndustry"):
            out["industry"] = p["finnhubIndustry"]
            out["sector"] = p["finnhubIndustry"]
        if p.get("weburl"):
            out["website"] = p["weburl"]
        if p.get("exchange"):
            out["exchange"] = p["exchange"]
    except Exception:
        pass
    try:
        m = _finnhub(f"stock/metric?symbol={ticker}&metric=all").get("metric", {})

        def g(*keys):
            for k in keys:
                v = m.get(k)
                if v is not None:
                    return v
            return None

        # ratios/values that match yfinance units directly
        out["trailingPE"] = g("peTTM", "peExclExtraTTM")
        out["trailingEps"] = g("epsTTM", "epsInclExtraItemsTTM", "epsBasicExclExtraItemsTTM")
        out["beta"] = g("beta")
        out["fiftyTwoWeekHigh"] = g("52WeekHigh")
        out["fiftyTwoWeekLow"] = g("52WeekLow")
        # Finnhub gives these as PERCENTS; yfinance uses fractions -> /100
        rg = g("revenueGrowthTTMYoy")
        if rg is not None:
            out["revenueGrowth"] = rg / 100.0
        pm = g("netProfitMarginTTM")
        if pm is not None:
            out["profitMargins"] = pm / 100.0
        roe = g("roeTTM")
        if roe is not None:
            out["returnOnEquity"] = roe / 100.0
        dy = g("dividendYieldIndicatedAnnual", "currentDividendYieldTTM")
        if dy is not None:
            out["dividendYield"] = dy / 100.0
        # Finnhub gives debt/equity as a ratio (1.5); yfinance uses 150 -> *100
        dte = g("totalDebt/totalEquityQuarterly", "totalDebt/totalEquityAnnual")
        if dte is not None:
            out["debtToEquity"] = dte * 100.0
    except Exception:
        pass

    return {k: v for k, v in out.items() if v is not None}


@_ttl_cache
def fetch_stock(ticker: str):
    """
    Download everything we need for one ticker symbol.

    Returns a dictionary with:
        - "info":    company info dictionary from yfinance
        - "history": a DataFrame of ~1 year of daily prices
        - "valid":   True if we found usable data, else False

    We cache the result for 15 minutes (ttl=900 seconds) so the app feels
    fast and we do not hammer the Yahoo Finance servers.
    """
    ticker = (ticker or "").strip().upper()
    # fetched_at = when this data was actually pulled from Yahoo. It travels
    # with the cached result, so the UI can show honest data freshness.
    result = {"ticker": ticker, "info": {}, "history": pd.DataFrame(),
              "valid": False, "fetched_at": time.time()}

    if not ticker:
        return result

    try:
        stock = _make_ticker(ticker)

        # Pull 5 years of daily price history so the chart can offer
        # 1M / 3M / 6M / 1Y / 5Y ranges (the frontend slices client-side).
        history = stock.history(period="5y", interval="1d")

        # Company info (PE, market cap, etc.). Yahoo sometimes blocks this from
        # cloud IPs, so try a couple of times before giving up.
        info = {}
        for _attempt in range(2):
            try:
                info = stock.info or {}
            except Exception:
                info = {}
            if info.get("marketCap") is not None or info.get("trailingPE") is not None or info.get("shortName"):
                break
            stock = _make_ticker(ticker)  # fresh attempt

        # If Yahoo blocked the fundamentals (common on cloud IPs), fill them in
        # from Finnhub. yfinance values win where present; Finnhub fills gaps.
        if not info.get("marketCap"):
            fh = fundamentals_from_finnhub(ticker)
            if fh:
                info = {**fh, **info}

        # A ticker is only "valid" if we actually got price history back.
        if history is None or history.empty:
            return result

        result["info"] = info
        result["history"] = history
        result["valid"] = True
        return result

    except Exception:
        # Any network / parsing error just means "no data".
        return result


# ---------------------------------------------------------------------------
# 2. SAFE VALUE HELPERS
# ---------------------------------------------------------------------------

def safe_get(info: dict, key: str, default=None):
    """
    Read a value from the yfinance info dictionary without crashing.

    yfinance sometimes returns None, an empty string, or the literal
    "Infinity" for missing data, so we clean those up here.
    """
    if not info:
        return default
    value = info.get(key, default)
    if value is None or value == "" or value == "Infinity":
        return default
    # Filter out NaN floats.
    if isinstance(value, float) and math.isnan(value):
        return default
    return value


def format_number(value, default="N/A"):
    """Format a plain number with thousands separators (e.g. 12,345)."""
    if value is None:
        return default
    try:
        return f"{value:,.2f}"
    except (ValueError, TypeError):
        return default


def format_currency(value, default="N/A"):
    """Format a value as US dollars (e.g. $123.45)."""
    if value is None:
        return default
    try:
        return f"${value:,.2f}"
    except (ValueError, TypeError):
        return default


def format_large_number(value, default="N/A"):
    """
    Turn a big number into a short, human-friendly string.

    Examples:
        2,500,000,000  ->  $2.50B
        7,300,000      ->  $7.30M
    """
    if value is None:
        return default
    try:
        value = float(value)
    except (ValueError, TypeError):
        return default

    for threshold, suffix in [(1e12, "T"), (1e9, "B"), (1e6, "M"), (1e3, "K")]:
        if abs(value) >= threshold:
            return f"${value / threshold:,.2f}{suffix}"
    return f"${value:,.2f}"


def format_percent(value, default="N/A", already_percent=False):
    """
    Format a value as a percentage.

    Set already_percent=True if the number is, say, 12.5 meaning 12.5%.
    Otherwise we assume it is a fraction like 0.125 meaning 12.5%.
    """
    if value is None:
        return default
    try:
        value = float(value)
        if not already_percent:
            value *= 100
        return f"{value:,.2f}%"
    except (ValueError, TypeError):
        return default


# ---------------------------------------------------------------------------
# 3. TECHNICAL INDICATORS
# ---------------------------------------------------------------------------

def moving_average(prices: pd.Series, window: int):
    """Simple Moving Average (SMA) over the given window of days."""
    if prices is None or len(prices) < window:
        return None
    return prices.rolling(window=window).mean()


def latest_value(series: pd.Series):
    """Return the most recent non-missing value of a Series, or None."""
    if series is None or len(series) == 0:
        return None
    cleaned = series.dropna()
    if cleaned.empty:
        return None
    return float(cleaned.iloc[-1])


def calculate_rsi(prices: pd.Series, period: int = 14):
    """
    Relative Strength Index (RSI).

    RSI is a number from 0 to 100 that measures momentum:
        - Above 70  -> the stock may be "overbought" (risen a lot, fast)
        - Below 30  -> the stock may be "oversold" (fallen a lot, fast)
        - Around 50 -> neutral

    Returns the most recent RSI value, or None if not enough data.
    """
    if prices is None or len(prices) < period + 1:
        return None

    delta = prices.diff()
    gains = delta.clip(lower=0)
    losses = -delta.clip(upper=0)

    avg_gain = gains.rolling(window=period).mean()
    avg_loss = losses.rolling(window=period).mean()

    # Avoid dividing by zero.
    rs = avg_gain / avg_loss.replace(0, np.nan)
    rsi = 100 - (100 / (1 + rs))
    return latest_value(rsi)


def calculate_macd(prices: pd.Series, fast=12, slow=26, signal=9):
    """
    Moving Average Convergence Divergence (MACD).

    MACD compares a fast and a slow moving average to spot momentum shifts.
    We return a small dictionary with the MACD line, the signal line, and the
    histogram (MACD minus signal). When the histogram is positive, momentum is
    generally turning upward; when negative, downward.
    """
    if prices is None or len(prices) < slow + signal:
        return None

    ema_fast = prices.ewm(span=fast, adjust=False).mean()
    ema_slow = prices.ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    histogram = macd_line - signal_line

    return {
        "macd": latest_value(macd_line),
        "signal": latest_value(signal_line),
        "histogram": latest_value(histogram),
    }


def price_change_over(prices: pd.Series, trading_days: int):
    """
    Percentage price change over roughly the last `trading_days` days.

    We use trading days (about 21 per month) rather than calendar days
    because the market is closed on weekends and holidays.
    Returns a percentage like 8.3 (meaning +8.3%), or None.
    """
    if prices is None or len(prices) <= trading_days:
        return None
    cleaned = prices.dropna()
    if len(cleaned) <= trading_days:
        return None

    start = cleaned.iloc[-(trading_days + 1)]
    end = cleaned.iloc[-1]
    if start == 0:
        return None
    return (end - start) / start * 100.0


def volume_trend(history: pd.DataFrame):
    """
    Compare recent average volume to the longer-term average volume.

    Returns a percentage difference: positive means trading activity is
    picking up, negative means it is cooling down.
    """
    if history is None or "Volume" not in history or history["Volume"].empty:
        return None

    vol = history["Volume"].dropna()
    if len(vol) < 50:
        return None

    recent = vol.iloc[-10:].mean()    # last ~2 weeks
    longer = vol.iloc[-50:].mean()    # last ~10 weeks
    if longer == 0:
        return None
    return (recent - longer) / longer * 100.0


def build_technicals(history: pd.DataFrame):
    """
    Bundle all technical indicators into one tidy dictionary.

    This is the single function app.py and recommender.py call to get
    every technical number at once.
    """
    tech = {
        "current_price": None,
        "sma_50": None,
        "sma_200": None,
        "rsi": None,
        "macd": None,
        "volume_trend": None,
        "return_1m": None,
        "return_3m": None,
        "return_6m": None,
        "return_1y": None,
        "sma_50_series": None,
        "sma_200_series": None,
    }

    if history is None or history.empty or "Close" not in history:
        return tech

    close = history["Close"]

    tech["current_price"] = latest_value(close)

    sma50 = moving_average(close, 50)
    sma200 = moving_average(close, 200)
    tech["sma_50_series"] = sma50
    tech["sma_200_series"] = sma200
    tech["sma_50"] = latest_value(sma50)
    tech["sma_200"] = latest_value(sma200)

    tech["rsi"] = calculate_rsi(close)
    tech["macd"] = calculate_macd(close)
    tech["volume_trend"] = volume_trend(history)

    # ~21 trading days per month.
    tech["return_1m"] = price_change_over(close, 21)
    tech["return_3m"] = price_change_over(close, 63)
    tech["return_6m"] = price_change_over(close, 126)
    tech["return_1y"] = price_change_over(close, 251)

    return tech


def trend_label(tech: dict):
    """
    Turn the moving averages into a plain-English trend description.

    Logic (simple and transparent):
        - Price above both the 50-day and 200-day average -> Upward
        - Price below both averages                       -> Downward
        - Otherwise                                       -> Sideways
    """
    price = tech.get("current_price")
    sma50 = tech.get("sma_50")
    sma200 = tech.get("sma_200")

    if price is None or sma50 is None or sma200 is None:
        return "Not enough data to judge the trend"

    if price > sma50 and price > sma200:
        return "Upward trend"
    if price < sma50 and price < sma200:
        return "Downward trend"
    return "Sideways / mixed trend"
