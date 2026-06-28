"""
app.py
======
Stock Market Investment Club — Educational Stock Recommender
============================================================

A beginner-friendly Streamlit web app with a modern, professional
"fintech dashboard" look (dark OLED theme, orange accent, SVG line icons,
and tabular monospace numerals for financial figures).

  1. Takes a stock ticker symbol from the user
  2. Shows a company overview
  3. Explains the key fundamental metrics in student-friendly language
  4. Analyzes price trends and technical indicators
  5. Produces an EDUCATIONAL recommendation with a 0-100 score and confidence
  6. Explains WHY it gave that rating
  7. Draws charts
  8. Lets the user compare up to 3 stocks side by side

  >>> EDUCATIONAL USE ONLY. NOT FINANCIAL ADVICE. <<<

Design language follows the "ui-ux-pro-max" dashboard recommendations:
dark mode, no emoji icons (SVG instead), smooth transitions, visible focus,
status colors (green/amber/red), and data-friendly typography.

Run with:
    pip install -r requirements.txt
    streamlit run app.py
"""

import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
import streamlit as st

import utils
import recommender
from logos import get_logo  # real brand logos (SVG) fetched via the 21st.dev Magic MCP


# ---------------------------------------------------------------------------
# PAGE SETUP & BRAND TOKENS
# ---------------------------------------------------------------------------

st.set_page_config(
    page_title="Stock Market Club — Recommender",
    page_icon="📈",
    layout="wide",
)

# Brand color tokens (dark dashboard + orange accent).
ORANGE = "#ff6b2c"
ORANGE_SOFT = "#ff8c54"
AMBER = "#f5a524"
VIOLET = "#7c5cff"
BLUE = "#4aa8ff"
GREEN = "#2ecf6f"
RED = "#ff5c5c"
TEXT_MUTED = "#8b8b95"

DISCLAIMER = (
    "This tool is for educational purposes only and should not be used "
    "as professional financial advice. It cannot predict the future. Always "
    "do your own research and talk to a qualified adult or professional before "
    "making real investment decisions."
)

SAMPLE_TICKERS = ["AAPL", "MSFT", "TSLA", "NVDA", "AMZN", "GOOGL", "META", "KO"]


# ---------------------------------------------------------------------------
# SVG ICON SET (Lucide-style line icons — no emojis, per design guidance)
# ---------------------------------------------------------------------------

ICONS = {
    "logo": '<path d="M3 3v18h18"/><path d="M19 9l-5 5-4-4-3 3"/>',
    "dollar": '<path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    "briefcase": '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    "trending-up": '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
    "activity": '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    "building": '<rect x="3" y="2" width="18" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M9 6h.01M9 10h.01M9 14h.01M15 6h.01M15 10h.01M15 14h.01"/>',
    "tag": '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><path d="M7 7h.01"/>',
    "grid": '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
    "factory": '<path d="M3 21h18"/><path d="M5 21V8l4 3V8l4 3V8l4 3v10"/><path d="M9 21v-4M13 21v-4"/>',
    "arrow-up": '<path d="M12 19V5"/><path d="M5 12l7-7 7 7"/>',
    "arrow-down": '<path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/>',
    "coins": '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="M16.71 13.88l.71.71-2.83 2.83"/>',
    "bar-chart": '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
    "line-chart": '<path d="M3 3v18h18"/><path d="M19 9l-5 5-4-4-3 3"/>',
    "target": '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    "star": '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/>',
    "gauge": '<path d="M12 14l4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
    "pie-chart": '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
    "search": '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>',
    "scale": '<path d="M12 3v18"/><path d="M7 21h10"/><path d="M3 7h18"/><path d="M16 16l3-8 3 8c-2 1.5-4 1.5-6 0z"/><path d="M2 16l3-8 3 8c-2 1.5-4 1.5-6 0z"/>',
    "info": '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    "percent": '<line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
}


def svg(name, size=20, width=2):
    """Return an inline SVG icon that inherits its color from CSS (currentColor)."""
    path = ICONS.get(name, ICONS["info"])
    return (
        f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" '
        f'stroke="currentColor" stroke-width="{width}" stroke-linecap="round" '
        f'stroke-linejoin="round">{path}</svg>'
    )


# ---------------------------------------------------------------------------
# THEME / CSS
# ---------------------------------------------------------------------------

