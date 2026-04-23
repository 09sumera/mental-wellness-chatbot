"""
tests/test_chatbot.py
─────────────────────
Integration tests for:
  - User registration & login
  - Chat message endpoint (send + history + clear)
  - Mood logging & history & summary
  - Protected route auth enforcement
  - Crisis detection in chat responses

Run with:
    cd backend
    python -m pytest ../tests/test_chatbot.py -v
"""

import sys
import os
import json
import pytest

# ── Path setup ────────────────────────────────────────────────────────────────
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app import create_app


# ── Fixtures ──────────────────────────────────────────────────────────────────
@pytest.fixture(scope="module")
def client():
    """Create a Flask test client with a temp data directory."""
    app = create_app()
    app.config["TESTING"] = True

    # Redirect data storage to a temp folder so tests don't pollute real data
    import tempfile
    tmp = tempfile.mkdtemp()
    import backend.database.db as db_module
    db_module.DATA_DIR    = tmp
    db_module.USERS_FILE  = os.path.join(tmp, "users.json")
    db_module.MOOD_LOGS_FILE = os.path.join(tmp, "mood_logs.json")
    db_module.CHAT_LOGS_FILE = os.path.join(tmp, "chat_logs.json")
    db_module.init_db()

    with app.test_client() as c:
        yield c


@pytest.fixture(scope="module")
def auth_token(client):
    """Register a test user and return their JWT token."""
    client.post("/api/user/register", json={
        "username": "testuser",
        "password": "testpass123",
        "name":     "Test User",
    })
    res  = client.post("/api/user/login", json={
        "username": "testuser",
        "password": "testpass123",
    })
    data = res.get_json()
    return data["token"]


@pytest.fixture
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}


# ══════════════════════════════════════════════════════════════════════════════
# Health check
# ══════════════════════════════════════════════════════════════════════════════
class TestHealth:
    def test_health_endpoint_returns_ok(self, client):
        res = client.get("/api/health")
        assert res.status_code == 200
        assert res.get_json()["status"] == "ok"


