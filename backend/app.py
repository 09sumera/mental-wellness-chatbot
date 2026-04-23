from flask import Flask, request, jsonify
from flask_cors import CORS
from routes.chat_routes import chat_bp
from routes.mood_routes import mood_bp
from routes.user_routes import user_bp
from database.db import init_db
from dotenv import load_dotenv
import os

# Load .env FIRST
load_dotenv()

def create_app():
    app = Flask(__name__)

    # Config ─────────────────────────────
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "mental-wellness-secret-key")
    app.config["DEBUG"] = os.getenv("FLASK_DEBUG", "true").lower() == "true"

    # CORS ───────────────────────────────
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Handle OPTIONS (keeping your existing fix)
    @app.before_request
    def handle_options():
        if request.method == "OPTIONS":
            return jsonify({"status": "ok"}), 200

    # Database ───────────────────────────
    init_db()

    # Blueprints ─────────────────────────
    app.register_blueprint(chat_bp, url_prefix="/api/chat")
    app.register_blueprint(mood_bp, url_prefix="/api/mood")
    app.register_blueprint(user_bp, url_prefix="/api/user")

    # Home route (keeping yours)
    @app.route("/")
    def home():
        return {"message": "Backend running"}, 200

    # Health check ───────────────────────
    @app.route("/api/health", methods=["GET"])
    def health_check():
        return {
            "status": "ok",
            "message": "Mental Wellness Chatbot API is running.",
            "ai": "Groq LLM (Llama 3.3 70B)"
        }, 200

    # Error handlers ─────────────────────
    @app.errorhandler(404)
    def not_found(e):
        return {"error": "Endpoint not found."}, 404

    @app.errorhandler(500)
    def server_error(e):
        return {"error": "Internal server error.", "details": str(e)}, 500

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)))