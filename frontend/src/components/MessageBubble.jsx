/**
 * MessageBubble.jsx
 * ─────────────────
 * A standalone, reusable message bubble component used by ChatWindow.
 * Handles both user and assistant messages with:
 *   - Emotion tag badge
 *   - Crisis alert indicator
 *   - Sentiment polarity dot
 *   - Animated entrance
 *   - Timestamp display
 */

const EMOTION_META = {
    joy: { emoji: "😊", color: "#f2c97e" },
    sadness: { emoji: "😢", color: "#82a8f2" },
    anxiety: { emoji: "😰", color: "#f28b82" },
    anger: { emoji: "😠", color: "#f2825a" },
    calm: { emoji: "😌", color: "#4ecdc4" },
    disgust: { emoji: "😒", color: "#a8c17a" },
    surprise: { emoji: "😲", color: "#d4a8f2" },
    neutral: { emoji: "💬", color: "#90b8b5" },
};

const POLARITY_DOT = {
    positive: { color: "#4ecdc4", label: "positive" },
    negative: { color: "#f28b82", label: "negative" },
    neutral: { color: "#90b8b5", label: "neutral" },
};

function formatTime(iso) {
    try {
        return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
        return "";
    }
}

/**
 * Props:
 *   role         — "user" | "assistant"
 *   message      — string content
 *   emotion      — string (optional)
 *   sentiment    — { polarity, score, subjectivity } (optional)
 *   crisis_alert — bool (optional)
 *   created_at   — ISO string (optional)
 *   animDelay    — CSS delay string e.g. "0.1s" (optional)
 */
export default function MessageBubble({
    role,
    message,
    emotion,
    sentiment,
    crisis_alert,
    created_at,
    animDelay = "0s",
}) {
    const isUser = role === "user";
    const emotionMeta = EMOTION_META[emotion] || null;
    const polarityMeta = sentiment?.polarity ? POLARITY_DOT[sentiment.polarity] : null;

    return (
        <div
            style={{
                ...styles.row,
                justifyContent: isUser ? "flex-end" : "flex-start",
                animationDelay: animDelay,
            }}
            className="fade-up"
        >
            {/* Bot avatar */}
            {!isUser && (
                <div style={styles.botAvatar} aria-label="Assistant">
                    <img src="/logo.png" alt="Serenova" style={{ width: "20px", height: "20px", objectFit: "contain" }} />
                </div>
            )}

            <div style={{ maxWidth: "68%", display: "flex", flexDirection: "column", gap: "5px" }}>

                {/* Crisis banner — shown above the bubble */}
                {crisis_alert && (
                    <div style={styles.crisisBanner}>
                        <span>🚨</span>
                        <span>Crisis support resources have been shared. You are not alone.</span>
                    </div>
                )}

                {/* Bubble */}
                <div
                    style={{
                        ...styles.bubble,
                        ...(isUser ? styles.bubbleUser : styles.bubbleBot),
                        ...(crisis_alert ? styles.bubbleCrisis : {}),
                    }}
                >
                    {message}
                </div>

                {/* Meta row */}
                <div style={{ ...styles.metaRow, justifyContent: isUser ? "flex-end" : "flex-start" }}>

                    {/* Emotion tag */}
                    {emotionMeta && !isUser && (
                        <span
                            style={{
                                ...styles.tag,
                                background: `${emotionMeta.color}18`,
                                color: emotionMeta.color,
                                border: `1px solid ${emotionMeta.color}40`,
                            }}
                        >
                            {emotionMeta.emoji} {emotion}
                        </span>
                    )}

                    {/* Polarity dot */}
                    {polarityMeta && !isUser && (
                        <span style={styles.polarityWrap} title={`Sentiment: ${polarityMeta.label}`}>
                            <span
                                style={{
                                    ...styles.polarityDot,
                                    background: polarityMeta.color,
                                    boxShadow: `0 0 6px ${polarityMeta.color}80`,
                                }}
                            />
                            <span style={styles.polarityLabel}>{polarityMeta.label}</span>
                        </span>
                    )}

                    {/* Score badge */}
                    {sentiment?.score !== undefined && !isUser && (
                        <span style={styles.scoreTag}>
                            {sentiment.score > 0 ? "+" : ""}{sentiment.score.toFixed(2)}
                        </span>
                    )}

                    {/* Timestamp */}
                    {created_at && (
                        <span style={styles.time}>{formatTime(created_at)}</span>
                    )}
                </div>
            </div>

            {/* User label */}
            {isUser && (
                <div style={styles.userLabel} aria-label="You">
                    You
                </div>
            )}
        </div>
    );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = {
    row: {
        display: "flex",
        alignItems: "flex-end",
        gap: "10px",
    },
    botAvatar: {
        width: 34,
        height: 34,
        borderRadius: "50%",
        background: "var(--teal-glow)",
        border: "1px solid var(--teal-dim)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "17px",
        flexShrink: 0,
        boxShadow: "var(--shadow-teal)",
    },
    userLabel: {
        fontSize: "11px",
        color: "var(--text-muted)",
        flexShrink: 0,
        paddingBottom: "6px",
        letterSpacing: "0.3px",
    },
    bubble: {
        padding: "12px 16px",
        borderRadius: "var(--radius-md)",
        fontSize: "14px",
        lineHeight: 1.65,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        transition: "box-shadow 0.2s ease",
    },
    bubbleUser: {
        background: "var(--teal-dim)",
        color: "#fff",
        borderBottomRightRadius: "4px",
        boxShadow: "0 2px 12px rgba(42,138,132,0.3)",
    },
    bubbleBot: {
        background: "var(--bg-input)",
        color: "var(--text-primary)",
        border: "1px solid var(--border)",
        borderBottomLeftRadius: "4px",
    },
    bubbleCrisis: {
        border: "1px solid rgba(242,139,130,0.4)",
        background: "rgba(242,139,130,0.07)",
        color: "var(--text-primary)",
    },
    crisisBanner: {
        display: "flex",
        alignItems: "center",
        gap: "7px",
        background: "rgba(242,139,130,0.12)",
        border: "1px solid rgba(242,139,130,0.3)",
        borderRadius: "var(--radius-sm)",
        padding: "7px 12px",
        fontSize: "12px",
        color: "var(--rose)",
        fontWeight: 500,
    },
    metaRow: {
        display: "flex",
        alignItems: "center",
        gap: "7px",
        flexWrap: "wrap",
    },
    tag: {
        fontSize: "11px",
        padding: "2px 9px",
        borderRadius: "99px",
        fontWeight: 500,
        textTransform: "capitalize",
        letterSpacing: "0.2px",
    },
    polarityWrap: {
        display: "flex",
        alignItems: "center",
        gap: "4px",
    },
    polarityDot: {
        width: 7,
        height: 7,
        borderRadius: "50%",
        display: "inline-block",
    },
    polarityLabel: {
        fontSize: "11px",
        color: "var(--text-muted)",
        textTransform: "capitalize",
    },
    scoreTag: {
        fontSize: "11px",
        color: "var(--text-muted)",
        background: "var(--bg-input)",
        border: "1px solid var(--border)",
        borderRadius: "99px",
        padding: "1px 7px",
    },
    time: {
        fontSize: "11px",
        color: "var(--text-muted)",
    },
};