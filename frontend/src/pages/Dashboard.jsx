import { useEffect, useState } from "react";
import { moodAPI, chatAPI } from "../services/api";
import { Link } from "react-router-dom";

const TIPS = [
    "Consistency matters — even logging one mood a day builds powerful self-awareness.",
    "Try a 5-minute breathing exercise before bed tonight.",
    "Reaching out — even in small ways — is an act of courage.",
    "Your feelings are valid. All of them.",
    "Small moments of joy add up. Notice them today.",
];

function StatCard({ icon, label, value, color, to }) {
    const content = (
        <div style={{ ...styles.statCard, borderColor: color + "40", borderTopColor: color, cursor: to ? "pointer" : "default" }} className="card fade-up">
            <span style={styles.statIcon}>{icon}</span>
            <span style={{ ...styles.statValue, color }}>{value}</span>
            <span style={styles.statLabel}>{label}</span>
        </div>
    );
    return to ? <Link to={to} style={{ textDecoration: "none", display: "block" }}>{content}</Link> : content;
}

export default function DashboardPage({ user }) {
    const [summary, setSummary] = useState(null);
    const [chatCount, setChatCount] = useState(0);
    const [tip, setTip] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTip(TIPS[Math.floor(Math.random() * TIPS.length)]);
        Promise.all([moodAPI.getSummary(), chatAPI.getHistory()])
            .then(([s, c]) => {
                setSummary(s.summary);
                setChatCount((c.history || []).filter((m) => m.role === "user").length);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div style={styles.page}>
            <div style={styles.inner}>
                {/* Welcome */}
                <div style={styles.welcome} className="fade-up">
                    <div>
                        <h1 style={styles.welcomeTitle}>
                            Good {getTimeOfDay()}, {user?.name || user?.username || "there"} ✨
                        </h1>
                        <p style={styles.welcomeSub}>Here's an overview of your wellness journey.</p>
                    </div>
                </div>

                {/* Tip of the day */}
                <div style={styles.tipCard} className="glass-panel fade-up delay-100">
                    <span style={styles.tipBadge}>💡 Wellness tip</span>
                    <p style={styles.tipText}>{tip}</p>
                </div>

                {/* Stats */}
                {!loading && (
                    <div style={styles.statsGrid}>
                        <div style={{animationDelay: "150ms"}}><StatCard icon="📊" label="Avg Mood Score" value={summary?.average_score ?? "—"} color="var(--teal)" /></div>
                        <div style={{animationDelay: "200ms"}}><StatCard icon="🎭" label="Top Mood" value={summary?.top_mood ?? "—"} color="var(--sand)" /></div>
                        <div style={{animationDelay: "250ms"}}><StatCard icon="📈" label="Mood Trend" value={summary?.trend ?? "—"} color={summary?.trend === "improving" ? "var(--teal)" : summary?.trend === "declining" ? "var(--rose)" : "var(--sand)"} /></div>
                        <div style={{animationDelay: "300ms"}}><StatCard icon="💬" label="Messages Sent" value={chatCount} color="#d4a8f2" /></div>
                        <div style={{animationDelay: "350ms"}}><StatCard icon="📝" label="Mood Entries" value={summary?.total_entries ?? 0} color="var(--sand)" /></div>
                    </div>
                )}

                {/* Quick actions */}
                <div style={styles.actions} className="fade-up delay-300">
                    <h3 style={styles.sectionTitle}>Quick Actions</h3>
                    <div style={styles.actionGrid}>
                        {[
                            { to: "/", icon: "💬", label: "Open Chat", desc: "Talk to your wellness companion" },
                            { to: "/mood", icon: "🌿", label: "Log Mood", desc: "Record how you're feeling now" },
                            { to: "/mood", icon: "📊", label: "View Trends", desc: "See your mood over time" },
                        ].map(({ to, icon, label, desc }, idx) => (
                            <Link key={label} to={to} style={{ textDecoration: "none" }} className={`fade-up delay-${(idx+4)*100}`}>
                                <div style={styles.actionCard} className="card">
                                    <span style={styles.actionIcon}>{icon}</span>
                                    <div>
                                        <p style={styles.actionLabel}>{label}</p>
                                        <p style={styles.actionDesc}>{desc}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function getTimeOfDay() {
    const h = new Date().getHours();
    if (h < 12) return "morning";
    if (h < 17) return "afternoon";
    return "evening";
}

const styles = {
    page: { flex: 1, padding: "32px 24px", overflowY: "auto" },
    inner: { maxWidth: "1000px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "28px" },
    welcome: {},
    welcomeTitle: { marginBottom: "8px", color: "var(--text-primary)" },
    welcomeSub: { fontSize: "15px", color: "var(--text-secondary)" },
    
    tipCard: { 
        padding: "24px", 
        borderLeft: "4px solid var(--teal)",
        borderTop: "1px solid var(--border)",
        borderRight: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
    },
    tipBadge: { fontSize: "12px", color: "var(--teal)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700, display: "block", marginBottom: "8px" },
    tipText: { fontSize: "16px", color: "var(--text-primary)", fontStyle: "italic", lineHeight: 1.5 },
    
    statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" },
    statCard: { 
        padding: "24px 20px", 
        textAlign: "center", 
        display: "flex", 
        flexDirection: "column", 
        gap: "10px", 
        cursor: "pointer", 
        height: "100%",
        borderTopWidth: "3px",
    },
    statIcon: { fontSize: "28px", display: "inline-block", background: "rgba(255,255,255,0.05)", width: "56px", height: "56px", lineHeight: "56px", borderRadius: "50%", margin: "0 auto" },
    statValue: { fontSize: "28px", fontWeight: 700, textTransform: "capitalize", fontFamily: "var(--font-display)" },
    statLabel: { fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 },
    
    sectionTitle: { fontSize: "22px", color: "var(--text-primary)", marginBottom: "16px" },
    actions: { marginTop: "10px" },
    actionGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" },
    actionCard: { padding: "24px", display: "flex", alignItems: "center", gap: "20px", cursor: "pointer" },
    actionIcon: { fontSize: "32px", display: "flex", alignItems: "center", justifyContent: "center", width: "60px", height: "60px", borderRadius: "16px", background: "var(--teal-glow)", color: "var(--teal)", flexShrink: 0 },
    actionLabel: { fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" },
    actionDesc: { fontSize: "14px", color: "var(--text-secondary)" },
};