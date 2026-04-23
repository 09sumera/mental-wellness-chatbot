"""
database/db.py
──────────────────────────────────────────────────────────────────────────────
MongoDB storage layer — drop-in replacement for the JSON flat-file version.

All function signatures are IDENTICAL to the original db.py so that
routes/, models/, and ai/ require ZERO changes.

Collections:
  • users       — user accounts
  • chat_logs   — per-message chat records
  • mood_logs   — mood tracking entries

Install dependency:
  pip install pymongo python-dotenv

Environment variable (add to your .env file):
  MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/serenity?retryWrites=true&w=majority
  MONGO_DB_NAME=serenity

For local development (MongoDB running locally):
  MONGO_URI=mongodb://localhost:27017
  MONGO_DB_NAME=serenity
──────────────────────────────────────────────────────────────────────────────
"""

import os
import uuid
from datetime import datetime

from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure, DuplicateKeyError
from dotenv import load_dotenv

# ── Load environment variables ────────────────────────────────────────────────
load_dotenv()

MONGO_URI     = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "serenity")

# ── Singleton client ──────────────────────────────────────────────────────────
_client: MongoClient | None = None


def _get_db():
    """Return the MongoDB database instance (lazy singleton connection)."""
    global _client
    if _client is None:
        _client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    return _client[MONGO_DB_NAME]


# ── Internal helper ───────────────────────────────────────────────────────────
def _clean(doc: dict | None) -> dict | None:
    """Remove MongoDB's internal _id field before returning a document."""
    if doc is not None:
        doc.pop("_id", None)
    return doc


def _clean_list(docs) -> list[dict]:
    """Clean a cursor or list of documents."""
    return [_clean(doc) for doc in docs]


# ══════════════════════════════════════════════════════════════════════════════
# INITIALISATION
# ══════════════════════════════════════════════════════════════════════════════

def init_db():
    """
    Create collections and indexes on app startup.
    Called once from app.py — safe to call multiple times (idempotent).
    """
    db = _get_db()

    # ── users collection ───────────────────────────────────────────────────
    db["users"].create_index([("id",       ASCENDING)], unique=True)
    db["users"].create_index([("username", ASCENDING)], unique=True)

    # ── chat_logs collection ───────────────────────────────────────────────
    db["chat_logs"].create_index([("id",         ASCENDING)], unique=True)
    db["chat_logs"].create_index([("user_id",    ASCENDING)])
    db["chat_logs"].create_index([("created_at", DESCENDING)])

    # ── mood_logs & otps collections ──────────────────────────────────────
    db["mood_logs"].create_index([("user_id",    ASCENDING)])
    db["mood_logs"].create_index([("created_at", DESCENDING)])
    db["otps"].create_index([("username", ASCENDING)], unique=True)
    db["mood_logs"].create_index([("created_at", DESCENDING)])

    print("[db] OK - MongoDB collections and indexes are ready.")


# ══════════════════════════════════════════════════════════════════════════════
# HEALTH CHECK
# ══════════════════════════════════════════════════════════════════════════════

def ping_db() -> bool:
    """Return True if MongoDB is reachable. Used by /api/health in app.py."""
    try:
        _get_db().command("ping")
        return True
    except ConnectionFailure:
        return False


# ══════════════════════════════════════════════════════════════════════════════
# USER OPERATIONS
# ══════════════════════════════════════════════════════════════════════════════

def get_all_users() -> list[dict]:
    """
    Return all users.
    Matches original: get_all_users() → list
    """
    return _clean_list(
        _get_db()["users"].find({}, {"_id": 0})
    )


def get_user_by_id(user_id: str) -> dict | None:
    """
    Fetch a single user by their UUID.
    Matches original: get_user_by_id(user_id) → dict | None
    """
    return _clean(
        _get_db()["users"].find_one({"id": user_id}, {"_id": 0})
    )

def get_user_profile(user_id: str) -> dict | None:
    return _clean(_get_db()["users"].find_one({"id": user_id}))

# ── OTP OPERATIONS ────────────────────────────────────────────────────────────

def save_otp(username: str, otp: str, expires_at: datetime) -> dict:
    """Save an OTP for a user, upserting if it already exists."""
    doc = {
        "username": username,
        "otp": otp,
        "expires_at": expires_at.isoformat()
    }
    _get_db()["otps"].update_one(
        {"username": username},
        {"$set": doc},
        upsert=True
    )
    return doc