def inject_css():
    """Inject the custom stylesheet that gives the app its polished dark look."""
    st.markdown(
        """
        <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap');

        :root {
            --orange:#ff6b2c; --orange-soft:#ff8c54; --green:#2ecf6f; --red:#ff5c5c;
            --muted:#8b8b95; --card-border:rgba(255,255,255,0.07);
        }

        /* ---- Global ---- */
        html, body, [class*="css"], .stApp { font-family:'Inter', -apple-system, sans-serif; }
        .stApp {
            background:
                radial-gradient(1100px 520px at 100% -5%, rgba(255,107,44,0.12), transparent 55%),
                radial-gradient(900px 480px at -5% 105%, rgba(124,92,255,0.12), transparent 50%),
                #0b0b0e;
        }
        .block-container { padding-top:2rem; padding-bottom:3.5rem; max-width:1380px; }
        /* tabular monospace numerals for any financial figure */
        .num, .stat-card .val, [data-testid="stMetricValue"] {
            font-family:'JetBrains Mono', ui-monospace, monospace;
            font-variant-numeric: tabular-nums;
            letter-spacing:-0.4px;
        }

        /* ---- Sidebar ---- */
        [data-testid="stSidebar"] {
            background:#101013; border-right:1px solid var(--card-border);
        }

        /* ---- Hero banner ---- */
        .app-hero {
            display:flex; align-items:center; gap:18px;
            background:
                linear-gradient(135deg, rgba(255,107,44,0.20), rgba(124,92,255,0.16)),
                #131317;
            border:1px solid rgba(255,255,255,0.09);
            border-radius:24px; padding:24px 30px; margin-bottom:18px;
            box-shadow:0 18px 44px rgba(0,0,0,0.45);
        }
        .app-hero .logo {
            width:56px; height:56px; border-radius:16px; color:#fff; flex:none;
            display:flex; align-items:center; justify-content:center;
            background:linear-gradient(135deg, var(--orange), var(--orange-soft));
            box-shadow:0 10px 24px rgba(255,107,44,0.40);
        }
        .app-hero h1 { margin:0; font-size:29px; font-weight:800; letter-spacing:-0.6px; }
        .app-hero p  { margin:3px 0 0; color:#c7c7d2; font-size:14.5px; }
        .app-hero .pill {
            display:inline-block; margin-top:9px; padding:5px 13px; border-radius:999px;
            background:rgba(255,107,44,0.16); color:#ffb48f; font-size:11.5px; font-weight:600;
            border:1px solid rgba(255,107,44,0.35); letter-spacing:0.2px;
        }

        /* ---- Section headers ---- */
        .section-head { display:flex; align-items:center; gap:13px; margin:6px 0 16px; }
        .section-head .ic {
            width:44px; height:44px; border-radius:13px; color:#fff; flex:none;
            display:flex; align-items:center; justify-content:center;
            background:linear-gradient(135deg, var(--orange), var(--orange-soft));
            box-shadow:0 8px 18px rgba(255,107,44,0.32);
        }
        .section-head .tx h3 { margin:0; font-size:20px; font-weight:700; letter-spacing:-0.3px; }
        .section-head .tx p  { margin:1px 0 0; font-size:13px; color:var(--muted); }

        /* ---- Stat cards ---- */
        .stat-card {
            position:relative; overflow:hidden; height:100%;
            background:linear-gradient(180deg, #1c1c20, #141417);
            border:1px solid var(--card-border); border-radius:18px; padding:18px 18px 16px;
            box-shadow:0 10px 26px rgba(0,0,0,0.30);
            transition:transform .15s ease, border-color .15s ease, box-shadow .15s ease;
        }
        .stat-card:hover {
            transform:translateY(-2px); border-color:rgba(255,107,44,0.30);
            box-shadow:0 16px 32px rgba(0,0,0,0.40);
        }
        .stat-card .ic {
            width:40px; height:40px; border-radius:12px; margin-bottom:13px; color:#fff;
            display:flex; align-items:center; justify-content:center;
            background:linear-gradient(135deg, var(--orange), var(--orange-soft));
            box-shadow:0 6px 14px rgba(255,107,44,0.30);
        }
        .stat-card .lbl { color:var(--muted); font-size:12.5px; font-weight:500; text-transform:uppercase; letter-spacing:0.5px; }
        .stat-card .val { font-size:25px; font-weight:700; margin-top:3px; color:#f3f3f7; }
        .stat-card .dlt { font-size:12px; font-weight:600; margin-top:6px; display:flex; align-items:center; gap:4px; }
        .dlt.pos { color:var(--green); } .dlt.neg { color:var(--red); } .dlt.neu { color:var(--muted); }

        /* ---- Native st.metric -> mini card ---- */
        [data-testid="stMetric"] {
            background:linear-gradient(180deg, #1a1a1e, #141417);
            border:1px solid var(--card-border); border-radius:14px; padding:14px 16px;
            transition:border-color .15s ease;
        }
        [data-testid="stMetric"]:hover { border-color:rgba(255,107,44,0.22); }
        [data-testid="stMetricLabel"] p { color:var(--muted) !important; font-weight:500; font-size:12.5px; }
        [data-testid="stMetricValue"] { font-weight:700; color:#f3f3f7; }

        /* ---- Recommendation badge ---- */
        .rec-badge {
            position:relative; overflow:hidden; border-radius:20px; padding:24px 26px; color:#fff;
            box-shadow:0 18px 40px rgba(0,0,0,0.45);
        }
        .rec-badge .sub { font-size:12.5px; opacity:0.92; font-weight:600; text-transform:uppercase; letter-spacing:0.6px; }
        .rec-badge .big { font-size:36px; font-weight:800; margin-top:4px; letter-spacing:-0.6px; }
        .rec-badge .ring {
            position:absolute; right:-30px; top:-30px; width:130px; height:130px; border-radius:50%;
            background:rgba(255,255,255,0.10);
        }

        /* ---- Buttons ---- */
        .stButton > button {
            border-radius:12px; font-weight:600; cursor:pointer;
            border:1px solid rgba(255,255,255,0.10);
            transition:transform .08s ease, box-shadow .18s ease, filter .15s ease;
        }
        .stButton > button:hover { transform:translateY(-1px); box-shadow:0 10px 22px rgba(255,107,44,0.30); }
        .stButton > button:focus-visible { outline:2px solid var(--orange); outline-offset:2px; }
        .stButton > button[kind="primary"] {
            background:linear-gradient(135deg, var(--orange), var(--orange-soft)); border:none; color:#fff;
        }

        /* ---- Inputs ---- */
        [data-testid="stTextInput"] input {
            background:#16161a; border-radius:12px; border:1px solid rgba(255,255,255,0.10); color:#f3f3f7;
        }
        [data-testid="stTextInput"] input:focus { border-color:var(--orange); box-shadow:0 0 0 3px rgba(255,107,44,0.20); }

        /* ---- Tabs ---- */
        [data-baseweb="tab-list"] { gap:6px; border-bottom:none; }
        [data-baseweb="tab"] {
            background:#16161a; border-radius:12px 12px 0 0; padding:9px 20px; cursor:pointer;
            border:1px solid var(--card-border); font-weight:600;
        }
        [aria-selected="true"][data-baseweb="tab"] {
            background:linear-gradient(135deg, rgba(255,107,44,0.28), rgba(255,140,84,0.18));
            border-color:rgba(255,107,44,0.45);
        }

        /* ---- Misc ---- */
        /* ---- Company identity banner (with real brand logo from Magic) ---- */
        .idcard {
            display:flex; align-items:center; gap:18px; margin:2px 0 4px;
            background:linear-gradient(180deg, #1c1c20, #141417);
            border:1px solid var(--card-border); border-radius:18px; padding:16px 20px;
            box-shadow:0 10px 26px rgba(0,0,0,0.30);
        }
        .idlogo {
            width:64px; height:64px; border-radius:16px; flex:none; color:#f3f3f7;
            display:flex; align-items:center; justify-content:center;
            background:linear-gradient(180deg, #232328, #18181c);
            border:1px solid rgba(255,255,255,0.08);
        }
        .idlogo svg { width:38px; height:38px; }
        .idlogo .mono { font-family:'JetBrains Mono', monospace; font-weight:700; font-size:22px; color:#ff8c54; }
        .idname { font-size:23px; font-weight:800; letter-spacing:-0.4px; line-height:1.15; }
        .idmeta { margin-top:6px; display:flex; gap:8px; flex-wrap:wrap; }
        .idchip {
            font-size:11.5px; font-weight:600; padding:3px 10px; border-radius:999px;
            background:rgba(255,255,255,0.06); border:1px solid var(--card-border); color:#c7c7d2;
        }
        .idchip.ticker { background:rgba(255,107,44,0.16); border-color:rgba(255,107,44,0.35); color:#ffb48f; font-family:'JetBrains Mono', monospace; }

        [data-testid="stExpander"] { border:1px solid var(--card-border); border-radius:14px; background:#141417; }
        [data-testid="stProgress"] > div > div > div { background:linear-gradient(90deg, var(--orange), var(--orange-soft)); }
        hr { border-color:var(--card-border); }
        ::-webkit-scrollbar { width:10px; height:10px; }
        ::-webkit-scrollbar-thumb { background:#2c2c34; border-radius:10px; }
        ::-webkit-scrollbar-thumb:hover { background:#3a3a44; }
        @media (prefers-reduced-motion: reduce) { * { transition:none !important; } }
        </style>
        """,
        unsafe_allow_html=True,
    )


