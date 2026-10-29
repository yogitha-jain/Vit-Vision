"""
VetVision accounts: signup, login, logout, profile, change password.

Users are stored in MongoDB (collection "users"). Passwords are never stored,
only a salted hash. After login, the browser keeps a signed session cookie.
"""
import re
from datetime import datetime, timezone
from functools import wraps

from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, jsonify, request, session
from pymongo.errors import DuplicateKeyError
from werkzeug.security import check_password_hash, generate_password_hash

from database.database import get_collection

auth_bp = Blueprint("auth", __name__)

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
MIN_PASSWORD_LENGTH = 8
MAX_PASSWORD_LENGTH = 128

# Checked when the email does not exist, so login takes about the same time either way.
_DUMMY_HASH = generate_password_hash("not-a-real-password")


def users():
    return get_collection("users")


def ensure_indexes():
    """One account per email, enforced by the database itself."""
    users().create_index("email", unique=True)


def _fail(message, status):
    # "error" is read by the detection pages, "message" by the settings page.
    return jsonify({"error": message, "message": message}), status


def _public_user(doc):
    return {
        "name": doc["name"],
        "email": doc["email"],
        "createdAt": doc["createdAt"].strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


def current_user():
    """The logged-in user's document, or None."""
    user_id = session.get("user_id")
    if not user_id:
        return None
    try:
        return users().find_one({"_id": ObjectId(user_id)})
    except InvalidId:
        return None


def login_required(view):
    """Protect a route. The route receives the user document as its first argument."""
    @wraps(view)
    def wrapper(*args, **kwargs):
        user = current_user()
        if user is None:
            return _fail("Please log in first.", 401)
        return view(user, *args, **kwargs)
    return wrapper


def _password_problem(password):
    if len(password) < MIN_PASSWORD_LENGTH:
        return f"Password must be at least {MIN_PASSWORD_LENGTH} characters."
    if len(password) > MAX_PASSWORD_LENGTH:
        return f"Password must be at most {MAX_PASSWORD_LENGTH} characters."
    return None


@auth_bp.post("/api/signup")
def signup():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    if not name or len(name) > 80:
        return _fail("Please enter your name (up to 80 characters).", 400)
    if not EMAIL_RE.match(email) or len(email) > 254:
        return _fail("Please enter a valid email address.", 400)
    problem = _password_problem(password)
    if problem:
        return _fail(problem, 400)

    doc = {
        "name": name,
        "email": email,
        "passwordHash": generate_password_hash(password),
        "createdAt": datetime.now(timezone.utc),
    }
    try:
        users().insert_one(doc)
    except DuplicateKeyError:
        return _fail("An account with this email already exists.", 409)

    return jsonify({"message": "Account created. You can log in now.",
                    "user": _public_user(doc)}), 201


@auth_bp.post("/api/login")
def login():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    user = users().find_one({"email": email})
    password_ok = check_password_hash(
        user["passwordHash"] if user else _DUMMY_HASH, password)
    if user is None or not password_ok:
        return _fail("Invalid email or password.", 401)

    session.clear()
    session["user_id"] = str(user["_id"])
    session.permanent = True
    return jsonify({"message": "Login successful.", "user": _public_user(user)})


@auth_bp.post("/api/logout")
def logout():
    session.clear()
    return jsonify({"message": "Logged out."})


@auth_bp.get("/api/profile")
@login_required
def profile(user):
    return jsonify(_public_user(user))


@auth_bp.post("/api/change-password")
@login_required
def change_password(user):
    data = request.get_json(silent=True) or {}
    current = str(data.get("currentPassword", ""))
    new = str(data.get("newPassword", ""))

    if not check_password_hash(user["passwordHash"], current):
        return _fail("Current password is incorrect.", 400)
    problem = _password_problem(new)
    if problem:
        return _fail(problem, 400)
    if new == current:
        return _fail("New password must be different from the current one.", 400)

    users().update_one({"_id": user["_id"]},
                       {"$set": {"passwordHash": generate_password_hash(new)}})
    return jsonify({"message": "Password changed."})