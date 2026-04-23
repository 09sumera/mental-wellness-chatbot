from flask import Blueprint, request, jsonify
from models.user_model import register_user, login_user, get_user_profile, decode_token, request_otp
from database.db import update_user

user_bp = Blueprint("user", __name__)


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


@user_bp.route("/request-otp", methods=["POST"])
def request_otp_route():
    """
    Request an OTP for an email address.
    """
    body = request.get_json(silent=True) or {}
    username = body.get("username", "").strip()

    result = request_otp(username)
    if not result.get("success"):
        return jsonify({"error": result.get("error", "Error requesting OTP")}), 400

    return jsonify({"message": result["message"]}), 200

# ── POST /api/user/register ───────────────────────────────────────────────────
@user_bp.route("/register", methods=["POST"])
def register():
    """
    Register a new user.

    Body JSON:
        { "username": "alice@gmail.com", "password": "secret", "name": "Alice", "otp": "123456" }
    """
    body     = request.get_json(silent=True) or {}
    username = body.get("username", "").strip()
    password = body.get("password", "")
    name     = body.get("name", "").strip()
    otp      = body.get("otp", "").strip()

    result = register_user(username, password, name, otp)
    if not result["success"]:
        return jsonify({"error": result["error"]}), 400

    return jsonify({
        "message": "User registered successfully.",
        "user":    result["user"],
    }), 201


# ── POST /api/user/login ──────────────────────────────────────────────────────
@user_bp.route("/login", methods=["POST"])
def login():
    """
    Authenticate a user and return a JWT.

    Body JSON:
        { "username": "alice", "password": "secret" }
    """
    body     = request.get_json(silent=True) or {}
    username = body.get("username", "").strip()
    password = body.get("password", "")

    result = login_user(username, password)
    if not result["success"]:
        return jsonify({"error": result["error"]}), 401

    return jsonify({
        "message": "Login successful.",
        "token":   result["token"],
        "user":    result["user"],
    }), 200


# ── GET /api/user/profile ─────────────────────────────────────────────────────
@user_bp.route("/profile", methods=["GET"])
def profile():
    """Return the profile of the authenticated user."""
    user_id, err = _get_user_id(request)
    if err:
        return jsonify(err[0]), err[1]

    user = get_user_profile(user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404

    return jsonify({"user": user}), 200


# ── PUT /api/user/profile ─────────────────────────────────────────────────────
@user_bp.route("/profile", methods=["PUT"])
def update_profile():
    """
    Update allowed profile fields (name only for now).

    Body JSON:
        { "name": "Alice Updated" }
    """
    user_id, err = _get_user_id(request)
    if err:
        return jsonify(err[0]), err[1]

    body    = request.get_json(silent=True) or {}
    allowed = {k: v for k, v in body.items() if k in {"name"}}

    if not allowed:
        return jsonify({"error": "No updatable fields provided."}), 400

    updated = update_user(user_id, allowed)
    if not updated:
        return jsonify({"error": "User not found."}), 404

    safe = {k: v for k, v in updated.items() if k != "password_hash"}
    return jsonify({"message": "Profile updated.", "user": safe}), 200
