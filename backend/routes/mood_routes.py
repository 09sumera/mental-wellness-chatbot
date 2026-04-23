from flask import Blueprint, request, jsonify
from database.db import save_mood_log, get_mood_logs_by_user
from models.user_model import decode_token
from datetime import datetime

mood_bp = Blueprint("mood", __name__)

VALID_MOODS = ["happy", "sad", "anxious", "angry", "calm", "depressed", "neutral", "excited"]


# ── Auth helper ───────────────────────────────────────────────────────────────
def _get_user_id(request) -> tuple[str | None, dict | None]:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None, ({"error": "Missing or invalid Authorization header."}, 401)
    token = auth.split(" ", 1)[1]
    payload = decode_token(token)
    if not payload or "error" in payload:
        return None, ({"error": payload.get("error", "Unauthorised.")}, 401)
    return payload["user_id"], None


# ── POST /api/mood/log ────────────────────────────────────────────────────────
@mood_bp.route("/log", methods=["POST"])
def log_mood():
    """
    Log a mood entry for the authenticated user.

    Body JSON:
        {
            "mood":  "anxious",   # one of VALID_MOODS
            "score": 3.5,         # 1.0 – 10.0
            "note":  "optional free-text"
        }
    """
    user_id, err = _get_user_id(request)
    if err:
        return jsonify(err[0]), err[1]

    body  = request.get_json(silent=True) or {}
    mood  = body.get("mood", "").strip().lower()
    score = body.get("score")
    note  = body.get("note", "").strip()

    if mood not in VALID_MOODS:
        return jsonify({"error": f"Invalid mood. Choose from: {', '.join(VALID_MOODS)}"}), 400

    try:
        score = float(score)
        if not (1.0 <= score <= 10.0):
            raise ValueError
    except (TypeError, ValueError):
        return jsonify({"error": "Score must be a number between 1.0 and 10.0."}), 400

    log = save_mood_log(user_id, mood, score, note)
    return jsonify({"message": "Mood logged successfully.", "log": log}), 201


# ── GET /api/mood/history ─────────────────────────────────────────────────────
@mood_bp.route("/history", methods=["GET"])
def mood_history():
    """Return all mood logs for the authenticated user."""
    user_id, err = _get_user_id(request)
    if err:
        return jsonify(err[0]), err[1]

    logs = get_mood_logs_by_user(user_id)
    return jsonify({"mood_logs": logs}), 200


# ── GET /api/mood/summary ─────────────────────────────────────────────────────
@mood_bp.route("/summary", methods=["GET"])
def mood_summary():
    """
    Return a simple summary:
      - average score
      - most frequent mood
      - total entries
      - trend (last 7 entries avg vs overall avg)
    """
    user_id, err = _get_user_id(request)
    if err:
        return jsonify(err[0]), err[1]

    logs = get_mood_logs_by_user(user_id)
    if not logs:
        return jsonify({"summary": None, "message": "No mood data yet."}), 200

    scores = [l["score"] for l in logs]
    avg_score = round(sum(scores) / len(scores), 2)

    mood_counts: dict = {}
    for l in logs:
        mood_counts[l["mood"]] = mood_counts.get(l["mood"], 0) + 1
    top_mood = max(mood_counts, key=mood_counts.get)

    recent = logs[-7:]
    recent_avg = round(sum(l["score"] for l in recent) / len(recent), 2)
    trend = "improving" if recent_avg > avg_score else ("declining" if recent_avg < avg_score else "stable")

    return jsonify({
        "summary": {
            "total_entries":  len(logs),
            "average_score":  avg_score,
            "top_mood":       top_mood,
            "mood_counts":    mood_counts,
            "recent_avg":     recent_avg,
            "trend":          trend,
        }
    }), 200
