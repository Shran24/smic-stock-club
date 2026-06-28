"""
recommender.py
==============
The "brain" of the Stock Market Investment Club app.

This module turns raw financial data into:
  - Five category scores (valuation, growth, profitability, health, technicals)
  - One overall score from 0 to 100
  - A recommendation label (Strong Buy ... Avoid)
  - A confidence level (High / Medium / Low)
  - Plain-English bullet points explaining the rating

IMPORTANT FOR STUDENTS:
  This is a simplified, educational model. The scoring rules below are
  intentionally easy to read and easy to change. Real analysts use far more
  data and judgment. Nothing here predicts the future with certainty.

To tune the model, edit the WEIGHTS and the SCORING_RULES dictionaries.
"""

from utils import safe_get


# ---------------------------------------------------------------------------
# CONFIGURATION  (edit these to adjust the model later)
# ---------------------------------------------------------------------------

# How much each category counts toward the final score. Must add up to 1.0.
WEIGHTS = {
    "valuation": 0.20,
    "growth": 0.20,
    "profitability": 0.20,
    "financial_health": 0.20,
    "technical": 0.20,
}

# Map a final score to a recommendation label.
RECOMMENDATION_BANDS = [
    (80, "Strong Buy"),
    (65, "Buy"),
    (50, "Hold"),
    (35, "Weak Hold / Watchlist"),
    (0,  "Avoid"),
]


def _clamp(value, low=0, high=100):
    """Keep a score inside the 0-100 range."""
    return max(low, min(high, value))


def _score_from_bands(value, bands, missing_score=50):
    """
    Generic helper: assign points based on which range a value falls into.

    `bands` is a list of (threshold, points) pairs checked from the top down.
    If the value is missing (None), we return a neutral `missing_score`.
    """
    if value is None:
        return missing_score, False  # (score, data_available?)
    for threshold, points in bands:
        if value >= threshold:
            return points, True
    return bands[-1][1], True


# ---------------------------------------------------------------------------
# 1. VALUATION SCORE  (is the stock cheap or expensive vs. earnings?)
# ---------------------------------------------------------------------------

def valuation_score(info: dict):
    """
    Lower P/E ratios generally mean a cheaper stock (more reward per dollar
    of earnings). Very high P/E ratios can mean the stock is expensive OR that
    investors expect big future growth. We reward moderate, reasonable values.
    """
    pe = safe_get(info, "trailingPE")
    fwd_pe = safe_get(info, "forwardPE")

    # Points for trailing P/E: lower (but positive) is cheaper.
    def pe_points(value):
        if value is None or value <= 0:
            return None
        if value < 15:
            return 100
        if value < 25:
            return 80
        if value < 35:
            return 60
        if value < 50:
            return 40
        return 20

    parts, available = [], 0
    for value in (pe, fwd_pe):
        pts = pe_points(value)
        if pts is not None:
            parts.append(pts)
            available += 1

    if not parts:
        return 50, 0  # neutral, no data
    return _clamp(sum(parts) / len(parts)), available


# ---------------------------------------------------------------------------
# 2. GROWTH SCORE  (is the company getting bigger?)
# ---------------------------------------------------------------------------

def growth_score(info: dict):
    """
    Strong revenue growth and positive earnings (EPS) are good signs that a
    business is expanding. Negative growth lowers the score.
    """
    rev_growth = safe_get(info, "revenueGrowth")   # fraction, e.g. 0.15 = 15%
    eps = safe_get(info, "trailingEps")

    parts, available = [], 0

    if rev_growth is not None:
        pct = rev_growth * 100
        if pct >= 25:
            parts.append(100)
        elif pct >= 15:
            parts.append(85)
        elif pct >= 8:
            parts.append(70)
        elif pct >= 0:
            parts.append(50)
        else:
            parts.append(25)
        available += 1

    if eps is not None:
        # Positive EPS = the company is profitable per share.
        parts.append(75 if eps > 0 else 30)
        available += 1

    if not parts:
        return 50, 0
    return _clamp(sum(parts) / len(parts)), available


# ---------------------------------------------------------------------------
# 3. PROFITABILITY SCORE  (does the company keep a good chunk of its sales?)
# ---------------------------------------------------------------------------

def profitability_score(info: dict):
    """
    Profit margin = how much profit the company keeps from each dollar of sales.
    Return on equity (ROE) = how well it uses shareholder money to make profit.
    Higher is better for both.
    """
    margin = safe_get(info, "profitMargins")        # fraction
    roe = safe_get(info, "returnOnEquity")          # fraction

    parts, available = [], 0

    if margin is not None:
        pct = margin * 100
        if pct >= 20:
            parts.append(100)
        elif pct >= 10:
            parts.append(80)
        elif pct >= 5:
            parts.append(60)
        elif pct >= 0:
            parts.append(45)
        else:
            parts.append(20)
        available += 1

    if roe is not None:
        pct = roe * 100
        if pct >= 20:
            parts.append(100)
        elif pct >= 12:
            parts.append(80)
        elif pct >= 5:
            parts.append(60)
        elif pct >= 0:
            parts.append(45)
        else:
            parts.append(20)
        available += 1

    if not parts:
        return 50, 0
    return _clamp(sum(parts) / len(parts)), available


