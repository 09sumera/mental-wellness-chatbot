import hashlib
import os
import jwt
import random
import smtplib
from email.message import EmailMessage
from datetime import datetime, timedelta
from database.db import get_user_by_username, get_user_by_id, create_user, save_otp, get_otp, delete_otp

SECRET_KEY = os.getenv("SECRET_KEY", "mental-wellness-secret-key")
TOKEN_EXPIRY_HOURS = 24

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")


# ── Password helpers ──────────────────────────────────────────────────────────
def hash_password(password: str) -> str:
    """Return a SHA-256 hex digest of the password."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def verify_password(plain: str, hashed: str) -> bool:
    return hash_password(plain) == hashed


# ── JWT helpers ───────────────────────────────────────────────────────────────
def generate_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp":     datetime.utcnow() + timedelta(hours=TOKEN_EXPIRY_HOURS),
        "iat":     datetime.utcnow(),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return {"error": "Token expired."}
    except jwt.InvalidTokenError:
        return {"error": "Invalid token."}


# ── User operations ───────────────────────────────────────────────────────────
def register_user(username: str, password: str, name: str = "", otp: str = "") -> dict:
    """
    Register a new user, requiring email (username) and a valid OTP sent to that email.
    Returns {"success": True, "token": "...", "user": {...}} or {"success": False, "error": "..."}.
    """
    if not username or not password or not otp:
        return {"success": False, "error": "Email, password, and OTP are required."}

    # Verify OTP
    record = get_otp(username)
    if not record:
        return {"success": False, "error": "No pending OTP or OTP expired. Please request a new OTP."}
        
    if record["otp"] != otp:
        return {"success": False, "error": "Invalid OTP."}
        
    if datetime.fromisoformat(record["expires_at"]) < datetime.utcnow():
        delete_otp(username)
        return {"success": False, "error": "OTP has expired. Please request a new one."}

    delete_otp(username)

    if get_user_by_username(username):
        return {"success": False, "error": "User with this email already exists."}

    password_hash = hash_password(password)
    user = create_user(username, password_hash, name)

    # Automatically generate a token upon successful registration
    token = generate_token(user["id"])
    safe_user = {k: v for k, v in user.items() if k != "password_hash"}
    return {"success": True, "token": token, "user": safe_user}


def login_user(username: str, password: str) -> dict:
    """
    Authenticate a user.
    Returns {"success": True, "token": "...", "user": {...}} or an error dict.
    """
    if not username or not password:
        return {"success": False, "error": "Username and password are required."}

    user = get_user_by_username(username)
    if not user:
        return {"success": False, "error": "User not found."}

    if not verify_password(password, user["password_hash"]):
        return {"success": False, "error": "Incorrect password."}

    token = generate_token(user["id"])
    safe_user = {k: v for k, v in user.items() if k != "password_hash"}
    return {"success": True, "token": token, "user": safe_user}


def send_otp_email(to_email: str, otp: str):
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print("\n=========================================")
        print(f"⚠️ SMTP not configured in .env. Falling back to console.")
        print(f"🔐 SIMULATED OTP FOR '{to_email}': {otp}")
        print("=========================================\n")
        return

    msg = EmailMessage()
    msg.set_content(f"Your mental wellness chatbot verification code is: {otp}\n\nThis code will expire in 5 minutes.")
    msg["Subject"] = "Your Verification Code"
    msg["From"] = SMTP_EMAIL
    msg["To"] = to_email

    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"✅ OTP Email successfully sent to {to_email}")
    except Exception as e:
        print(f"❌ Failed to send email to {to_email}: {e}")

def request_otp(username: str) -> dict:
    if not username:
        return {"success": False, "error": "Email is required."}
    
    otp = str(random.randint(100000, 999999))
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    save_otp(username, otp, expires_at)
    
    # Attempt to send the real email
    send_otp_email(username, otp)
    
    return {"success": True, "message": "OTP generated. Check your email inbox."}


def get_user_profile(user_id: str) -> dict | None:
    """Return the user profile without the password hash."""
    user = get_user_by_id(user_id)
    if not user:
        return None
    return {k: v for k, v in user.items() if k != "password_hash"}
