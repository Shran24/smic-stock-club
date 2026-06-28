# 📈 Stock Market Investment Club — Educational Stock Recommender

A clean, beginner-friendly Python web app that helps students learn how
investors evaluate stocks. Type in a ticker symbol (like `AAPL`, `MSFT`, or
`TSLA`) and the app produces a clear, **educational** investment-style analysis:
company overview, fundamentals explained in plain language, trend/technical
analysis, a 0–100 score, and a recommendation with a confidence level.

> ⚠️ **This tool is for educational purposes only and should not be used as
> professional financial advice.** It cannot predict the future, and its
> recommendations are not guaranteed. Always do your own research.

---

## ✨ Features

1. **Stock input & validation** — type a ticker; clear error if it's invalid.
2. **Company overview** — name, sector, industry, price, market cap, 52-week
   high/low, dividend yield, beta.
3. **Fundamental analysis** — P/E, forward P/E, EPS, revenue growth, profit
   margins, debt-to-equity, ROE, free cash flow — **each explained simply**.
4. **Trend & technical analysis** — 50/200-day moving averages, 1M/3M/6M/1Y
   returns, RSI, MACD, volume trend, plus an upward/downward/sideways read.
5. **Recommendation system** — five category scores combined into a 0–100
   score → Strong Buy / Buy / Hold / Weak Hold / Avoid, with a confidence level.
6. **Explanation section** — plain-English bullet points explaining the rating.
7. **Visualizations** — price + moving averages, volume, 1-year price, and a
   score-breakdown chart (built with Plotly).
8. **Comparison feature** — compare up to 3 stocks side by side in a table.
9. **Club-friendly design** — clear headings, simple language, organized tabs.
10. **Clean code** — organized into functions, commented, handles missing data
    safely, and an easy-to-tune scoring model.

---

## 📁 Project structure

```
SMIC Python/
├── app.py            # Streamlit user interface (run this)
├── recommender.py    # Scoring model, recommendation, and explanations
├── utils.py          # Data fetching, formatting, technical indicators
├── logos.py          # Real brand logos (SVG) for the dashboard header
├── requirements.txt  # Python dependencies
└── README.md         # This file
```

---

## 🛠️ Installation & running

You need **Python 3.9 or newer** installed.

1. (Optional but recommended) create a virtual environment:

   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Mac/Linux:
   source venv/bin/activate
   ```

2. Install the dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Run the app:

   ```bash
   streamlit run app.py
   ```

4. Your browser will open automatically (usually at
   `http://localhost:8501`). If it doesn't, copy that link from the terminal.

---

## 🎓 How the scoring model works

The overall score (0–100) is the weighted average of five category scores:

| Category          | What it measures                                   |
|-------------------|----------------------------------------------------|
| Valuation         | Is the stock cheap/expensive? (P/E, forward P/E)   |
| Growth            | Is the company expanding? (revenue growth, EPS)    |
| Profitability     | Does it keep good profit? (margins, ROE)           |
| Financial Health  | Can it pay its bills? (debt-to-equity, cash flow)  |
| Technical Trend   | What's the price momentum? (moving avgs, RSI, returns) |

**Score → Recommendation**

| Score   | Recommendation          |
|---------|-------------------------|
| 80–100  | Strong Buy              |
| 65–79   | Buy                     |
| 50–64   | Hold                    |
| 35–49   | Weak Hold / Watchlist   |
| 0–34    | Avoid                   |

**Confidence level** is *High* when most data is available and the categories
agree, *Medium* when some data is missing or signals are mixed, and *Low* when
a lot is missing or the signals strongly conflict.

### Tuning the model

The model is intentionally easy to adjust. Open **`recommender.py`** and edit:

- `WEIGHTS` — how much each category counts (must add up to `1.0`).
- `RECOMMENDATION_BANDS` — the score cut-offs for each label.
- The point rules inside each `*_score()` function.

---

## 📚 Data source

Stock data comes from **Yahoo Finance** via the open-source
[`yfinance`](https://pypi.org/project/yfinance/) library. Prices may be
delayed, and some smaller companies may be missing certain metrics — the app
handles missing data gracefully and shows `N/A` instead of crashing.

---

## ❗ Disclaimer

**This tool is for educational purposes only and should not be used as
professional financial advice.** It is designed to help high school students
learn how investors think about stocks. It does **not** predict the future, the
recommendations are **not** guaranteed, and you should always consult a
qualified adult or financial professional before making real investment
decisions.