# ---------------------------------------------------------------------------
# 4. FINANCIAL HEALTH SCORE  (can the company pay its bills?)
# ---------------------------------------------------------------------------

def financial_health_score(info: dict):
    """
    Debt-to-equity tells us how much the company borrows compared to its own
    money. Lower is safer. Positive free cash flow means the company generates
    real spare cash, which is a sign of strength.
    """
    # yfinance reports debt-to-equity as a percentage (e.g. 150 means 1.5x).
    dte = safe_get(info, "debtToEquity")
    fcf = safe_get(info, "freeCashflow")

    parts, available = [], 0

    if dte is not None:
        ratio = dte / 100.0  # convert 150 -> 1.5
        if ratio < 0.5:
            parts.append(100)
        elif ratio < 1.0:
            parts.append(80)
        elif ratio < 2.0:
            parts.append(55)
        elif ratio < 3.0:
            parts.append(35)
        else:
            parts.append(20)
        available += 1

    if fcf is not None:
        parts.append(80 if fcf > 0 else 30)
        available += 1

    if not parts:
        return 50, 0
    return _clamp(sum(parts) / len(parts)), available


# ---------------------------------------------------------------------------
# 5. TECHNICAL SCORE  (what is the price momentum doing?)
# ---------------------------------------------------------------------------

def technical_score(tech: dict):
    """
    Combines moving averages, RSI, and recent price momentum.

    - Trading above the 50-day and 200-day averages = positive momentum.
    - RSI near the middle (40-65) is healthy; extreme highs can mean overbought.
    - Positive 3-month and 6-month returns add points.
    """
    parts, available = [], 0

    price = tech.get("current_price")
    sma50 = tech.get("sma_50")
    sma200 = tech.get("sma_200")

    # Moving-average position.
    if price is not None and sma50 is not None and sma200 is not None:
        ma_points = 50
        if price > sma50:
            ma_points += 25
        if price > sma200:
            ma_points += 25
        if price < sma50 and price < sma200:
            ma_points = 25
        parts.append(_clamp(ma_points))
        available += 1

    # RSI.
    rsi = tech.get("rsi")
    if rsi is not None:
        if rsi >= 70:
            parts.append(45)        # overbought, be cautious
        elif rsi >= 55:
            parts.append(80)        # healthy strength
        elif rsi >= 45:
            parts.append(70)        # neutral
        elif rsi >= 30:
            parts.append(55)        # weak
        else:
            parts.append(40)        # oversold
        available += 1

    # Momentum from 3-month and 6-month returns.
    for key in ("return_3m", "return_6m"):
        ret = tech.get(key)
        if ret is not None:
            if ret >= 15:
                parts.append(90)
            elif ret >= 5:
                parts.append(75)
            elif ret >= 0:
                parts.append(55)
            elif ret >= -10:
                parts.append(40)
            else:
                parts.append(25)
            available += 1

    if not parts:
        return 50, 0
    return _clamp(sum(parts) / len(parts)), available


# ---------------------------------------------------------------------------
# COMBINE EVERYTHING
# ---------------------------------------------------------------------------

def score_to_recommendation(score):
    """Convert a 0-100 score into a recommendation label."""
    for threshold, label in RECOMMENDATION_BANDS:
        if score >= threshold:
            return label
    return "Avoid"


def confidence_level(total_categories, available_categories, scores):
    """
    Decide how confident we are in the recommendation.

      - High:   most data is present AND the categories mostly agree
      - Medium: some data missing OR the signals are mixed
      - Low:    a lot of data missing OR the signals strongly conflict

    "Agreement" is measured by the spread between the highest and lowest
    category score. A wide spread means the signals conflict.
    """
    if not scores:
        return "Low"

    coverage = available_categories / total_categories
    spread = max(scores) - min(scores)

    if coverage >= 0.8 and spread <= 30:
        return "High"
    if coverage >= 0.5 and spread <= 50:
        return "Medium"
    return "Low"


def analyze(info: dict, tech: dict):
    """
    Run the full analysis and return one results dictionary.

    The returned dictionary contains the category scores, the overall score,
    the recommendation, the confidence level, and explanation bullet points.
    """
    # Each scorer returns (score, number_of_data_points_used).
    val_s, val_av = valuation_score(info)
    grw_s, grw_av = growth_score(info)
    prof_s, prof_av = profitability_score(info)
    health_s, health_av = financial_health_score(info)
    tech_s, tech_av = technical_score(tech)

    category_scores = {
        "Valuation": val_s,
        "Growth": grw_s,
        "Profitability": prof_s,
        "Financial Health": health_s,
        "Technical Trend": tech_s,
    }

    # Weighted overall score.
    overall = (
        val_s * WEIGHTS["valuation"]
        + grw_s * WEIGHTS["growth"]
        + prof_s * WEIGHTS["profitability"]
        + health_s * WEIGHTS["financial_health"]
        + tech_s * WEIGHTS["technical"]
    )
    overall = round(_clamp(overall), 1)

    recommendation = score_to_recommendation(overall)

    # Count how many of the 5 categories actually had data.
    available_categories = sum(
        1 for av in (val_av, grw_av, prof_av, health_av, tech_av) if av > 0
    )
    confidence = confidence_level(
        total_categories=5,
        available_categories=available_categories,
        scores=list(category_scores.values()),
    )

    explanations = build_explanations(info, tech, category_scores)

    return {
        "category_scores": category_scores,
        "overall_score": overall,
        "recommendation": recommendation,
        "confidence": confidence,
        "explanations": explanations,
    }


