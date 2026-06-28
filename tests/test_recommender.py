"""
test_recommender.py
===================
Unit tests for the educational scoring model (recommender.py).

Run either way:
    python tests/test_recommender.py      # plain, no dependencies
    pytest tests/test_recommender.py       # if pytest is installed
"""

import sys
from pathlib import Path

# Make the project-root modules importable when run from anywhere.
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import recommender  # noqa: E402


# --- Sample inputs ----------------------------------------------------------

STRONG_INFO = {
    "trailingPE": 18, "forwardPE": 16, "revenueGrowth": 0.20, "trailingEps": 5.0,
    "profitMargins": 0.25, "returnOnEquity": 0.30, "debtToEquity": 40, "freeCashflow": 1e9,
}
STRONG_TECH = {
    "current_price": 120, "sma_50": 100, "sma_200": 90, "rsi": 60,
    "return_3m": 12, "return_6m": 22, "macd": {"histogram": 1.2},
}

WEAK_INFO = {
    "trailingPE": 60, "forwardPE": 55, "revenueGrowth": -0.10, "trailingEps": -2.0,
    "profitMargins": -0.05, "returnOnEquity": -0.10, "debtToEquity": 350, "freeCashflow": -1e8,
}
WEAK_TECH = {
    "current_price": 50, "sma_50": 70, "sma_200": 90, "rsi": 25,
    "return_3m": -20, "return_6m": -30, "macd": {"histogram": -1.0},
}


# --- Tests ------------------------------------------------------------------

def test_recommendation_bands():
    assert recommender.score_to_recommendation(85) == "Strong Buy"
    assert recommender.score_to_recommendation(70) == "Buy"
    assert recommender.score_to_recommendation(55) == "Hold"
    assert recommender.score_to_recommendation(40) == "Weak Hold / Watchlist"
    assert recommender.score_to_recommendation(10) == "Avoid"


def test_scores_are_bounded():
    for info, tech in [(STRONG_INFO, STRONG_TECH), (WEAK_INFO, WEAK_TECH), ({}, {})]:
        result = recommender.analyze(info, tech)
        assert 0 <= result["overall_score"] <= 100
        for name, score in result["category_scores"].items():
            assert 0 <= score <= 100, f"{name} out of range: {score}"


def test_strong_beats_weak():
    strong = recommender.analyze(STRONG_INFO, STRONG_TECH)
    weak = recommender.analyze(WEAK_INFO, WEAK_TECH)
    assert strong["overall_score"] > weak["overall_score"]
    assert strong["recommendation"] in ("Buy", "Strong Buy")
    assert weak["recommendation"] in ("Avoid", "Weak Hold / Watchlist")


def test_missing_data_is_safe():
    # Empty inputs must not crash and should land neutral with low confidence.
    result = recommender.analyze({}, {})
    assert result["recommendation"] in (
        "Strong Buy", "Buy", "Hold", "Weak Hold / Watchlist", "Avoid"
    )
    assert result["confidence"] == "Low"
    assert isinstance(result["explanations"], list) and len(result["explanations"]) >= 1


def test_confidence_high_when_data_complete_and_agrees():
    strong = recommender.analyze(STRONG_INFO, STRONG_TECH)
    # Plenty of data, signals aligned -> should not be "Low".
    assert strong["confidence"] in ("High", "Medium")


def test_individual_scorers_report_availability():
    _, available = recommender.valuation_score(STRONG_INFO)
    assert available > 0
    _, none_available = recommender.valuation_score({})
    assert none_available == 0


# --- Plain runner (no pytest needed) ----------------------------------------

if __name__ == "__main__":
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    passed = 0
    for t in tests:
        try:
            t()
            print(f"PASS  {t.__name__}")
            passed += 1
        except AssertionError as e:
            print(f"FAIL  {t.__name__}: {e}")
        except Exception as e:  # noqa: BLE001
            print(f"ERROR {t.__name__}: {type(e).__name__}: {e}")
    print(f"\n{passed}/{len(tests)} tests passed")
    sys.exit(0 if passed == len(tests) else 1)