def get_otp(username: str) -> dict | None:
    return _clean(_get_db()["otps"].find_one({"username": username}))

def delete_otp(username: str):
    _get_db()["otps"].delete_one({"username": username})


def get_user_by_username(username: str) -> dict | None:
    """
    Fetch a single user by username.
    Matches original: get_user_by_username(username) → dict | None
    """
    return _clean(
        _get_db()["users"].find_one({"username": username}, {"_id": 0})
    )


def create_user(username: str, password_hash: str, name: str = "") -> dict:
    """
    Insert a new user document and return it.
    Raises ValueError on duplicate username (mirrors original behaviour).
    Matches original: create_user(username, password_hash, name) → dict
    """
    user = {
        "id":            str(uuid.uuid4()),
        "username":      username,
        "password_hash": password_hash,
        "name":          name,
        "created_at":    datetime.utcnow().isoformat(),
    }
    try:
        _get_db()["users"].insert_one({**user})  # insert a copy (keeps user clean)
    except DuplicateKeyError:
        raise ValueError(f"Username '{username}' is already taken.")
    return user  # _id was never added to this dict, so it's already clean


def update_user(user_id: str, updates: dict) -> dict | None:
    """
    Update allowed profile fields for a user.
    Returns the updated user document or None if not found.
    Matches original: update_user(user_id, updates) → dict | None
    """
    # Whitelist — never allow overwriting id / username / password_hash
    ALLOWED_FIELDS = {"name", "email", "bio", "avatar"}
    safe = {k: v for k, v in updates.items() if k in ALLOWED_FIELDS}

    if not safe:
        return get_user_by_id(user_id)

    safe["updated_at"] = datetime.utcnow().isoformat()

    result = _get_db()["users"].update_one(
        {"id": user_id},
        {"$set": safe}
    )

    if result.matched_count == 0:
        return None

    return get_user_by_id(user_id)


# ══════════════════════════════════════════════════════════════════════════════
# CHAT LOG OPERATIONS
# ══════════════════════════════════════════════════════════════════════════════

def save_chat_log(
    user_id:  str,
    role:     str,
    message:  str,
    sentiment: dict = None,
    chat_id:  str = None,
) -> dict:
    """
    Persist a single chat message.
    Returns the stored document.
    Matches original: save_chat_log(user_id, role, message, sentiment) → dict

    The sentiment dict from mood_pipeline.py contains:
      { "label": str, "score": float, "polarity": float,
        "emotion": str, "crisis_alert": bool }
    """
    if not chat_id:
        chat_id = str(uuid.uuid4())

    log = {
        "id":         str(uuid.uuid4()),
        "chat_id":    chat_id,
        "user_id":    user_id,
        "role":       role,           # "user" | "assistant"
        "message":    message,
        "sentiment":  sentiment or {},
        "created_at": datetime.utcnow().isoformat(),
    }
    _get_db()["chat_logs"].insert_one({**log})
    return log  # already clean (no _id in original dict)


def get_chat_logs_by_user(user_id: str, limit: int = 50) -> list[dict]:
    """
    Return the most recent `limit` messages for a user, ordered oldest → newest.
    Matches original: get_chat_logs_by_user(user_id) → list
    """
    cursor = (
        _get_db()["chat_logs"]
        .find({"user_id": user_id}, {"_id": 0})
        .sort("created_at", ASCENDING)
        .limit(limit)
    )
    return list(cursor)


def get_conversations_by_user(user_id: str) -> list[dict]:
    """
    Groups chat logs by chat_id, retrieving the AI-generated title (chat_title)
    when available, otherwise falling back to the first user message.
    Uses $last for custom_title so the AI-written title (set via update_many on
    all docs) is reliably captured even if the very first document was inserted
    before generate_title() ran.
    """
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$sort": {"created_at": ASCENDING}},
        {"$group": {
            "_id": "$chat_id",
            # $last picks the most-recent doc's value after ASC sort —
            # since rename_chat does update_many, all docs carry the title.
            "custom_title": {"$last": "$chat_title"},
            # first user message as plain-text fallback
            "first_message": {"$first": "$message"},
            "created_at": {"$first": "$created_at"}
        }},
        {"$sort": {"created_at": DESCENDING}}
    ]

    results = _get_db()["chat_logs"].aggregate(pipeline)

    conversations = []
    for doc in results:
        c_id = doc["_id"] if doc["_id"] else "legacy-chat"
        # Prefer AI-generated title; fall back to raw first message
        raw_fallback = doc.get("first_message", "") or "New Conversation"
        # Truncate very long first messages used as fallback titles
        if len(raw_fallback) > 50:
            raw_fallback = raw_fallback[:47] + "..."
        conversations.append({
            "chat_id": c_id,
            "title": doc.get("custom_title") or raw_fallback,
        })
    return conversations


