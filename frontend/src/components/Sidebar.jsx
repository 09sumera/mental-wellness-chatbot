import React, { useState, useEffect, useRef } from "react";
import { chatAPI, authAPI } from "../services/api";
import { Link } from "react-router-dom";

export default function Sidebar({ onSelectChat, currentChatId }) {
  const [conversations, setConversations] = useState([]);
  const [renamingId, setRenamingId] = useState(null);
  const [renameText, setRenameText] = useState("");
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    fetchConversations();
    fetchProfile();
  }, [currentChatId]);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpenId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchConversations() {
    try {
      const data = await chatAPI.getConversations();
      if (data.conversations) {
        setConversations(data.conversations);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  }

  const fetchProfile = async () => {
    try {
      const data = await authAPI.getProfile();
      if (data.user) setUserProfile(data.user);
    } catch (err) {
      console.error("Failed to load profile:", err);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    setMenuOpenId(null);
    if (!window.confirm("Delete this chat?")) return;
    try {
      await chatAPI.deleteConversation(id);
      if (currentChatId === id) {
        onSelectChat(null);
      } else {
        fetchConversations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startRename = (e, id, currentTitle) => {
    e.stopPropagation();
    setMenuOpenId(null);
    setRenamingId(id);
    setRenameText(currentTitle);
  };

  const saveRename = async (e, id) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!renameText.trim()) {
      setRenamingId(null);
      return;
    }
    try {
      await chatAPI.renameConversation(id, renameText.trim());
      setRenamingId(null);
      fetchConversations();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleMenu = (e, id) => {
    e.stopPropagation();
    setMenuOpenId(menuOpenId === id ? null : id);
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to clear ALL chat data? This cannot be undone.")) return;
    try {
      await chatAPI.clearHistory();
      onSelectChat(null);
      fetchConversations();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="glass-panel h-full w-64 flex-shrink-0 border-r border-white/10" style={styles.sidebar}>

      <div style={{ marginBottom: "16px", padding: "0 8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src="/logo.png" alt="Serenova" style={{ height: "36px" }} />
          <div>
            <div style={{ fontSize: "20px", fontWeight: "600" }}>Serenova</div>
            <div style={{ fontSize: "12px", opacity: 0.7 }}>
              Where your mind finds peace.
            </div>
          </div>
        </div>
      </div>

      <div style={styles.navLinks}>
        <Link to="/dashboard" style={styles.navLink} className="sidebar-item">
          <span>📊</span> Dashboard
        </Link>
        <Link to="/resources" style={styles.navLink} className="sidebar-item">
          <span>📚</span> Resources
        </Link>
      </div>

      <button
        className="btn btn-ghost"
        style={styles.newBtn}
        onClick={() => onSelectChat(null)}
      >
        <span style={{ fontSize: "16px" }}>+</span> New Chat
      </button>

      <div style={styles.list}>
        <div style={styles.searchWrapper}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
            className="sidebar-search"
          />
          {searchQuery && (
            <button style={styles.clearSearch} onClick={() => setSearchQuery("")}>
              ✕
            </button>
          )}
        </div>
        <div style={styles.sectionLabel}>Recent</div>
        {filteredConversations.map((conv) => {
          const isRenaming = renamingId === conv.chat_id;
          const isActive = currentChatId === conv.chat_id;
          const hasMenuOpen = menuOpenId === conv.chat_id;
          const displayTitle = conv.title.length > 22 ? conv.title.substring(0, 22) + "..." : conv.title;

          return (
            <div
              key={conv.chat_id}
              onClick={() => { if (!isRenaming) onSelectChat(conv.chat_id); }}
              style={{
                ...styles.item,
                background: isActive ? "var(--teal-glow)" : "transparent",
                borderColor: isActive ? "var(--border)" : "transparent"
              }}
              className="sidebar-item"
            >
              {isRenaming ? (
                <div style={styles.renameContainer}>
                  <input
                    autoFocus
                    value={renameText}
                    onChange={(e) => setRenameText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveRename(e, conv.chat_id);
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    onBlur={(e) => saveRename(e, conv.chat_id)}
                    className="input"
                    style={styles.renameInput}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              ) : (
                <div style={styles.itemContent}>
                  <div style={styles.chatIconTitleBlock}>
                    <span style={{ ...styles.chatIcon, color: isActive ? "var(--teal)" : "var(--text-muted)" }}>💬</span>
                    <span title={conv.title} style={{ ...styles.chatTitle, color: isActive ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: isActive ? "500" : "400" }}>{displayTitle}</span>
                  </div>

                  <div style={styles.actionArea}>
                    <button style={styles.dotsBtn} onClick={(e) => toggleMenu(e, conv.chat_id)} className="hover-target">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                    </button>
                    {hasMenuOpen && (
                      <div className="glass-panel" style={styles.dropdown} ref={menuRef}>
                        <button style={styles.dropdownBtn} onClick={(e) => startRename(e, conv.chat_id, conv.title)}>
                          <span style={{ marginRight: "8px" }}>✎</span> Rename
                        </button>
                        <button style={{ ...styles.dropdownBtn, color: "var(--rose)" }} onClick={(e) => handleDelete(e, conv.chat_id)}>
                          <span style={{ marginRight: "8px" }}>🗑️</span> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {conversations.length === 0 && (
          <p style={styles.empty}>No previous chats.</p>
        )}
        {conversations.length > 0 && filteredConversations.length === 0 && (
          <p style={styles.empty}>No results found.</p>
        )}
      </div>

      <div style={styles.footer}>
        {userProfile && (
          <div style={styles.userCard}>
            <div style={styles.userAvatar}>
              {(userProfile.name || userProfile.username || "U")[0].toUpperCase()}
            </div>
            <div style={styles.userInfo}>
              <div style={styles.userName}>{userProfile.name || "User"}</div>
              <div style={styles.userEmail}>{userProfile.username}</div>
            </div>
          </div>
        )}
        <div style={{ padding: "0", display: "flex", flexDirection: "column", gap: "8px" }}>
          <button
            style={styles.logoutBtn}
            className="sidebar-item"
            onClick={() => { localStorage.removeItem("token"); window.location.reload(); }}
          >
            <span style={{ marginRight: "8px" }}>🚪</span> Log out
          </button>
        </div>
      </div>

      <style>{`
        .sidebar-item:hover {
          background: rgba(255, 255, 255, 0.05) !important;
        }
        .hover-target:hover {
            color: var(--teal) !important;
        }
        .sidebar-search:focus {
            outline: none;
        }
        .sidebar-search::placeholder {
            color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}

const styles = {
  sidebar: {
    // Width handled via Tailwind classes for responsiveness
    background: "rgba(10, 16, 21, 0.4)",
    display: "flex",
    flexDirection: "column",
    padding: "20px 16px",
    overflowY: "auto",
    borderTop: "none",
    borderBottom: "none",
    borderLeft: "none",
    borderRadius: 0,
    boxShadow: "none",
    borderRight: "1px solid var(--border)"
  },
  brandBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "16px",
    padding: "0 8px",
  },
  navLinks: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    marginBottom: "12px",
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 12px",
    borderRadius: "var(--radius-sm)",
    color: "var(--text-secondary)",
    textDecoration: "none",
    fontSize: "14px",
    transition: "background 0.2s",
  },
  searchWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "8px 12px",
    marginBottom: "12px",
  },
  searchIcon: {
    fontSize: "13px",
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    color: "var(--text-primary)",
    fontSize: "13px",
    fontFamily: "var(--font-body)",
  },
  clearSearch: {
    background: "none",
    border: "none",
    color: "var(--text-muted)",
    cursor: "pointer",
    fontSize: "11px",
    padding: "0",
    flexShrink: 0,
  },
  newBtn: {
    width: "100%",
    justifyContent: "flex-start",
    marginBottom: "20px",
    padding: "12px 16px",
    borderRadius: "var(--radius-md)",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    flex: 1,
  },
  sectionLabel: {
    fontSize: "11px",
    textTransform: "uppercase",
    color: "var(--text-muted)",
    letterSpacing: "0.5px",
    fontWeight: "bold",
    padding: "0 8px",
    marginBottom: "8px",
  },
  item: {
    padding: "10px 12px",
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    fontSize: "14px",
    position: "relative",
    border: "1px solid transparent",
    transition: "all 0.2s"
  },
  empty: {
    color: "var(--text-muted)",
    fontSize: "13px",
    textAlign: "center",
    marginTop: "20px",
  },
  itemContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%"
  },
  chatIconTitleBlock: {
    display: "flex", alignItems: "center", flex: 1, overflow: "hidden"
  },
  chatIcon: {
    marginRight: "10px", fontSize: "14px"
  },
  chatTitle: {
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
  },
  actionArea: {
    position: "relative"
  },
  dotsBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "var(--text-muted)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "color 0.2s",
  },
  dropdown: {
    position: "absolute",
    right: "0",
    top: "100%",
    padding: "6px 0",
    zIndex: 100,
    width: "130px",
  },
  dropdownBtn: {
    width: "100%",
    background: "none",
    border: "none",
    padding: "10px 16px",
    textAlign: "left",
    color: "var(--text-primary)",
    cursor: "pointer",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    transition: "background 0.2s",
  },
  renameContainer: {
    display: "flex",
    width: "100%"
  },
  renameInput: {
    padding: "6px 10px",
    fontSize: "13px",
    height: "32px",
  },
  footer: {
    marginTop: "auto",
    paddingTop: "12px",
    borderTop: "1px solid var(--border)",
  },
  logoutBtn: {
    width: "100%",
    padding: "10px 12px",
    background: "transparent",
    color: "var(--text-secondary)",
    border: "1px solid transparent",
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    transition: "background 0.2s"
  },
  userCard: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 12px",
    marginBottom: "8px",
    background: "rgba(78, 205, 196, 0.06)",
    border: "1px solid rgba(78, 205, 196, 0.15)",
    borderRadius: "var(--radius-sm)",
  },
  userAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, var(--teal), #35b3aa)",
    color: "#0a1015",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: "700",
    flexShrink: 0,
  },
  userInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    overflow: "hidden",
  },
  userName: {
    fontSize: "13px",
    fontWeight: "600",
    color: "var(--text-primary)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  userEmail: {
    fontSize: "11px",
    color: "var(--text-muted)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
};