# ---------------------------------------------------------------------------
# EXPLANATIONS  (the "why" behind the rating)
# ---------------------------------------------------------------------------

def build_explanations(info: dict, tech: dict, scores: dict):
    """
    Build a list of plain-English bullet points that justify the score.

    We only add a bullet when we actually have the relevant data, so the
    explanation stays honest and never invents numbers.
    """
    bullets = []

    # --- Valuation ---
    pe = safe_get(info, "trailingPE")
    if pe is not None:
        if pe <= 0:
            bullets.append(
                "The company currently has negative earnings, so the P/E ratio "
                "is not meaningful. This is common for younger or struggling companies."
            )
        elif pe < 15:
            bullets.append(
                f"The P/E ratio is low (about {pe:.1f}), which may mean the stock "
                "is cheap compared to its earnings."
            )
        elif pe > 35:
            bullets.append(
                f"The P/E ratio is high (about {pe:.1f}), which may mean the stock "
                "is expensive, or that investors expect strong future growth."
            )
        else:
            bullets.append(
                f"The P/E ratio (about {pe:.1f}) is in a fairly normal range."
            )

    # --- Growth ---
    rev_growth = safe_get(info, "revenueGrowth")
    if rev_growth is not None:
        pct = rev_growth * 100
        if pct >= 15:
            bullets.append(
                f"The company has strong revenue growth (about {pct:.1f}% year over year)."
            )
        elif pct >= 0:
            bullets.append(
                f"Revenue growth is modest (about {pct:.1f}% year over year)."
            )
        else:
            bullets.append(
                f"Revenue is shrinking (about {pct:.1f}% year over year), which is a warning sign."
            )

    # --- Profitability ---
    margin = safe_get(info, "profitMargins")
    if margin is not None:
        pct = margin * 100
        if pct >= 15:
            bullets.append(
                f"Profit margins are healthy (about {pct:.1f}%), meaning the company "
                "keeps a good share of its sales as profit."
            )
        elif pct < 0:
            bullets.append(
                "The company is currently unprofitable (negative profit margin)."
            )

    roe = safe_get(info, "returnOnEquity")
    if roe is not None and roe * 100 >= 15:
        bullets.append(
            f"Return on equity is strong (about {roe * 100:.1f}%), showing the company "
            "uses shareholder money efficiently."
        )

    # --- Financial health ---
    dte = safe_get(info, "debtToEquity")
    if dte is not None:
        ratio = dte / 100.0
        if ratio >= 2.0:
            bullets.append(
                f"Debt levels appear high (debt-to-equity around {ratio:.1f}), "
                "which lowers the financial health score."
            )
        elif ratio < 0.5:
            bullets.append(
                f"The company has low debt (debt-to-equity around {ratio:.1f}), "
                "which is a sign of financial strength."
            )

    fcf = safe_get(info, "freeCashflow")
    if fcf is not None:
        if fcf > 0:
            bullets.append("The company generates positive free cash flow, a sign of strength.")
        else:
            bullets.append("The company has negative free cash flow, which can be a concern.")

    # --- Technicals ---
    price = tech.get("current_price")
    sma50 = tech.get("sma_50")
    sma200 = tech.get("sma_200")
    if price is not None and sma50 is not None and sma200 is not None:
        if price > sma50 and price > sma200:
            bullets.append(
                "The stock is trading above its 50-day and 200-day moving averages, "
                "showing positive momentum."
            )
        elif price < sma50 and price < sma200:
            bullets.append(
                "The stock is trading below its 50-day and 200-day moving averages, "
                "showing weak momentum."
            )
        else:
            bullets.append(
                "The stock is between its 50-day and 200-day moving averages, "
                "suggesting a mixed or sideways trend."
            )

    rsi = tech.get("rsi")
    if rsi is not None:
        if rsi >= 70:
            bullets.append(
                f"The RSI is high (about {rsi:.0f}), suggesting the stock may be "
                "'overbought' after a strong run-up."
            )
        elif rsi <= 30:
            bullets.append(
                f"The RSI is low (about {rsi:.0f}), suggesting the stock may be "
                "'oversold' after a sharp drop."
            )

    if not bullets:
        bullets.append(
            "There was not enough data available to build a detailed explanation "
            "for this stock."
        )

    return bullets
