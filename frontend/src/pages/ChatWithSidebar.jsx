import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import { chatAPI } from "../services/api";

export default function ChatWithSidebar() {
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
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
    <div style={styles.container}>
      <Sidebar onSelectChat={(id) => setChatId(id)} currentChatId={chatId} />
      
      <div style={styles.chatArea}>
        <div className="glass-panel" style={styles.header}>
          <h2 style={{ margin: "0", fontSize: "16px", fontWeight: "600", color: "var(--text-primary)" }}>
            {chatId ? "Conversation" : "New Chat"}
          </h2>
        </div>
        
        <div style={styles.feed}>
          {messages.length === 0 && (
            <div style={styles.empty} className="fade-in delay-200">
              <div style={styles.emptyIcon}>✨</div>
              <h2>How can I help you today?</h2>
              <p style={{marginTop: "8px", color: "var(--text-muted)", fontSize: "14px"}}>Your secure space for reflection and support.</p>
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

                <div style={{
                    ...styles.messageInner,
                    ...(isUser ? styles.innerUser : styles.innerBot),
                    margin: !isUser && emotion ? "8px 0 0 0" : "0"
                }}>
                  {!isUser && (
                    <div style={{...styles.avatar, background: "var(--teal-glow)", color: "var(--teal)", border: "1px solid var(--border)"}}>
                      <img src="/logo.png" alt="Serenova" style={{ width: "20px", height: "20px", objectFit: "contain" }} />
                    </div>
                  )}
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{
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
                    <div style={{...styles.avatar, background: "rgba(255,255,255,0.1)", color: "var(--text-secondary)"}}>
                      U
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {loading && (
            <div style={{...styles.messageRow, justifyContent: "flex-start"}} className="fade-in">
              <div style={{...styles.messageInner, ...styles.innerBot}}>
                <div style={{...styles.avatar, background: "var(--teal-glow)", color: "var(--teal)", border: "1px solid var(--border)"}}><img src="/logo.png" alt="Serenova" style={{ width: "20px", height: "20px", objectFit: "contain" }} /></div>
                <div style={{...styles.bubble, ...styles.bubbleBot, display: "flex", gap: "6px", alignItems: "center"}}>
                   <span style={{...styles.dot, animationDelay: "0ms"}} />
                   <span style={{...styles.dot, animationDelay: "160ms"}} />
                   <span style={{...styles.dot, animationDelay: "320ms"}} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} style={{height: "30px"}} />
        </div>

        <div style={styles.inputArea}>
          <div className="glass-panel" style={styles.inputWrapper}>
            <input
              style={styles.input}
              placeholder="Send a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button 
              style={{...styles.sendBtn, opacity: (!input.trim() || loading) ? 0.4 : 1}} 
              onClick={handleSend} 
              disabled={loading || !input.trim()}
            >
              ➤
            </button>
          </div>
          <p style={styles.footerText}>Serenova can make mistakes. Please verify important information.</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    width: "100%",
    background: "transparent",
    color: "var(--text-primary)",
  },
  chatArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    position: "relative",
  },
  header: {
    height: "60px",
    borderLeft: "none",
    borderRight: "none",
    borderTop: "none",
    borderRadius: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "sticky",
    top: 0,
    zIndex: 10,
    backgroundColor: "rgba(14, 25, 29, 0.4)",
  },
  feed: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    padding: "20px 0",
  },
  empty: {
    margin: "auto",
    color: "var(--text-primary)",
    textAlign: "center",
    maxWidth: "400px",
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  messageRow: {
    display: "flex",
    width: "100%",
    padding: "8px 20px",
  },
  messageInner: {
    display: "flex",
    maxWidth: "800px",
    gap: "16px",
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
  inputArea: {
    padding: "20px 40px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: "linear-gradient(180deg, rgba(14,25,29,0) 0%, rgba(10,16,21,0.8) 100%)",
  },
  inputWrapper: {
    width: "100%",
    maxWidth: "800px",
    position: "relative",
    display: "flex",
    alignItems: "center",
    borderRadius: "24px",
    marginBottom: "8px",
    padding: "4px",
  },
  input: {
    flex: 1,
    padding: "16px 48px 16px 20px",
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
    width: "40px",
    height: "40px",
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
    marginLeft: "52px", // align with bubble ignoring avatar
    maxWidth: "80%",
    minWidth: "250px",
    color: "var(--text-primary)",
    fontFamily: "var(--font-body)",
    fontSize: "13px",
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
