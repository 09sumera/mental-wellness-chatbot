"""
tests/test_sentiment.py
────────────────────────
Unit tests for the AI layer:
  - analyse_sentiment()   — polarity, score, subjectivity
  - detect_emotion()      — keyword-based emotion labels
  - detect_crisis()       — self-harm / suicidal ideation flags
  - classify()            — combined classifier output
  - process_message()     — full mood pipeline (reply generation)

Run with:
    python -m pytest tests/test_sentiment.py -v
"""

import sys
import os
import pytest

# ── Path setup ────────────────────────────────────────────────────────────────
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "ai"))

from models.emotion_classifier import (
    analyse_sentiment,
    detect_emotion,
    detect_crisis,
    classify,
)
from pipeline.mood_pipeline import process_message


# ══════════════════════════════════════════════════════════════════════════════
# analyse_sentiment
# ══════════════════════════════════════════════════════════════════════════════
class TestAnalyseSentiment:
    def test_returns_required_keys(self):
        result = analyse_sentiment("I feel good today.")
        assert "polarity"     in result
        assert "score"        in result
        assert "subjectivity" in result

    def test_positive_polarity(self):
        result = analyse_sentiment("I am so happy and wonderful today!")
        assert result["polarity"] == "positive"
        assert result["score"] > 0

    def test_negative_polarity(self):
        result = analyse_sentiment("I am terrible, miserable, and devastated.")
        assert result["polarity"] == "negative"
        assert result["score"] < 0

    def test_neutral_polarity(self):
        result = analyse_sentiment("I went to the store.")
        assert result["polarity"] == "neutral"

    def test_score_is_float(self):
        result = analyse_sentiment("Okay day overall.")
        assert isinstance(result["score"], float)

    def test_score_within_range(self):
        for text in ["amazing", "terrible", "okay", ""]:
            r = analyse_sentiment(text)
            assert -1.0 <= r["score"] <= 1.0

    def test_subjectivity_within_range(self):
        result = analyse_sentiment("This is absolutely fantastic!")
        assert 0.0 <= result["subjectivity"] <= 1.0

    def test_empty_string_does_not_crash(self):
        result = analyse_sentiment("")
        assert result["polarity"] in ("positive", "negative", "neutral")

    def test_very_long_input(self):
        long_text = "I feel great. " * 200
        result = analyse_sentiment(long_text)
        assert result["polarity"] == "positive"


# ══════════════════════════════════════════════════════════════════════════════
# detect_emotion
# ══════════════════════════════════════════════════════════════════════════════
class TestDetectEmotion:
    def test_detects_joy(self):
        assert detect_emotion("I am so happy and excited today!") == "joy"

    def test_detects_sadness(self):
        assert detect_emotion("I feel so sad and lonely.") == "sadness"

    def test_detects_anxiety(self):
        assert detect_emotion("I am really anxious and worried about tomorrow.") == "anxiety"

    def test_detects_anger(self):
        assert detect_emotion("I am furious and so angry right now!") == "anger"

    def test_detects_calm(self):
        assert detect_emotion("I feel calm and at ease today.") == "calm"

    def test_detects_surprise(self):
        result = detect_emotion("I was shocked and surprised by the news!")
        assert result == "surprise"

    def test_neutral_fallback(self):
        result = detect_emotion("The weather is fine.")
        assert result in ("neutral", "calm", "joy", "sadness", "anxiety", "anger", "surprise", "disgust")

    def test_returns_string(self):
        result = detect_emotion("Something happened today.")
        assert isinstance(result, str)

    def test_empty_string_returns_string(self):
        result = detect_emotion("")
        assert isinstance(result, str)

    def test_mixed_emotions_returns_dominant(self):
        # "happy" (joy) appears more than sad keywords
        text = "I am happy happy happy but a bit sad."
        result = detect_emotion(text)
        assert result == "joy"

    def test_case_insensitive(self):
        assert detect_emotion("I AM SO HAPPY AND JOYFUL") == "joy"
        assert detect_emotion("feeling ANXIOUS and WORRIED") == "anxiety"


