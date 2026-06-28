"""
models.py
=========
Database tables for the trading game:
  - User         : one club member (identified by their Google account)
  - Holding      : how many shares of a ticker a user owns
  - Transaction  : a record of every buy/sell (history)
"""

from datetime import datetime

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from db import Base

# Everyone starts the game with the same fake balance.
STARTING_BALANCE = 100000.0


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, index=True, nullable=False)  # the username
    password_hash = Column(String, nullable=False)                  # hashed, never plain text
    cash = Column(Float, default=STARTING_BALANCE, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    holdings = relationship("Holding", back_populates="user", cascade="all, delete-orphan")


class Holding(Base):
    __tablename__ = "holdings"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    ticker = Column(String, index=True)
    shares = Column(Float, default=0.0)
    avg_cost = Column(Float, default=0.0)  # average price paid per share

    user = relationship("User", back_populates="holdings")


class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    ticker = Column(String)
    side = Column(String)  # "buy" or "sell"
    shares = Column(Float)
    price = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
