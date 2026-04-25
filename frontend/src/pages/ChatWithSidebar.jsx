import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import { chatAPI } from "../services/api";

export default function ChatWithSidebar() {
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const bottomRef = useRef(null);

  // Load selected conversation history
  useEffect(() => {
    if (chatId) {
      chatAPI.getConversation(chatId)
        .then((data) => {
          if (data.messages) setMessages(data.messages);
        })
        .catch((e) => console.error(e));
    } else {
      setMessages([]);
    }
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: "user", message: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await chatAPI.sendMessage(text, chatId);
      const botMsg = {
        role: "assistant",
        message: res.reply,
        emotion: res.emotion,
        intensity: res.intensity,
        topics: res.topics,
        escalation: res.escalation
      };
      setMessages((prev) => [...prev, botMsg]);

      if (res.chat_id && res.chat_id !== chatId) {
        setChatId(res.chat_id);
      }
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", message: "Error sending message." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Mobile Backdrop */}
      <div
        className={`mobile-backdrop ${isSidebarOpen ? "open" : ""}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar Container */}
      <div className={`sidebar-container ${isSidebarOpen ? "open" : ""}`}>
        <Sidebar onSelectChat={(id) => { setChatId(id); setIsSidebarOpen(false); }} currentChatId={chatId} />
      </div>

      {/* Chat Area */}
      <div className="main-content">
        <div className="glass-panel flex w-full items-center px-4 sm:px-6 md:px-8 sticky top-0 z-10 shrink-0" style={{ height: "60px", borderTop: "none", borderLeft: "none", borderRight: "none", borderRadius: "0", justifyContent: "center" }}>
          <button
            className="mobile-menu-btn"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open sidebar"
            style={{ position: "absolute", left: "16px" }}
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h2 className="chat-header" style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
            <span style={{ fontSize: "18px" }}>📝</span> {chatId ? "Conversation" : "New Chat"}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto w-full flex flex-col py-5 px-0">
          {messages.length === 0 && (
            <div style={styles.empty} className="fade-in delay-200">
              <div style={styles.emptyIcon}>
                <span style={{ fontSize: "56px", filter: "drop-shadow(0 0 10px rgba(242, 201, 126, 0.4))", color: "var(--sand)" }}>✨</span>
              </div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "28px" }}>How can I help you today?</h2>
              <p style={{ marginTop: "8px", color: "var(--text-muted)", fontSize: "14px" }}>Your secure space for reflection and support.</p>
            </div>
          )}
          {messages.map((m, i) => {
            const isUser = m.role === "user";
            const emotion = m.emotion || m.sentiment?.emotion;
            const intensity = m.intensity || m.sentiment?.intensity;
            const topics = m.topics || m.sentiment?.topics;
            const escalation = m.escalation || m.sentiment?.escalation;

            const EMOTION_EMOJI = {
              joy: "😊", sadness: "😢", anxious: "😰", anxiety: "😰", anger: "😠",
              calm: "😌", disgust: "😒", surprise: "😲", neutral: "💬", happy: "🌟", sad: "😔"
            };
            const emoji = emotion ? (EMOTION_EMOJI[emotion.toLowerCase()] || "💬") : "";

            return (
              <div
                key={i}
                style={{
                  ...styles.messageRow,
                  justifyContent: isUser ? "flex-end" : "flex-start",
                  flexDirection: "column",
                  alignItems: isUser ? "flex-end" : "flex-start"
                }}
                className="fade-up"
              >
                {!isUser && emotion && (
                  <div style={styles.reasoningBlock}>
                    <div style={styles.reasoningTitle}>Reasoning</div>
                    <div style={styles.reasoningContent}>
                      <div><strong>Emotion:</strong> {emotion} {intensity ? `(${intensity}/10)` : ""}</div>
                      {topics && topics.length > 0 && <div><strong>Topics:</strong> {Array.isArray(topics) ? topics.join(", ") : topics}</div>}
                      {escalation && <div><strong>Escalation:</strong> <span style={{ textTransform: "capitalize" }}>{escalation}</span></div>}
                    </div>
                  </div>
                )}

                <div className="max-w-full sm:max-w-md md:max-w-xl lg:max-w-2xl px-2 sm:px-0" style={{
                  ...styles.messageInner,
                  ...(isUser ? styles.innerUser : styles.innerBot),
                  margin: !isUser && emotion ? "8px 0 0 0" : "0"
                }}>
                  {!isUser && (
                    <div style={{ ...styles.avatar, background: "var(--teal-glow)", color: "var(--teal)", border: "1px solid var(--border)" }}>
                      <img src="/logo.png" alt="Serenova" style={{ width: "20px", height: "20px", objectFit: "contain" }} />
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div className="text-sm md:text-base lg:text-lg break-words" style={{
                      ...styles.bubble,
                      ...(isUser ? styles.bubbleUser : styles.bubbleBot)
                    }}>
                      {m.message}
                    </div>

                    {!isUser && emotion && (
                      <div style={styles.emotionBadge}>
                        {emoji} <span style={{ textTransform: "capitalize" }}>{emotion}</span> {intensity ? `${intensity}/10` : ""}
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div style={{ ...styles.avatar, background: "rgba(255,255,255,0.1)", color: "var(--text-secondary)" }}>
                      U
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {loading && (
            <div style={{ ...styles.messageRow, justifyContent: "flex-start" }} className="fade-in">
              <div style={{ ...styles.messageInner, ...styles.innerBot }}>
                <div style={{ ...styles.avatar, background: "var(--teal-glow)", color: "var(--teal)", border: "1px solid var(--border)" }}><img src="/logo.png" alt="Serenova" style={{ width: "20px", height: "20px", objectFit: "contain" }} /></div>
                <div style={{ ...styles.bubble, ...styles.bubbleBot, display: "flex", gap: "6px", alignItems: "center" }}>
                  <span style={{ ...styles.dot, animationDelay: "0ms" }} />
                  <span style={{ ...styles.dot, animationDelay: "160ms" }} />
                  <span style={{ ...styles.dot, animationDelay: "320ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} style={{ height: "30px" }} />
        </div>

        <div className="w-full px-4 sm:px-6 md:px-8 shrink-0 flex flex-col items-center py-5" style={{ background: "linear-gradient(180deg, rgba(14,25,29,0) 0%, rgba(10,16,21,0.8) 100%)" }}>
          <div style={styles.inputContainer}>
            <input
              style={styles.inputField}
              placeholder="Send a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button
              style={{ ...styles.sendBtn, opacity: (!input.trim() || loading) ? 0.4 : 1 }}
              onClick={handleSend}
              disabled={loading || !input.trim()}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "rotate(45deg)", marginLeft: "-2px" }}>
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
          <p style={styles.footerText}>Serenova can make mistakes. Please verify important information.</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  empty: {
    margin: "auto",
    color: "var(--text-primary)",
    textAlign: "center",
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  messageRow: {
    display: "flex",
    width: "100%",
    padding: "8px 12px md:padding-8px-20px",
  },
  messageInner: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-end",
  },
  innerUser: {
    flexDirection: "row",
  },
  innerBot: {
    flexDirection: "row",
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    flexShrink: 0,
    boxShadow: "var(--shadow-sm)",
  },
  bubble: {
    fontSize: "15px",
    lineHeight: "1.6",
    whiteSpace: "pre-wrap",
    padding: "16px 20px",
    borderRadius: "20px",
    maxWidth: "100%",
    boxShadow: "var(--shadow-sm)",
  },
  bubbleUser: {
    background: "linear-gradient(135deg, var(--teal), #35b3aa)",
    color: "#0a1015",
    borderBottomRightRadius: "4px",
    fontWeight: 500,
  },
  bubbleBot: {
    background: "var(--bg-input)",
    color: "var(--text-primary)",
    borderBottomLeftRadius: "4px",
    border: "1px solid var(--border)",
    backdropFilter: "blur(10px)",
  },
  inputContainer: {
    width: "100%",
    maxWidth: "800px",
    position: "relative",
    display: "flex",
    alignItems: "center",
    background: "rgba(18, 28, 34, 0.8)",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    borderRadius: "30px",
    marginBottom: "12px",
    padding: "4px",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
  },
  inputField: {
    flex: 1,
    padding: "14px 50px 14px 24px",
    background: "transparent",
    color: "var(--text-primary)",
    fontSize: "15px",
    outline: "none",
    border: "none",
    fontFamily: "var(--font-body)",
  },
  sendBtn: {
    position: "absolute",
    right: "8px",
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, var(--teal), #35b3aa)",
    color: "#0a1015",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    transition: "opacity 0.2s, transform 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(78, 205, 196, 0.3)",
  },
  footerText: {
    fontSize: "12px",
    color: "var(--text-muted)",
    textAlign: "center"
  },
  dot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "var(--text-secondary)",
    display: "inline-block",
    animation: "pulse-ring 1.2s ease-in-out infinite",
  },
  reasoningBlock: {
    background: "rgba(14, 25, 29, 0.4)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "12px 16px",
    marginBottom: "4px",
    marginLeft: "48px", // align with bubble ignoring avatar
    maxWidth: "100%",
    color: "var(--text-primary)",
    fontFamily: "var(--font-body)",
    fontSize: "13px",
    overflowX: "hidden",
  },
  reasoningTitle: {
    fontWeight: "bold",
    marginBottom: "5px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "var(--text-secondary)",
  },
  reasoningContent: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    color: "var(--text-muted)",
  },
  emotionBadge: {
    alignSelf: "flex-start",
    fontSize: "12px",
    background: "rgba(78, 205, 196, 0.1)",
    border: "1px solid rgba(78, 205, 196, 0.2)",
    color: "var(--teal)",
    padding: "4px 10px",
    borderRadius: "20px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "5px",
  }
};