def get_chat_logs_by_chat_id(chat_id: str) -> list[dict]:
    """
    Return all messages for an exact chat_id, ordered oldest to newest.
    """
    cursor = (
        _get_db()["chat_logs"]
        .find({"chat_id": chat_id}, {"_id": 0})
        .sort("created_at", ASCENDING)
    )
    return list(cursor)


def delete_chat_logs_by_user(user_id: str) -> int:
    """
    Delete all chat logs for a user.
    Returns the number of deleted documents.
    Used by DELETE /api/chat/history in chat_routes.py.
    """
    result = _get_db()["chat_logs"].delete_many({"user_id": user_id})
    return result.deleted_count


def delete_chat_by_id(chat_id: str) -> int:
    """
    Delete all chat logs for a specific chat session.
    """
    result = _get_db()["chat_logs"].delete_many({"chat_id": chat_id})
    return result.deleted_count


def rename_chat(chat_id: str, new_title: str) -> int:
    """
    Update the 'chat_title' field for all logs in a specific chat session.
    """
    result = _get_db()["chat_logs"].update_many(
        {"chat_id": chat_id},
        {"$set": {"chat_title": new_title}}
    )
    return result.modified_count


# ══════════════════════════════════════════════════════════════════════════════
# MOOD LOG OPERATIONS
# ══════════════════════════════════════════════════════════════════════════════

def save_mood_log(
    user_id: str,
    mood:    str,
    score:   float,
    note:    str = "",
) -> dict:
    """
    Persist a mood entry and return the stored document.
    Matches original: save_mood_log(user_id, mood, score, note) → dict
    """
    log = {
        "id":         str(uuid.uuid4()),
        "user_id":    user_id,
        "mood":       mood,
        "score":      score,
        "note":       note,
        "created_at": datetime.utcnow().isoformat(),
    }
    _get_db()["mood_logs"].insert_one({**log})
    return log


def get_mood_logs_by_user(user_id: str, limit: int = 30) -> list[dict]:
    """
    Return the most recent `limit` mood entries for a user, newest → oldest.
    Matches original: get_mood_logs_by_user(user_id) → list
    """
    cursor = (
        _get_db()["mood_logs"]
        .find({"user_id": user_id}, {"_id": 0})
        .sort("created_at", DESCENDING)
        .limit(limit)
    )
    return list(cursor)


def get_mood_summary(user_id: str) -> dict:
    """
    Compute mood statistics — used by GET /api/mood/summary in mood_routes.py.

    Returns:
    {
        "total_entries": int,
        "average_score": float,
        "top_mood":       str,
        "mood_counts":   { mood_name: count, ... },
        "trend":          "improving" | "declining" | "stable",
        "recent_moods":  [ last 5 mood strings ]
    }
    """
    logs = get_mood_logs_by_user(user_id, limit=100)

    if not logs:
        return {
            "total_entries": 0,
            "average_score": 0.0,
            "top_mood":       "none",
            "mood_counts":   {},
            "trend":          "stable",
            "recent_moods":  [],
        }

    scores     = [l["score"] for l in logs]
    moods      = [l["mood"]  for l in logs]
    avg_score  = round(sum(scores) / len(scores), 2)

    # Mood frequency count
    mood_counts: dict[str, int] = {}
    for m in moods:
        mood_counts[m] = mood_counts.get(m, 0) + 1

    top_mood = max(mood_counts, key=mood_counts.get)

    # Trend: compare first-half avg vs second-half avg (logs are newest-first)
    mid   = len(scores) // 2
    trend = "stable"
    if mid > 0:
        recent_avg = sum(scores[:mid])  / mid
        older_avg  = sum(scores[mid:])  / (len(scores) - mid)
        diff = recent_avg - older_avg
        if diff > 0.5:
            trend = "improving"
        elif diff < -0.5:
            trend = "declining"

    return {
        "total_entries": len(logs),
        "average_score": avg_score,
        "top_mood":       top_mood,
        "mood_counts":   mood_counts,
        "trend":          trend,
        "recent_moods":  moods[:5],   # 5 most recent (list is newest-first)
    }