# ---------------------------------------------------------------------------
# UI BUILDING BLOCKS
# ---------------------------------------------------------------------------

def section_header(icon, title, subtitle=""):
    """Render a styled section header with an SVG icon badge."""
    st.markdown(
        f'<div class="section-head"><div class="ic">{svg(icon, 22)}</div>'
        f'<div class="tx"><h3>{title}</h3><p>{subtitle}</p></div></div>',
        unsafe_allow_html=True,
    )


def _delta_html(delta_text, sign):
    """Build the small colored delta line for a stat card."""
    if delta_text is None:
        return ""
    cls = "pos" if sign > 0 else ("neg" if sign < 0 else "neu")
    arrow = svg("arrow-up", 13) if sign > 0 else (svg("arrow-down", 13) if sign < 0 else "")
    return f'<div class="dlt {cls}">{arrow}{delta_text}</div>'


def stat_card(icon, label, value, delta_text=None, sign=0):
    """Return the HTML for one polished stat card (SVG icon + label + value)."""
    return (
        f'<div class="stat-card"><div class="ic">{svg(icon, 20)}</div>'
        f'<div class="lbl">{label}</div>'
        f'<div class="val">{value}</div>'
        f'{_delta_html(delta_text, sign)}</div>'
    )


def render_card_row(cards):
    """Render a list of stat_card HTML strings as an evenly-spaced row."""
    cols = st.columns(len(cards))
    for col, html in zip(cols, cards):
        col.markdown(html, unsafe_allow_html=True)


