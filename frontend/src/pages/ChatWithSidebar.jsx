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
      setMessages((prev) => [
        ...prev,
        { role: "assistant", message: "Error sending message." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full max-w-full overflow-hidden">

      {/* BACKDROP (MOBILE) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:block w-64 h-full flex-shrink-0">
        <Sidebar
          onSelectChat={(id) => setChatId(id)}
          currentChatId={chatId}
        />
      </div>

      {/* MOBILE SIDEBAR */}
      <div
        className={`fixed top-0 left-0 h-full w-64 z-50 md:hidden transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <Sidebar
          onSelectChat={(id) => {
            setChatId(id);
            setIsSidebarOpen(false);
          }}
          currentChatId={chatId}
        />
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col w-full min-w-0">

        {/* HEADER */}
        <div className="flex items-center h-[56px] px-4 border-b border-[var(--border)] bg-[rgba(14,25,29,0.6)] backdrop-blur-md">

          <button
            className="md:hidden"
            onClick={() => setIsSidebarOpen(true)}
            style={{
              fontSize: "20px",
              marginRight: "12px",
              background: "transparent",
              border: "none",
              color: "var(--text-primary)",
              cursor: "pointer"
            }}
          >
            ☰
          </button>

          <h2
            style={{
              fontSize: "16px",
              fontWeight: "600",
              color: "var(--text-primary)"
            }}
          >
            Serenova
          </h2>

        </div>

        {/* CHAT CONTENT */}
        <div className="flex-1 overflow-y-auto w-full flex flex-col">

          {messages.length === 0 && (
            <div
              className="flex flex-col items-center justify-center h-full text-center"
              style={{ color: "var(--text-primary)" }}
            >
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>✨</div>
              <h2>How can I help you today?</h2>
              <p style={{ color: "var(--text-muted)", marginTop: "8px" }}>
                Your secure space for reflection and support.
              </p>
            </div>
          )}

          <div ref={bottomRef} style={{ height: "30px" }} />
        </div>

        {/* INPUT + FOOTER */}
        <div className="w-full px-4 sm:px-6 md:px-8 shrink-0 flex flex-col items-center py-5">

          <div className="glass-panel w-full sm:max-w-md md:max-w-2xl lg:max-w-3xl">
            <div style={styles.inputWrapper}>
              <input
                style={styles.input}
                placeholder="Send a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button
                style={{
                  ...styles.sendBtn,
                  opacity: (!input.trim() || loading) ? 0.4 : 1
                }}
                onClick={handleSend}
                disabled={loading || !input.trim()}
              >
                ➤
              </button>
            </div>
          </div>

          {/* ✅ FOOTER BACK */}
          <p
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              textAlign: "center",
              marginTop: "8px",
              opacity: 0.7
            }}
          >
            Serenova can make mistakes. Please verify important information.
          </p>

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
  inputWrapper: {
    width: "100%",
    // maxWidth handled via responsive classes
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
