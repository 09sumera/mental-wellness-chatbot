import { useState, useEffect, useRef } from "react";
import { chatAPI } from "../services/api";

const EMOTION_EMOJI = {
    joy: "😊", sadness: "😢", anxiety: "😰", anger: "😠",
    calm: "😌", disgust: "😒", surprise: "😲", neutral: "💬",
};

function Message({ msg }) {
    const isUser = msg.role === "user";
    return (
        <div style={{ ...styles.msgRow, justifyContent: isUser ? "flex-end" : "flex-start" }}>
            {!isUser && <div style={styles.avatar}><img src="/logo.png" alt="Serenova" style={{ width: "18px", height: "18px", objectFit: "contain" }} /></div>}
            <div style={{ maxWidth: "68%" }}>
                <div style={{ ...styles.bubble, ...(isUser ? styles.bubbleUser : styles.bubbleBot) }}>
                    {msg.message}
                </div>
                <div style={{ ...styles.meta, textAlign: isUser ? "right" : "left" }}>
                    {msg.emotion && (
                        <span style={styles.emotionTag}>
                            {EMOTION_EMOJI[msg.emotion] || "💬"} {msg.emotion}
                        </span>
                    )}
                    {msg.crisis_alert && (
                        <span style={styles.crisisTag}>⚠️ Crisis alert</span>
                    )}
                    <span style={styles.time}>
                        {new Date(msg.created_at || Date.now()).toLocaleTimeString([], {
                            hour: "2-digit", minute: "2-digit",
                        })}
                    </span>
                </div>
            </div>
            {isUser && <div style={styles.avatarUser}>You</div>}
        </div>
    );
}

function TypingIndicator() {
    return (
        <div style={{ ...styles.msgRow, justifyContent: "flex-start" }}>
            <div style={styles.avatar}><img src="/logo.png" alt="Serenova" style={{ width: "18px", height: "18px", objectFit: "contain" }} /></div>
            <div style={styles.typing}>
                <span style={{ ...styles.dot, animationDelay: "0ms" }} />
                <span style={{ ...styles.dot, animationDelay: "160ms" }} />
                <span style={{ ...styles.dot, animationDelay: "320ms" }} />
            </div>
        </div>
    );
}