def style_fig(fig, height=420):
    """Apply the shared dark theme to any Plotly figure."""
    fig.update_layout(
        template="plotly_dark",
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font=dict(family="Inter, sans-serif", color="#c7c7d2", size=13),
        height=height,
        margin=dict(l=10, r=10, t=50, b=10),
        legend=dict(bgcolor="rgba(0,0,0,0)"),
        title=dict(font=dict(size=16, color="#f3f3f7")),
        hoverlabel=dict(font=dict(family="JetBrains Mono, monospace")),
    )
    fig.update_xaxes(gridcolor="rgba(255,255,255,0.06)", zeroline=False)
    fig.update_yaxes(gridcolor="rgba(255,255,255,0.06)", zeroline=False)
    return fig


# ---------------------------------------------------------------------------
# SHARED HELPER: load + analyze one ticker
# ---------------------------------------------------------------------------

def load_and_analyze(ticker: str):
    """Fetch data for one ticker and run the full analysis (or None if invalid)."""
    data = utils.fetch_stock(ticker)
    if not data["valid"]:
        return None

    info = data["info"]
    history = data["history"]
    tech = utils.build_technicals(history)
    result = recommender.analyze(info, tech)

    return {
        "ticker": data["ticker"],
        "info": info,
        "history": history,
        "tech": tech,
        "result": result,
    }


def recommendation_gradient(label: str):
    """Pick a friendly gradient for each recommendation label."""
    return {
        "Strong Buy": "linear-gradient(135deg,#137a3a,#27c25f)",
        "Buy": "linear-gradient(135deg,#2c8c44,#43c46a)",
        "Hold": "linear-gradient(135deg,#b8901f,#e0bd3a)",
        "Weak Hold / Watchlist": "linear-gradient(135deg,#c2641f,#ff8c54)",
        "Avoid": "linear-gradient(135deg,#a52f24,#e0564b)",
    }.get(label, "linear-gradient(135deg,#444,#666)")


def _sign(value):
    """Return -1, 0, or +1 for a number (used to color deltas)."""
    if value is None:
        return 0
    return 1 if value > 0 else (-1 if value < 0 else 0)


# ---------------------------------------------------------------------------
# SECTION RENDERERS
# ---------------------------------------------------------------------------

