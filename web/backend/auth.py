"""
auth.py
=======
Simple username + password authentication with a signed-cookie session.
No external services. Passwords are hashed with PBKDF2-HMAC-SHA256 (Python
standard library) — never stored in plain text.

  POST /auth/signup  {username, password}  -> create account + sign in
  POST /auth/login   {username, password}  -> sign in
  POST /auth/logout                         -> sign out
"""

import base64
import hashlib
import hmac
import os

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from db import get_db
from models import User

router = APIRouter(prefix="/auth", tags=["auth"])

# Admin usernames come from the ADMIN_USERS env var (comma-separated).
ADMIN_USERS = {u.strip().lower() for u in os.environ.get("ADMIN_USERS", "").split(",") if u.strip()}


def is_admin(user) -> bool:
    return bool(user) and (user.name or "").lower() in ADMIN_USERS


class AuthIn(BaseModel):
    username: str
    password: str


# --- password hashing (PBKDF2, stdlib) --------------------------------------

def hash_password(password: str) -> str:
    salt = os.urandom(16)
    iterations = 200_000
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return "pbkdf2_sha256${}${}${}".format(
        iterations, base64.b64encode(salt).decode(), base64.b64encode(dk).decode()
    )


def verify_password(password: str, stored: str) -> bool:
    try:
        _algo, iterations, salt_b64, dk_b64 = stored.split("$")
        salt = base64.b64decode(salt_b64)
        expected = base64.b64decode(dk_b64)
        dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, int(iterations))
        return hmac.compare_digest(dk, expected)
    except Exception:
        return False


# --- session helper ----------------------------------------------------------

def current_user(request: Request, db: Session = Depends(get_db)):
    """Return the logged-in User (or None)."""
    uid = request.session.get("user_id")
    if not uid:
        return None
    return db.get(User, uid)


def _find(db: Session, username: str):
    return db.query(User).filter(func.lower(User.name) == username.lower()).first()


# --- routes ------------------------------------------------------------------

@router.post("/signup")
def signup(body: AuthIn, request: Request, db: Session = Depends(get_db)):
    username = body.username.strip()
    if len(username) < 3:
        raise HTTPException(400, "Username must be at least 3 characters.")
    if len(body.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters.")
    if _find(db, username):
        raise HTTPException(400, "That username is already taken.")
    user = User(name=username, password_hash=hash_password(body.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    request.session["user_id"] = user.id
    return {"name": user.name}


@router.post("/login")
def login(body: AuthIn, request: Request, db: Session = Depends(get_db)):
    user = _find(db, body.username.strip())
    if not user or not verify_password(body.password, user.password_hash or ""):
        raise HTTPException(400, "Wrong username or password.")
    request.session["user_id"] = user.id
    return {"name": user.name}


@router.post("/logout")
def logout(request: Request):
    request.session.clear()
    return {"ok": True}