# ══════════════════════════════════════════════════════════════════════════════
# Auth — registration & login
# ══════════════════════════════════════════════════════════════════════════════
class TestAuth:
    def test_register_new_user(self, client):
        res = client.post("/api/user/register", json={
            "username": "newuser_chat",
            "password": "password123",
            "name":     "New User",
        })
        assert res.status_code == 201
        data = res.get_json()
        assert "user" in data
        assert data["user"]["username"] == "newuser_chat"

    def test_register_duplicate_username(self, client):
        client.post("/api/user/register", json={"username": "dupuser", "password": "pass123"})
        res = client.post("/api/user/register", json={"username": "dupuser", "password": "pass123"})
        assert res.status_code == 400
        assert "error" in res.get_json()

    def test_register_missing_fields(self, client):
        res = client.post("/api/user/register", json={"username": ""})
        assert res.status_code == 400

    def test_login_valid_credentials(self, client):
        client.post("/api/user/register", json={"username": "loginuser", "password": "mypassword"})
        res = client.post("/api/user/login", json={"username": "loginuser", "password": "mypassword"})
        assert res.status_code == 200
        data = res.get_json()
        assert "token" in data
        assert "user"  in data

    def test_login_wrong_password(self, client):
        res = client.post("/api/user/login", json={"username": "testuser", "password": "wrongpass"})
        assert res.status_code == 401

    def test_login_unknown_user(self, client):
        res = client.post("/api/user/login", json={"username": "ghost", "password": "nopass"})
        assert res.status_code == 401

    def test_get_profile_authenticated(self, client, auth_headers):
        res = client.get("/api/user/profile", headers=auth_headers)
        assert res.status_code == 200
        assert "user" in res.get_json()

    def test_get_profile_unauthenticated(self, client):
        res = client.get("/api/user/profile")
        assert res.status_code == 401

    def test_update_profile_name(self, client, auth_headers):
        res = client.put("/api/user/profile", json={"name": "Updated Name"}, headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["user"]["name"] == "Updated Name"


# ══════════════════════════════════════════════════════════════════════════════
# Chat
# ══════════════════════════════════════════════════════════════════════════════
class TestChat:
    def test_send_message_returns_reply(self, client, auth_headers):
        res = client.post("/api/chat/message",
                          json={"message": "I feel happy today!"},
                          headers=auth_headers)
        assert res.status_code == 200
        data = res.get_json()
        assert "reply"        in data
        assert "emotion"      in data
        assert "sentiment"    in data
        assert "crisis_alert" in data
        assert isinstance(data["reply"], str)
        assert len(data["reply"]) > 0

    def test_send_message_empty_body(self, client, auth_headers):
        res = client.post("/api/chat/message", json={"message": ""},
                          headers=auth_headers)
        assert res.status_code == 400

    def test_send_message_no_auth(self, client):
        res = client.post("/api/chat/message", json={"message": "hello"})
        assert res.status_code == 401

    def test_send_negative_message(self, client, auth_headers):
        res = client.post("/api/chat/message",
                          json={"message": "I feel really sad and hopeless today."},
                          headers=auth_headers)
        assert res.status_code == 200
        data = res.get_json()
        assert data["sentiment"]["polarity"] in ("negative", "neutral", "positive")

    def test_crisis_message_triggers_alert(self, client, auth_headers):
        res = client.post("/api/chat/message",
                          json={"message": "I want to kill myself, I can't go on."},
                          headers=auth_headers)
        assert res.status_code == 200
        data = res.get_json()
        assert data["crisis_alert"] is True
        assert "9152987821" in data["reply"] or "helpline" in data["reply"].lower() or "crisis" in data["reply"].lower()

    def test_get_chat_history(self, client, auth_headers):
        # Send a message first to ensure history is non-empty
        client.post("/api/chat/message",
                    json={"message": "Testing history endpoint."},
                    headers=auth_headers)
        res = client.get("/api/chat/history", headers=auth_headers)
        assert res.status_code == 200
        data = res.get_json()
        assert "history" in data
        assert isinstance(data["history"], list)
        assert len(data["history"]) > 0

    def test_chat_history_no_auth(self, client):
        res = client.get("/api/chat/history")
        assert res.status_code == 401

    def test_clear_chat_history(self, client, auth_headers):
        res = client.delete("/api/chat/history", headers=auth_headers)
        assert res.status_code == 200
        assert "message" in res.get_json()

    def test_sentiment_fields_present(self, client, auth_headers):
        res = client.post("/api/chat/message",
                          json={"message": "I am feeling anxious about my exam."},
                          headers=auth_headers)
        assert res.status_code == 200
        sentiment = res.get_json().get("sentiment", {})
        assert "polarity"     in sentiment
        assert "score"        in sentiment
        assert "subjectivity" in sentiment


# ══════════════════════════════════════════════════════════════════════════════
# Mood
# ══════════════════════════════════════════════════════════════════════════════
class TestMood:
    def test_log_valid_mood(self, client, auth_headers):
        res = client.post("/api/mood/log",
                          json={"mood": "happy", "score": 7.5, "note": "Feeling great!"},
                          headers=auth_headers)
        assert res.status_code == 201
        data = res.get_json()
        assert data["log"]["mood"]  == "happy"
        assert data["log"]["score"] == 7.5

    def test_log_all_valid_moods(self, client, auth_headers):
        for mood in ["sad", "anxious", "angry", "calm", "neutral"]:
            res = client.post("/api/mood/log",
                              json={"mood": mood, "score": 5.0},
                              headers=auth_headers)
            assert res.status_code == 201, f"Failed for mood: {mood}"

    def test_log_invalid_mood(self, client, auth_headers):
        res = client.post("/api/mood/log",
                          json={"mood": "flying", "score": 5},
                          headers=auth_headers)
        assert res.status_code == 400

    def test_log_score_out_of_range(self, client, auth_headers):
        res = client.post("/api/mood/log",
                          json={"mood": "calm", "score": 15},
                          headers=auth_headers)
        assert res.status_code == 400

    def test_log_score_below_range(self, client, auth_headers):
        res = client.post("/api/mood/log",
                          json={"mood": "calm", "score": 0},
                          headers=auth_headers)
        assert res.status_code == 400

    def test_log_mood_no_auth(self, client):
        res = client.post("/api/mood/log", json={"mood": "happy", "score": 5})
        assert res.status_code == 401

    def test_mood_history_returns_list(self, client, auth_headers):
        res = client.get("/api/mood/history", headers=auth_headers)
        assert res.status_code == 200
        data = res.get_json()
        assert "mood_logs" in data
        assert isinstance(data["mood_logs"], list)

    def test_mood_summary_fields(self, client, auth_headers):
        res = client.get("/api/mood/summary", headers=auth_headers)
        assert res.status_code == 200
        summary = res.get_json().get("summary")
        assert summary is not None
        assert "average_score"  in summary
        assert "top_mood"       in summary
        assert "trend"          in summary
        assert "total_entries"  in summary

    def test_mood_summary_trend_values(self, client, auth_headers):
        res = client.get("/api/mood/summary", headers=auth_headers)
        trend = res.get_json()["summary"]["trend"]
        assert trend in ("improving", "declining", "stable")


# ══════════════════════════════════════════════════════════════════════════════
# Edge cases
# ══════════════════════════════════════════════════════════════════════════════
class TestEdgeCases:
    def test_invalid_jwt_rejected(self, client):
        res = client.get("/api/user/profile",
                         headers={"Authorization": "Bearer not.a.real.token"})
        assert res.status_code == 401

    def test_missing_bearer_prefix_rejected(self, client):
        res = client.get("/api/user/profile",
                         headers={"Authorization": "justaplaintoken"})
        assert res.status_code == 401

    def test_404_on_unknown_route(self, client):
        res = client.get("/api/does-not-exist")
        assert res.status_code == 404

    def test_chat_message_with_unicode(self, client, auth_headers):
        res = client.post("/api/chat/message",
                          json={"message": "मैं बहुत खुश हूँ आज 😊"},
                          headers=auth_headers)
        # Should not crash — 200 or graceful error
        assert res.status_code in (200, 400)