def render_identity(ticker, info):
    """
    Branded header showing the real company logo (from the Magic MCP logo set)
    or a clean monogram fallback, plus the company name, ticker, and sector.
    """
    name = (utils.safe_get(info, "longName")
            or utils.safe_get(info, "shortName") or ticker)
    sector = utils.safe_get(info, "sector")
    exchange = utils.safe_get(info, "exchange") or utils.safe_get(info, "fullExchangeName")

    logo_svg = get_logo(ticker)
    if logo_svg:
        logo_html = logo_svg
    else:
        # Clean monogram fallback (first two letters of the ticker)
        logo_html = f'<span class="mono">{(ticker or "?")[:2]}</span>'

    chips = [f'<span class="idchip ticker">{ticker}</span>']
    if sector:
        chips.append(f'<span class="idchip">{sector}</span>')
    if exchange:
        chips.append(f'<span class="idchip">{exchange}</span>')

    st.markdown(
        f'<div class="idcard"><div class="idlogo">{logo_html}</div>'
        f'<div><div class="idname">{name}</div>'
        f'<div class="idmeta">{"".join(chips)}</div></div></div>',
        unsafe_allow_html=True,
    )


def render_hero_stats(info, tech):
    """A row of polished stat cards at the top — like the reference dashboard."""
    ret_1y = tech.get("return_1y")
    cards = [
        stat_card("dollar", "Current Price",
                  utils.format_currency(tech.get("current_price"))),
        stat_card("briefcase", "Market Cap",
                  utils.format_large_number(utils.safe_get(info, "marketCap"))),
        stat_card("trending-up", "1-Year Return",
                  utils.format_percent(ret_1y, already_percent=True),
                  delta_text=("up over 12 months" if _sign(ret_1y) > 0 else "down over 12 months")
                  if ret_1y is not None else None,
                  sign=_sign(ret_1y)),
        stat_card("activity", "Volatility (Beta)",
                  utils.format_number(utils.safe_get(info, "beta"))),
    ]
    render_card_row(cards)


def render_company_overview(info, tech):
    """Section 2: basic company facts."""
    section_header("building", "Company Overview", "Who this company is and how it's priced")

    div = utils.safe_get(info, "dividendYield")
    render_card_row([
        stat_card("tag", "Ticker", utils.safe_get(info, "symbol", "N/A")),
        stat_card("grid", "Sector", utils.safe_get(info, "sector", "N/A")),
        stat_card("factory", "Industry", utils.safe_get(info, "industry", "N/A")),
    ])
    st.write("")
    render_card_row([
        stat_card("arrow-up", "52-Week High",
                  utils.format_currency(utils.safe_get(info, "fiftyTwoWeekHigh"))),
        stat_card("arrow-down", "52-Week Low",
                  utils.format_currency(utils.safe_get(info, "fiftyTwoWeekLow"))),
        stat_card("coins", "Dividend Yield",
                  utils.format_percent(div) if div is not None else "N/A"),
    ])


def metric_row(label, value, explanation):
    """Show one fundamental metric with a small student-friendly explanation."""
    col1, col2 = st.columns([1, 3])
    with col1:
        st.markdown(f"**{label}**")
        st.markdown(f'<div class="num" style="font-size:22px;font-weight:700;color:#f3f3f7;">{value}</div>',
                    unsafe_allow_html=True)
    with col2:
        st.caption(explanation)
    st.divider()


def render_fundamentals(info):
    """Section 3: fundamental analysis with explanations."""
    section_header("bar-chart", "Fundamental Analysis",
                   "The key numbers, each explained in plain language")

    pe = utils.safe_get(info, "trailingPE")
    fwd_pe = utils.safe_get(info, "forwardPE")
    eps = utils.safe_get(info, "trailingEps")
    rev_growth = utils.safe_get(info, "revenueGrowth")
    margin = utils.safe_get(info, "profitMargins")
    dte = utils.safe_get(info, "debtToEquity")
    roe = utils.safe_get(info, "returnOnEquity")
    fcf = utils.safe_get(info, "freeCashflow")

    metric_row(
        "P/E Ratio", utils.format_number(pe),
        "Price-to-Earnings ratio. It compares the share price to the company's "
        "earnings. A HIGH P/E can mean the stock is expensive (or that investors "
        "expect fast growth). A LOW P/E can mean it is cheaper compared to earnings."
    )
    metric_row(
        "Forward P/E", utils.format_number(fwd_pe),
        "Like the P/E ratio, but based on EXPECTED future earnings. Comparing it "
        "to the regular P/E hints at whether earnings are expected to grow."
    )
    metric_row(
        "EPS (Earnings Per Share)", utils.format_currency(eps),
        "How much profit the company makes for each share of stock. Positive and "
        "growing EPS is a good sign; negative EPS means the company is losing money."
    )
    metric_row(
        "Revenue Growth", utils.format_percent(rev_growth),
        "How fast the company's total sales are growing compared to last year. "
        "Higher growth usually means the business is expanding."
    )
    metric_row(
        "Profit Margin", utils.format_percent(margin),
        "Of every dollar of sales, how much becomes profit. Higher margins mean "
        "the company is more efficient at turning sales into profit."
    )
    metric_row(
        "Debt-to-Equity", utils.format_number(dte),
        "How much the company borrows compared to its own money. Lower is generally "
        "safer. (yfinance shows this as a percentage, so 150 means 1.5x.)"
    )
    metric_row(
        "Return on Equity (ROE)", utils.format_percent(roe),
        "How well the company turns shareholders' money into profit. Higher ROE "
        "usually means a better-run, more profitable business."
    )
    metric_row(
        "Free Cash Flow", utils.format_large_number(fcf),
        "The spare cash left over after running the business and paying for "
        "equipment. Positive free cash flow is a sign of financial strength."
    )


