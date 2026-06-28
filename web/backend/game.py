"""
game.py
=======
The trading-game engine: buy/sell at the live price, value a portfolio, and
build the leaderboard. Prices reuse utils.fetch_stock (cached), so trades use
the latest available close price.
"""

import utils
from models import User, Holding, Transaction


def price_of(ticker: str):
    """Latest close price for a ticker, or None if unavailable."""
    data = utils.fetch_stock(ticker)
    if not data["valid"] or "Close" not in data["history"]:
        return None
    close = data["history"]["Close"].dropna()
    return float(close.iloc[-1]) if len(close) else None


def buy(db, user: User, ticker: str, shares: float):
    ticker = (ticker or "").strip().upper()
    if shares <= 0:
        raise ValueError("Enter a positive number of shares.")
    price = price_of(ticker)
    if price is None:
        raise ValueError(f"Couldn't get a price for '{ticker}'.")
    cost = price * shares
    if cost > user.cash:
        raise ValueError(f"Not enough cash. Need ${cost:,.2f}, you have ${user.cash:,.2f}.")

    user.cash -= cost
    h = db.query(Holding).filter_by(user_id=user.id, ticker=ticker).first()
    if h:
        total = h.shares + shares
        h.avg_cost = (h.avg_cost * h.shares + cost) / total
        h.shares = total
    else:
        db.add(Holding(user_id=user.id, ticker=ticker, shares=shares, avg_cost=price))
    db.add(Transaction(user_id=user.id, ticker=ticker, side="buy", shares=shares, price=price))
    db.commit()


def sell(db, user: User, ticker: str, shares: float):
    ticker = (ticker or "").strip().upper()
    if shares <= 0:
        raise ValueError("Enter a positive number of shares.")
    h = db.query(Holding).filter_by(user_id=user.id, ticker=ticker).first()
    if not h or h.shares < shares:
        owned = h.shares if h else 0
        raise ValueError(f"You only own {owned:g} shares of {ticker}.")
    price = price_of(ticker)
    if price is None:
        raise ValueError(f"Couldn't get a price for '{ticker}'.")

    user.cash += price * shares
    h.shares -= shares
    if h.shares <= 1e-9:
        db.delete(h)
    db.add(Transaction(user_id=user.id, ticker=ticker, side="sell", shares=shares, price=price))
    db.commit()


def portfolio(db, user: User):
    """Current cash, holdings (with live value + profit/loss), and totals."""
    holdings = db.query(Holding).filter_by(user_id=user.id).all()
    rows, holdings_value = [], 0.0
    for h in holdings:
        price = price_of(h.ticker)
        value = (price or 0) * h.shares
        cost = h.avg_cost * h.shares
        holdings_value += value
        rows.append({
            "ticker": h.ticker,
            "shares": h.shares,
            "avgCost": h.avg_cost,
            "price": price,
            "value": value,
            "pl": value - cost,
            "plPct": ((value - cost) / cost * 100) if cost else 0,
        })
    total = user.cash + holdings_value
    return {
        "name": user.name,
        "cash": user.cash,
        "holdingsValue": holdings_value,
        "totalValue": total,
        "totalReturnPct": (total / 100000.0 - 1) * 100,  # vs starting balance
        "holdings": sorted(rows, key=lambda r: r["value"], reverse=True),
    }


def leaderboard(db):
    """All players ranked by total portfolio value."""
    users = db.query(User).all()
    board = []
    for u in users:
        holdings = db.query(Holding).filter_by(user_id=u.id).all()
        hv = sum((price_of(h.ticker) or 0) * h.shares for h in holdings)
        total = u.cash + hv
        board.append({
            "name": u.name,
            "totalValue": total,
            "returnPct": (total / 100000.0 - 1) * 100,
        })
    board.sort(key=lambda r: r["totalValue"], reverse=True)
    for i, r in enumerate(board, start=1):
        r["rank"] = i
    return board
