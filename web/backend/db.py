"""
db.py
=====
Database setup for the trading game. Uses SQLite locally (game.db) and any
SQLAlchemy URL in production via the DATABASE_URL env var (e.g. Postgres).
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./game.db")

# Many hosts (Render, Heroku) hand out "postgres://..." but SQLAlchemy wants
# "postgresql://...". Normalize it so a hosted database works out of the box.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# SQLite needs this flag when used across threads (FastAPI workers).
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a DB session and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