def render_technicals(tech):
    """Section 4: trend and technical analysis."""
    section_header("line-chart", "Trend & Technical Analysis",
                   "What the price chart and momentum are doing")

    trend = utils.trend_label(tech)
    st.markdown(f"**Overall trend:** {trend}")

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("50-Day Avg", utils.format_currency(tech.get("sma_50")))
        st.metric("200-Day Avg", utils.format_currency(tech.get("sma_200")))
    with col2:
        st.metric("RSI (momentum)", utils.format_number(tech.get("rsi")))
        macd = tech.get("macd")
        macd_val = macd["histogram"] if macd else None
        st.metric("MACD Histogram", utils.format_number(macd_val))
    with col3:
        st.metric("1-Month Return", utils.format_percent(tech.get("return_1m"), already_percent=True))
        st.metric("3-Month Return", utils.format_percent(tech.get("return_3m"), already_percent=True))
    with col4:
        st.metric("6-Month Return", utils.format_percent(tech.get("return_6m"), already_percent=True))
        st.metric("1-Year Return", utils.format_percent(tech.get("return_1y"), already_percent=True))

    vol = tech.get("volume_trend")
    if vol is not None:
        direction = "rising" if vol > 0 else "falling"
        st.caption(
            f"**Volume trend:** Recent trading volume is {direction} "
            f"({vol:+.1f}% vs. its longer-term average). Rising volume can mean "
            "growing interest in the stock."
        )

    with st.expander("What do these technical terms mean?"):
        st.markdown(
            "- **Moving averages (50-day / 200-day):** the average price over the "
            "last 50 or 200 days. When the price is above both, momentum is usually positive.\n"
            "- **RSI:** a 0-100 momentum gauge. Above 70 can mean 'overbought', "
            "below 30 can mean 'oversold'.\n"
            "- **MACD:** compares fast and slow averages. A positive histogram hints "
            "at upward momentum.\n"
            "- **Returns:** how much the price changed over 1, 3, 6, and 12 months."
        )


def render_recommendation(result):
    """Section 5 & 6: the recommendation, confidence, and explanation."""
    section_header("target", "Educational Recommendation",
                   "A transparent score — not a guaranteed pick")

    score = result["overall_score"]
    label = result["recommendation"]
    confidence = result["confidence"]
    gradient = recommendation_gradient(label)

    col1, col2, col3 = st.columns([2, 1, 1])
    with col1:
        st.markdown(
            f'<div class="rec-badge" style="background:{gradient};">'
            f'<div class="ring"></div>'
            f'<div class="sub">Educational Recommendation</div>'
            f'<div class="big">{label}</div></div>',
            unsafe_allow_html=True,
        )
    with col2:
        st.markdown(stat_card("star", "Overall Score", f"{score} / 100"),
                    unsafe_allow_html=True)
    with col3:
        st.markdown(stat_card("gauge", "Confidence", confidence),
                    unsafe_allow_html=True)

    st.write("")
    st.progress(min(int(score), 100) / 100)

    # Section 6: explanations
    st.markdown("#### Why this rating?")
    for bullet in result["explanations"]:
        st.markdown(f"- {bullet}")

    st.info(
        "Remember: this is a simplified educational model. A 'Buy' here is **not** "
        "a guarantee. It is a starting point for discussion and learning."
    )


