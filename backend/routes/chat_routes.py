from flask import Blueprint, request, jsonify
import sys, os, uuid

# Allow imports from ai folder
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "ai"))
from pipeline.mood_pipeline import process_message, generate_title

# Database functions (MongoDB)
from database.db import (
    save_chat_log,
    get_chat_logs_by_user,
    get_chat_logs_by_chat_id,
    get_conversations_by_user,
    delete_chat_by_id,
    rename_chat,
    delete_chat_logs_by_user
)

# JWT
from models.user_model import decode_token

chat_bp = Blueprint("chat", __name__)


# ── AUTH HELPER ───────────────────────────────────────────
def _get_user_id(request):
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None, ({"error": "Missing or invalid Authorization header."}, 401)

    token = auth.split(" ", 1)[1]
    payload = decode_token(token)

    if not payload or "error" in payload:
        return None, ({"error": payload.get("error", "Unauthorised.")}, 401)

    return payload["user_id"], None


# ── SEND MESSAGE ──────────────────────────────────────────
@chat_bp.route("/message", methods=["POST"])
def send_message():
    body = request.get_json(silent=True) or {}
    user_message = body.get("message", "").strip()
    chat_id = body.get("chat_id")

    if not user_message:
        return jsonify({"error": "Message cannot be empty"}), 400

    try:
        user_id, err = _get_user_id(request)
        if err:
            return jsonify(err[0]), err[1]

        # Generate new chat if not provided
        if not chat_id:
            chat_id = str(uuid.uuid4())

        # ✅ Fetch history for memory
        all_history = get_chat_logs_by_user(user_id)
        recent_history = all_history[-10:] if all_history else []

        # ✅ Pass history to Groq pipeline
        result = process_message(user_message, conversation_history=recent_history)

        # Save user message
        save_chat_log(
            user_id=user_id,
            role="user",
            message=user_message,
            sentiment=result,
            chat_id=chat_id
        )

        # Save bot reply
        save_chat_log(
            user_id=user_id,
            role="assistant",
            message=result.get("reply", ""),
            sentiment=result,
            chat_id=chat_id
        )

        # Auto-generate a topic title after first exchange (2 messages)
        chat_logs = get_chat_logs_by_chat_id(chat_id)
        if len(chat_logs) == 2:  # user + assistant = first full exchange
            try:
                title = generate_title(chat_logs)
                if title:
                    rename_chat(chat_id, title)
            except Exception as title_err:
                print(f"[title gen error] {title_err}")

        return jsonify({
            "reply": result["reply"],
            "emotion": result["emotion"],
            "intensity": result["intensity"],
            "topics": result["topics"],
            "escalation": result["escalation"],
            "chat_id": chat_id
        }), 200

    except Exception as e:
        return jsonify({
            "reply": "Something went wrong 💙",
            "error": str(e)
        }), 200


# ── FULL HISTORY (ALL MESSAGES) ───────────────────────────
@chat_bp.route("/history", methods=["GET"])
def get_history():
    user_id, err = _get_user_id(request)
    if err:
        return jsonify(err[0]), err[1]

    try:
        logs = get_chat_logs_by_user(user_id)
        return jsonify({"history": logs}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@chat_bp.route("/history", methods=["DELETE"])
def clear_history():
    user_id, err = _get_user_id(request)
    if err:
        return jsonify(err[0]), err[1]

    try:
        deleted = delete_chat_logs_by_user(user_id)
        return jsonify({"message": f"Deleted {deleted} items"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── SIDEBAR: ALL CONVERSATIONS (1 PER CHAT) ───────────────
@chat_bp.route("/conversations", methods=["GET"])
def get_conversations():
    user_id, err = _get_user_id(request)
    if err:
        return jsonify(err[0]), err[1]

    try:
        conversations = get_conversations_by_user(user_id)
        return jsonify({
            "conversations": conversations
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── LOAD ONE FULL CHAT ────────────────────────────────────
@chat_bp.route("/conversation/<chat_id>", methods=["GET"])
def get_conversation(chat_id):
    user_id, err = _get_user_id(request)
    if err:
        return jsonify(err[0]), err[1]

    try:
        logs = get_chat_logs_by_chat_id(chat_id)
        return jsonify({
            "messages": logs
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── DELETE ONE FULL CHAT ──────────────────────────────────
@chat_bp.route("/conversation/<chat_id>", methods=["DELETE"])
def delete_conversation(chat_id):
    user_id, err = _get_user_id(request)
    if err:
        return jsonify(err[0]), err[1]

    try:
        delete_chat_by_id(chat_id)
        return jsonify({"message": "Chat deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── RENAME A CHAT ─────────────────────────────────────────
@chat_bp.route("/conversation/<chat_id>", methods=["PUT"])
def rename_conversation(chat_id):
    user_id, err = _get_user_id(request)
    if err:
        return jsonify(err[0]), err[1]

    body = request.get_json(silent=True) or {}
    new_title = body.get("title", "").strip()

    if not new_title:
        return jsonify({"error": "Title cannot be empty"}), 400

    try:
        rename_chat(chat_id, new_title)
        return jsonify({"message": "Chat renamed successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500