export default function ChatWindow() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const bottomRef = useRef(null);

    // Load history
    useEffect(() => {
        chatAPI.getHistory()
            .then((d) => setMessages(d.history || []))
            .catch(() => { });
    }, []);

    // Scroll to bottom on new message
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const handleSend = async () => {
        const text = input.trim();
        if (!text || loading) return;

        const userMsg = {
            role: "user", message: text,
            created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);
        setError("");

        try {
            const res = await chatAPI.sendMessage(text);
            const botMsg = {
                role: "assistant",
                message: res.reply,
                emotion: res.emotion,
                crisis_alert: res.crisis_alert,
                created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, botMsg]);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleKey = (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h2 style={styles.title}>How are you feeling?</h2>
                    <p style={styles.subtitle}>I'm here to listen, anytime.</p>
                </div>
                <button
                    style={styles.clearBtn}
                    onClick={() => { chatAPI.clearHistory(); setMessages([]); }}
                >
                    Clear chat
                </button>
            </div>

            {/* Messages */}
            <div style={styles.feed}>
                {messages.length === 0 && (
                    <div style={styles.empty}>
                        <div style={styles.emptyIcon}><img src="/logo.png" alt="Serenova" style={{ height: "40px" }} /></div>
                        <p>Start the conversation — share whatever is on your mind.</p>
                    </div>
                )}
                {messages.map((m, i) => <Message key={i} msg={m} />)}
                {loading && <TypingIndicator />}
                <div ref={bottomRef} />
            </div>

            {/* Error */}
            {error && <div style={styles.errorBar}>⚠️ {error}</div>}

            {/* Input */}
            <div style={styles.inputRow}>
                <textarea
                    style={styles.textarea}
                    placeholder="Type how you're feeling…"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    rows={1}
                />
                <button
                    style={{ ...styles.sendBtn, opacity: input.trim() ? 1 : 0.45 }}
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                >
                    ➤
                </button>
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: "flex", flexDirection: "column",
        height: "100%", background: "var(--bg-card)",
        borderRadius: "var(--radius-lg)", overflow: "hidden",
        border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)",
    },
    header: {
        padding: "20px 24px",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "var(--bg-2)",
    },
    title: { fontFamily: "var(--font-display)", fontSize: "20px", color: "var(--text-primary)" },
    subtitle: { fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" },
    clearBtn: {
        fontSize: "12px", background: "transparent", border: "none",
        color: "var(--text-muted)", cursor: "pointer", padding: "4px 8px",
    },
    feed: {
        flex: 1, overflowY: "auto", padding: "20px 24px",
        display: "flex", flexDirection: "column", gap: "16px",
    },
    empty: {
        margin: "auto", textAlign: "center",
        color: "var(--text-muted)", fontSize: "14px",
    },
    emptyIcon: { fontSize: "40px", marginBottom: "12px" },
    msgRow: { display: "flex", alignItems: "flex-end", gap: "10px" },
    avatar: {
        width: 32, height: 32, borderRadius: "50%",
        background: "var(--teal-glow)", border: "1px solid var(--teal-dim)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "16px", flexShrink: 0,
    },
    avatarUser: {
        fontSize: "11px", color: "var(--text-muted)",
        flexShrink: 0, paddingBottom: "4px",
    },
    bubble: {
        padding: "12px 16px", borderRadius: "var(--radius-md)",
        fontSize: "14px", lineHeight: 1.6, whiteSpace: "pre-wrap",
    },
    bubbleUser: {
        background: "var(--teal-dim)", color: "#fff",
        borderBottomRightRadius: "4px",
    },
    bubbleBot: {
        background: "var(--bg-input)", color: "var(--text-primary)",
        border: "1px solid var(--border)", borderBottomLeftRadius: "4px",
    },
    meta: {
        marginTop: "4px", display: "flex", gap: "8px",
        alignItems: "center", flexWrap: "wrap",
    },
    emotionTag: {
        fontSize: "11px", background: "var(--teal-glow)",
        color: "var(--teal)", padding: "2px 8px", borderRadius: "99px",
        border: "1px solid rgba(78,205,196,0.2)", textTransform: "capitalize",
    },
    crisisTag: {
        fontSize: "11px", background: "rgba(242,139,130,0.1)",
        color: "var(--rose)", padding: "2px 8px", borderRadius: "99px",
    },
    time: { fontSize: "11px", color: "var(--text-muted)" },
    typing: {
        display: "flex", gap: "5px", alignItems: "center",
        background: "var(--bg-input)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)", padding: "12px 16px",
    },
    dot: {
        width: 6, height: 6, borderRadius: "50%",
        background: "var(--teal-dim)", display: "inline-block",
        animation: "pulse-ring 1.2s ease-in-out infinite",
    },
    errorBar: {
        padding: "10px 24px", background: "rgba(242,139,130,0.12)",
        borderTop: "1px solid rgba(242,139,130,0.2)",
        color: "var(--rose)", fontSize: "13px",
    },
    inputRow: {
        display: "flex", gap: "10px", padding: "16px 20px",
        borderTop: "1px solid var(--border)", background: "var(--bg-2)",
        alignItems: "flex-end",
    },
    textarea: {
        flex: 1, background: "var(--bg-input)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)", color: "var(--text-primary)",
        fontFamily: "var(--font-body)", fontSize: "14px",
        padding: "10px 14px", outline: "none", resize: "none",
        transition: "border-color var(--transition)",
        lineHeight: 1.5, maxHeight: "120px", overflowY: "auto",
    },
    sendBtn: {
        width: 42, height: 42, borderRadius: "var(--radius-md)",
        background: "var(--teal)", border: "none", color: "var(--bg)",
        fontSize: "16px", cursor: "pointer", flexShrink: 0,
        transition: "all var(--transition)",
    },
};