def render_charts(ticker, history, tech, result):
    """Section 7: visualizations."""
    section_header("pie-chart", "Visualizations", "See the price, volume, and score breakdown")

    close = history["Close"]

    tab1, tab2, tab3, tab4 = st.tabs(
        ["Price & Moving Averages", "Volume", "1-Year Price", "Score Breakdown"]
    )

    # --- Price with moving averages ---
    with tab1:
        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=history.index, y=close, name="Close Price",
            line=dict(color=ORANGE, width=2.4),
            fill="tozeroy", fillcolor="rgba(255,107,44,0.10)",
        ))
        if tech.get("sma_50_series") is not None:
            fig.add_trace(go.Scatter(x=history.index, y=tech["sma_50_series"],
                                     name="50-Day Avg", line=dict(color=BLUE, width=1.6)))
        if tech.get("sma_200_series") is not None:
            fig.add_trace(go.Scatter(x=history.index, y=tech["sma_200_series"],
                                     name="200-Day Avg", line=dict(color=VIOLET, width=1.6)))
        fig.update_layout(title=f"{ticker} Price with Moving Averages",
                          xaxis_title="Date", yaxis_title="Price (USD)",
                          hovermode="x unified")
        st.plotly_chart(style_fig(fig), use_container_width=True)

    # --- Volume ---
    with tab2:
        if "Volume" in history:
            fig = go.Figure(go.Bar(x=history.index, y=history["Volume"],
                                   marker_color=ORANGE, marker_line_width=0))
            fig.update_layout(title=f"{ticker} Trading Volume",
                              xaxis_title="Date", yaxis_title="Shares Traded")
            st.plotly_chart(style_fig(fig, height=400), use_container_width=True)
        else:
            st.caption("Volume data not available.")

    # --- 1-year price ---
    with tab3:
        fig = go.Figure(go.Scatter(
            x=history.index, y=close, line=dict(color=ORANGE, width=2.4),
            fill="tozeroy", fillcolor="rgba(255,107,44,0.10)", name="Close",
        ))
        fig.update_layout(title=f"{ticker} Price Over the Past Year",
                          xaxis_title="Date", yaxis_title="Price (USD)")
        st.plotly_chart(style_fig(fig, height=400), use_container_width=True)

    # --- Score breakdown ---
    with tab4:
        scores = result["category_scores"]
        df = pd.DataFrame({"Category": list(scores.keys()),
                           "Score": list(scores.values())})
        fig = px.bar(df, x="Score", y="Category", orientation="h",
                     range_x=[0, 100], title="Score Breakdown by Category",
                     color="Score", color_continuous_scale=[RED, AMBER, GREEN])
        st.plotly_chart(style_fig(fig, height=400), use_container_width=True)
        st.caption("Each category is scored 0-100. The overall score is the weighted "
                   "average of these five categories.")


# ---------------------------------------------------------------------------
# TAB 1: SINGLE STOCK ANALYSIS
# ---------------------------------------------------------------------------

def single_stock_view():
    st.markdown("Enter a stock ticker symbol to get an educational analysis.")

    col1, col2 = st.columns([3, 1])
    with col1:
        ticker = st.text_input(
            "Stock ticker symbol",
            value="AAPL",
            help="For example: AAPL (Apple), MSFT (Microsoft), TSLA (Tesla)",
        ).strip().upper()
    with col2:
        st.write("")
        st.write("")
        analyze_clicked = st.button("Analyze", use_container_width=True, type="primary")

    st.caption("Try one of these: " + "  ".join(f"`{t}`" for t in SAMPLE_TICKERS))

    if analyze_clicked or ticker:
        if not ticker:
            st.warning("Please type a ticker symbol to begin.")
            return

        with st.spinner(f"Fetching data for {ticker}..."):
            bundle = load_and_analyze(ticker)

        # Section 1: validation / error handling
        if bundle is None:
            st.error(
                f"Could not find data for **'{ticker}'**. "
                "Please check the spelling and try a valid ticker symbol "
                "(for example: AAPL, MSFT, TSLA)."
            )
            return

        render_identity(bundle["ticker"], bundle["info"])
        st.write("")
        render_hero_stats(bundle["info"], bundle["tech"])
        st.write("")
        render_recommendation(bundle["result"])
        st.divider()
        render_company_overview(bundle["info"], bundle["tech"])
        st.divider()
        render_fundamentals(bundle["info"])
        render_technicals(bundle["tech"])
        st.divider()
        render_charts(bundle["ticker"], bundle["history"], bundle["tech"], bundle["result"])


