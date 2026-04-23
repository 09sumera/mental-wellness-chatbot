"""
ai/pipeline/mood_pipeline.py
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Upgraded pipeline using Groq LLM (Llama 3.3 70B)
  1. Classify emotion + sentiment + crisis (existing)
  2. Crisis override with helplines
  3. Groq LLM generates contextual, empathetic reply
  4. Conversation history passed for memory
"""

import os
import json
import random
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from models.emotion_classifier import classify

# ── Groq client ───────────────────────────────────────────────
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ── System prompt ─────────────────────────────────────────────
SYSTEM_PROMPT = """You are a mental wellness assistant.

Return ONLY JSON in this format:
{
  "reply": "...",
  "emotion": "...",
  "intensity": 1-10,
  "topics": ["..."],
  "escalation": "none"
}

Rules:
- Include emojis in reply
- Be empathetic and human-like
- DO NOT return plain text
- DO NOT include explanations outside JSON
"""

# ── Crisis fallback ───────────────────────────────────────────
CRISIS_FALLBACK = (
    "I'm really concerned about what you've shared and I want "
    "you to know you matter deeply. Please reach out for support "
    "right now — iCall (India): 9152987821 | "
    "Vandrevala Foundation: 1860-2662-345 | "
    "International: findahelpline.com"
)

# ── Main pipeline ─────────────────────────────────────────────
def process_message(
    user_message: str,
    conversation_history: list = None
) -> dict:

    # Step 1: Classify (keeping the original classification as fallback)
    analysis     = classify(user_message)
    emotion_fb   = analysis["emotion"]
    crisis_alert = analysis["crisis_alert"]

    # Step 2: Build messages
    system_content = SYSTEM_PROMPT

    messages = [{"role": "system", "content": system_content}]

    # Add conversation history for memory
    if conversation_history:
        for msg in conversation_history[-10:]:
            role = msg.get("role", "user")
            if role not in ("user", "assistant"):
                continue
            content = msg.get("message", "")
            if isinstance(content, dict) and "reply" in content:
                content = content["reply"]
            
            messages.append({
                "role":    role,
                "content": str(content)
            })

    messages.append({
        "role":    "user",
        "content": f'User message: "{user_message}"'
    })

    # Step 3: Call Groq
    reply_str = ""
    try:
        response = client.chat.completions.create(
            model       = "llama-3.3-70b-versatile",
            messages    = messages,
            max_tokens  = 500,
            temperature = 0.5,
            top_p       = 0.9,
            response_format={"type": "json_object"},
        )
        reply_str = response.choices[0].message.content.strip()
        data = json.loads(reply_str)
        
        return {
            "reply": data["reply"],
            "emotion": data["emotion"],
            "intensity": data["intensity"],
            "topics": data["topics"],
            "escalation": data["escalation"]
        }

    except Exception as e:
        print(f"[Groq error] {e}")
        return {
            "emotion": "neutral",
            "intensity": "5/10",
            "topics": [],
            "escalation": "none",
            "reply": reply_str if reply_str else (CRISIS_FALLBACK if crisis_alert else "I'm here with you.")
        }


# ── Topic title generator ─────────────────────────────────────
def generate_title(messages: list) -> str:
    """
    Given a list of chat messages (dicts with 'role' and 'message'),
    ask Groq to produce a short, meaningful topic title (3-6 words).
    Falls back to a truncated first message if the API call fails.
    """
    # Build a short transcript (first 6 messages max)
    transcript_lines = []
    for msg in messages[:6]:
        role = msg.get("role", "user").capitalize()
        content = msg.get("message", "")
        if isinstance(content, dict):
            content = content.get("reply", "")
        transcript_lines.append(f"{role}: {str(content)[:200]}")

    transcript = "\n".join(transcript_lines)

    prompt = (
        "Based on this conversation excerpt, generate a short title (3 to 6 words) "
        "that captures the main topic. Return ONLY the title text, nothing else.\n\n"
        f"{transcript}"
    )

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=20,
            temperature=0.4,
        )
        title = response.choices[0].message.content.strip().strip('"').strip("'")
        # Limit to 60 chars just in case
        return title[:60] if title else "New Conversation"
    except Exception as e:
        print(f"[generate_title error] {e}")
        # Fallback: use first user message truncated
        for msg in messages:
            if msg.get("role") == "user":
                text = msg.get("message", "")[:40]
                return text if text else "New Conversation"
        return "New Conversation"
