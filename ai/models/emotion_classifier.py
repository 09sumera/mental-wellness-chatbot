"""
ai/models/emotion_classifier.py
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Responsibilities:
  1. Sentiment analysis  → polarity (positive / negative / neutral) + score
  2. Emotion detection   → fine-grained emotion label (joy, sadness, anger …)
  3. Crisis detection    → flag messages that suggest self-harm / suicidal ideation

Uses TextBlob for lightweight sentiment and a keyword+heuristic layer for
emotion & crisis so the app works without a GPU.  The HuggingFace transformer
block is included but guarded behind a flag so you can opt-in when hardware
allows.
"""

import re
from textblob import TextBlob

# ── Optional: transformer-based emotion model ─────────────────────────────────
USE_TRANSFORMER = False          # flip to True when GPU / large RAM is available

if USE_TRANSFORMER:
    try:
        from transformers import pipeline as hf_pipeline
        _emotion_pipe = hf_pipeline(
            "text-classification",
            model="j-hartmann/emotion-english-distilroberta-base",
            top_k=1,
        )
    except Exception:
        USE_TRANSFORMER = False
        _emotion_pipe  = None
else:
    _emotion_pipe = None


# ── Keyword banks ─────────────────────────────────────────────────────────────
CRISIS_KEYWORDS: list[str] = [
    "suicide", "suicidal", "kill myself", "end my life", "want to die",
    "can't go on", "cannot go on", "no reason to live", "better off dead",
    "self harm", "self-harm", "cut myself", "hurt myself", "overdose",
    "don't want to be here", "do not want to be here", "give up on life",
    "worthless", "hopeless", "nothing to live for",
]

EMOTION_KEYWORDS: dict[str, list[str]] = {
    "joy":      ["happy", "joyful", "excited", "great", "wonderful", "amazing",
                 "fantastic", "love", "grateful", "thankful", "elated", "glad"],
    "sadness":  ["sad", "unhappy", "crying", "cry", "depressed", "grief",
                 "heartbroken", "lonely", "miserable", "down", "blue", "upset"],
    "anxiety":  ["anxious", "anxiety", "worried", "worry", "nervous", "panic",
                 "scared", "fear", "dread", "overwhelmed", "stressed", "stress"],
    "anger":    ["angry", "furious", "rage", "hate", "mad", "annoyed",
                 "frustrated", "irritated", "livid", "outraged"],
    "calm":     ["calm", "peaceful", "relaxed", "serene", "content", "at ease",
                 "tranquil", "composed", "fine", "okay", "ok"],
    "disgust":  ["disgusted", "gross", "revolting", "sick", "nauseated",
                 "appalled", "repulsed"],
    "surprise": ["surprised", "shocked", "astonished", "amazed", "stunned",
                 "unexpected", "wow", "unbelievable"],
}


# ── Helpers ───────────────────────────────────────────────────────────────────
def _normalise(text: str) -> str:
    return text.lower().strip()


def _contains_any(text: str, keywords: list[str]) -> bool:
    t = _normalise(text)
    return any(kw in t for kw in keywords)


# ── Public API ────────────────────────────────────────────────────────────────
def analyse_sentiment(text: str) -> dict:
    """
    Returns:
        {
            "polarity":  "positive" | "negative" | "neutral",
            "score":     float,   # –1.0 … +1.0
            "subjectivity": float # 0.0 … 1.0
        }
    """
    blob  = TextBlob(text)
    score = round(blob.sentiment.polarity, 4)
    subj  = round(blob.sentiment.subjectivity, 4)

    if score > 0.1:
        polarity = "positive"
    elif score < -0.1:
        polarity = "negative"
    else:
        polarity = "neutral"

    return {"polarity": polarity, "score": score, "subjectivity": subj}


def detect_emotion(text: str) -> str:
    """
    Returns the dominant emotion label as a string.
    Falls back to transformer model when USE_TRANSFORMER is True.
    """
    if USE_TRANSFORMER and _emotion_pipe:
        try:
            result = _emotion_pipe(text[:512])
            return result[0][0]["label"].lower()
        except Exception:
            pass  # fall through to keyword approach

    # Keyword-based scoring
    t      = _normalise(text)
    scores = {emotion: 0 for emotion in EMOTION_KEYWORDS}

    for emotion, keywords in EMOTION_KEYWORDS.items():
        for kw in keywords:
            if kw in t:
                scores[emotion] += 1

    top_emotion = max(scores, key=scores.get)

    # If no keyword matched, infer from TextBlob polarity
    if scores[top_emotion] == 0:
        blob_score = TextBlob(text).sentiment.polarity
        if blob_score > 0.1:
            return "joy"
        elif blob_score < -0.1:
            return "sadness"
        else:
            return "neutral"

    return top_emotion


def detect_crisis(text: str) -> bool:
    """
    Returns True if the message contains crisis / self-harm indicators.
    """
    return _contains_any(text, CRISIS_KEYWORDS)


def classify(text: str) -> dict:
    """
    Master classifier — combines all three signals.

    Returns:
        {
            "sentiment":    { "polarity": ..., "score": ..., "subjectivity": ... },
            "emotion":      str,
            "crisis_alert": bool
        }
    """
    return {
        "sentiment":    analyse_sentiment(text),
        "emotion":      detect_emotion(text),
        "crisis_alert": detect_crisis(text),
    }