# ---------------------------------------------------------------------------
# TAB 2: COMPARE STOCKS
# ---------------------------------------------------------------------------

def comparison_view():
    """Section 8: compare up to 3 stocks side by side."""
    st.markdown("Compare up to **3 stocks** side by side.")

    col1, col2, col3 = st.columns(3)
    with col1:
        t1 = st.text_input("Stock 1", value="AAPL").strip().upper()
    with col2:
        t2 = st.text_input("Stock 2", value="MSFT").strip().upper()
    with col3:
        t3 = st.text_input("Stock 3", value="NVDA").strip().upper()

    if st.button("Compare", type="primary"):
        tickers = [t for t in (t1, t2, t3) if t]
        if not tickers:
            st.warning("Please enter at least one ticker symbol.")
            return

        rows = []
        for ticker in tickers:
            with st.spinner(f"Fetching {ticker}..."):
                bundle = load_and_analyze(ticker)
            if bundle is None:
                st.error(f"Could not find data for '{ticker}'. Skipping it.")
                continue

            info = bundle["info"]
            tech = bundle["tech"]
            result = bundle["result"]

            rows.append({
                "Ticker": bundle["ticker"],
                "Current Price": utils.format_currency(tech.get("current_price")),
                "P/E Ratio": utils.format_number(utils.safe_get(info, "trailingPE")),
                "EPS": utils.format_currency(utils.safe_get(info, "trailingEps")),
                "Revenue Growth": utils.format_percent(utils.safe_get(info, "revenueGrowth")),
                "Market Cap": utils.format_large_number(utils.safe_get(info, "marketCap")),
                "1-Year Return": utils.format_percent(tech.get("return_1y"), already_percent=True),
                "Overall Score": result["overall_score"],
                "Recommendation": result["recommendation"],
                "Confidence": result["confidence"],
            })

        if rows:
            df = pd.DataFrame(rows).set_index("Ticker")
            st.dataframe(df.transpose(), use_container_width=True)

            # Quick visual comparison of overall scores.
            score_df = pd.DataFrame({
                "Ticker": [r["Ticker"] for r in rows],
                "Overall Score": [r["Overall Score"] for r in rows],
            })
            fig = px.bar(score_df, x="Ticker", y="Overall Score", range_y=[0, 100],
                         color="Overall Score", color_continuous_scale=[RED, AMBER, GREEN],
                         title="Overall Score Comparison")
            st.plotly_chart(style_fig(fig, height=400), use_container_width=True)


# ---------------------------------------------------------------------------
# MAIN LAYOUT
# ---------------------------------------------------------------------------

def main():
    inject_css()

    # Hero banner (page title) with an SVG logo mark.
    st.markdown(
        f'<div class="app-hero"><div class="logo">{svg("logo", 30, 2.2)}</div>'
        f'<div><h1>Stock Market Investment Club</h1>'
        f'<p>Educational Stock Recommender — learn how investors evaluate stocks.</p>'
        f'<span class="pill">FOR EDUCATIONAL USE ONLY · NOT FINANCIAL ADVICE</span></div></div>',
        unsafe_allow_html=True,
    )

    # Top-of-page disclaimer so it is always visible.
    st.warning(DISCLAIMER)

    # Sidebar with quick info for club meetings.
    with st.sidebar:
        st.markdown(
            f'<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">'
            f'<span style="color:#ff8c54;">{svg("info", 22)}</span>'
            f'<span style="font-size:18px;font-weight:700;">About this app</span></div>',
            unsafe_allow_html=True,
        )
        st.markdown(
            "This app helps students learn how investors evaluate stocks using:\n"
            "- Company fundamentals\n"
            "- Price trends and technical indicators\n"
            "- A transparent 0-100 scoring model\n\n"
            "Built for the **Stock Market Investment Club**."
        )
        st.divider()
        st.caption("Data source: Yahoo Finance (via the yfinance library). "
                   "Prices may be delayed.")

    tab_single, tab_compare = st.tabs(["Analyze a Stock", "Compare Stocks"])
    with tab_single:
        single_stock_view()
    with tab_compare:
        comparison_view()

    # Final disclaimer at the bottom.
    st.divider()
    st.caption(
        "This tool is for educational purposes only and should not be used as "
        "professional financial advice. It does not predict the future and the "
        "recommendations are not guaranteed."
    )


if __name__ == "__main__":
    main()