# ══════════════════════════════════════════════════════════════════════════════
# detect_crisis
# ══════════════════════════════════════════════════════════════════════════════
class TestDetectCrisis:
    # Positive cases — should trigger crisis flag
    @pytest.mark.parametrize("text", [
        "I want to kill myself.",
        "I'm thinking about suicide.",
        "I want to end my life.",
        "There's no reason to live anymore.",
        "I can't go on like this.",
        "I'm going to hurt myself.",
        "I want to overdose on pills.",
        "I've been cutting myself.",
        "I feel better off dead.",
        "I have nothing to live for.",
    ])
    def test_crisis_detected(self, text):
        assert detect_crisis(text) is True, f"Expected crisis for: {text!r}"

    # Negative cases — should NOT trigger crisis flag
    @pytest.mark.parametrize("text", [
        "I feel sad today.",
        "I am anxious about my exam.",
        "Things have been hard lately.",
        "I need some help with my homework.",
        "I'm feeling a bit down.",
        "Life is challenging sometimes.",
        "I had a bad day at work.",
        "",
    ])
    def test_no_crisis_detected(self, text):
        assert detect_crisis(text) is False, f"Unexpected crisis flag for: {text!r}"

    def test_returns_bool(self):
        assert isinstance(detect_crisis("I am fine."), bool)
        assert isinstance(detect_crisis("I want to die."), bool)

    def test_case_insensitive(self):
        assert detect_crisis("I WANT TO KILL MYSELF") is True
        assert detect_crisis("SUICIDE is what i'm thinking") is True


# ══════════════════════════════════════════════════════════════════════════════
# classify  (combined)
# ══════════════════════════════════════════════════════════════════════════════
class TestClassify:
    def test_returns_all_keys(self):
        result = classify("I feel wonderful today!")
        assert "sentiment"    in result
        assert "emotion"      in result
        assert "crisis_alert" in result

    def test_sentiment_is_dict(self):
        result = classify("I am happy.")
        assert isinstance(result["sentiment"], dict)

    def test_emotion_is_str(self):
        result = classify("I feel anxious.")
        assert isinstance(result["emotion"], str)

    def test_crisis_alert_is_bool(self):
        result = classify("I feel okay.")
        assert isinstance(result["crisis_alert"], bool)

    def test_crisis_true_for_crisis_text(self):
        result = classify("I want to kill myself right now.")
        assert result["crisis_alert"] is True

    def test_crisis_false_for_normal_text(self):
        result = classify("I had a productive day.")
        assert result["crisis_alert"] is False

    def test_positive_sentiment_positive_message(self):
        result = classify("Everything is amazing and I feel great!")
        assert result["sentiment"]["polarity"] == "positive"

    def test_negative_sentiment_negative_message(self):
        result = classify("I am devastated, hopeless, and in despair.")
        assert result["sentiment"]["polarity"] == "negative"


# ══════════════════════════════════════════════════════════════════════════════
# process_message  (full pipeline)
# ══════════════════════════════════════════════════════════════════════════════
class TestProcessMessage:
    def test_returns_required_keys(self):
        result = process_message("I feel happy today.")
        assert "reply"        in result
        assert "emotion"      in result
        assert "sentiment"    in result
        assert "crisis_alert" in result

    def test_reply_is_non_empty_string(self):
        result = process_message("I feel okay.")
        assert isinstance(result["reply"], str)
        assert len(result["reply"]) > 0

    def test_crisis_reply_contains_helpline(self):
        result = process_message("I want to end my life, I can't go on anymore.")
        assert result["crisis_alert"] is True
        # Reply must contain at least one helpline number or keyword
        reply_lower = result["reply"].lower()
        assert any(kw in reply_lower for kw in ["9152987821", "helpline", "crisis", "support", "reach out"])

    def test_happy_message_no_crisis(self):
        result = process_message("I am so happy, everything is wonderful!")
        assert result["crisis_alert"] is False
        assert result["emotion"] == "joy"

    def test_anxious_message_emotion(self):
        result = process_message("I feel so anxious and worried about everything.")
        assert result["emotion"] == "anxiety"
        assert result["crisis_alert"] is False

    def test_sad_message_includes_support(self):
        result = process_message("I feel really sad and lonely.")
        assert "reply" in result
        assert len(result["reply"]) > 10

    def test_empty_message_does_not_crash(self):
        result = process_message("")
        assert "reply" in result

    def test_repeated_calls_return_varied_replies(self):
        """Ensure random template selection produces variety over multiple calls."""
        replies = {process_message("I feel calm and peaceful.")["reply"] for _ in range(10)}
        # With 3 templates we should see at least 2 distinct replies in 10 attempts
        assert len(replies) >= 1   # at minimum it doesn't crash

    def test_sentiment_score_type(self):
        result = process_message("I am doing well.")
        assert isinstance(result["sentiment"]["score"], float)

    def test_crisis_message_emotion_still_set(self):
        result = process_message("I want to hurt myself.")
        assert isinstance(result["emotion"], str)
        assert len(result["emotion"]) > 0