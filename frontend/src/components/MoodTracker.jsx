import { useState, useEffect } from "react";
import { moodAPI } from "../services/api";

const MOODS = [
    { label: "Happy", value: "happy", emoji: "😊", color: "#f2c97e" },
    { label: "Calm", value: "calm", emoji: "😌", color: "#4ecdc4" },
    { label: "Anxious", value: "anxious", emoji: "😰", color: "#f28b82" },
    { label: "Sad", value: "sad", emoji: "😢", color: "#82a8f2" },
    { label: "Angry", value: "angry", emoji: "😠", color: "#f2825a" },
    { label: "Excited", value: "excited", emoji: "🤩", color: "#d4a8f2" },
    { label: "Depressed", value: "depressed", emoji: "😞", color: "#7a9ab5" },
    { label: "Neutral", value: "neutral", emoji: "😐", color: "#90b8b5" },
];

export default function MoodTracker({ onLogged }) {
    const [selected, setSelected] = useState(null);
    const [score, setScore] = useState(5);
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        if (!selected) { setError("Please select a mood."); return; }
        setLoading(true); setError(""); setSuccess(false);
        try {
            await moodAPI.logMood({ mood: selected.value, score, note });
            setSuccess(true);
            setNote("");
            if (onLogged) onLogged();
            setTimeout(() => setSuccess(false), 3000);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const selectedMood = MOODS.find((m) => m.value === selected?.value);

    return (
        <div style={styles.card} className="card">
            <h3 style={styles.heading}>Log Your Mood</h3>
            <p style={styles.sub}>How are you feeling right now?</p>

            {/* Mood grid */}
            <div style={styles.grid}>
                {MOODS.map((m) => (
                    <button
                        key={m.value}
                        style={{
                            ...styles.moodBtn,
                            ...(selected?.value === m.value
                                ? { borderColor: m.color, background: `${m.color}18`, color: m.color }
                                : {}),
                        }}
                        onClick={() => setSelected(m)}
                    >
                        <span style={styles.emoji}>{m.emoji}</span>
                        <span style={styles.moodLabel}>{m.label}</span>
                    </button>
                ))}
            </div>

            {/* Score slider */}
            <div style={styles.sliderSection}>
                <div style={styles.sliderLabel}>
                    <span>Intensity</span>
                    <span style={{
                        color: selectedMood?.color || "var(--teal)",
                        fontWeight: 600, fontSize: "16px"
                    }}>
                        {score} / 10
                    </span>
                </div>
                <input
                    type="range" min={1} max={10} step={0.5}
                    value={score}
                    onChange={(e) => setScore(parseFloat(e.target.value))}
                    style={styles.slider}
                />
                <div style={styles.sliderTicks}>
                    <span>Mild</span><span>Moderate</span><span>Intense</span>
                </div>
            </div>

            {/* Note */}
            <textarea
                className="input"
                placeholder="Add a note (optional)…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                style={{ resize: "none", marginBottom: "12px" }}
            />

            {error && <p style={styles.error}>{error}</p>}
            {success && <p style={styles.successMsg}>✅ Mood logged successfully!</p>}

            <button
                className="btn btn-primary"
                style={{ width: "100%" }}
                onClick={handleSubmit}
                disabled={loading}
            >
                {loading ? "Logging…" : "Log Mood"}
            </button>
        </div>
    );
}

const styles = {
    card: { padding: "24px" },
    heading: {
        fontFamily: "var(--font-display)", fontSize: "20px",
        color: "var(--text-primary)", marginBottom: "4px",
    },
    sub: { fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" },
    grid: {
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        gap: "10px", marginBottom: "20px",
    },
    moodBtn: {
        display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
        padding: "12px 8px", borderRadius: "var(--radius-md)",
        background: "var(--bg-input)", border: "1px solid var(--border)",
        cursor: "pointer", color: "var(--text-secondary)",
        transition: "all var(--transition)",
    },
    emoji: { fontSize: "22px" },
    moodLabel: { fontSize: "11px", fontWeight: 500 },
    sliderSection: { marginBottom: "16px" },
    sliderLabel: {
        display: "flex", justifyContent: "space-between",
        fontSize: "13px", color: "var(--text-secondary)", marginBottom: "8px",
    },
    slider: { width: "100%", accentColor: "var(--teal)", marginBottom: "4px" },
    sliderTicks: {
        display: "flex", justifyContent: "space-between",
        fontSize: "11px", color: "var(--text-muted)",
    },
    error: { color: "var(--rose)", fontSize: "13px", marginBottom: "8px" },
    successMsg: { color: "var(--teal)", fontSize: "13px", marginBottom: "8px" },
};