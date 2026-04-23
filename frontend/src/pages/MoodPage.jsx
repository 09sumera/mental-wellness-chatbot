import React, { useEffect, useState } from "react";
import MoodTracker from "../components/MoodTracker";
import { moodAPI } from "../services/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function MoodPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = () => {
        moodAPI.getHistory().then(data => {
            setLogs(data.mood_logs || []);
        }).finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const graphData = [...logs].reverse().map(log => ({
        date: new Date(log.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        score: log.score
    }));

    const currentMood = logs.length > 0 ? logs[0] : null;
    const lastMood = logs.length > 1 ? logs[1] : null;

    return (
        <div style={styles.page}>
            <div style={styles.inner}>
                <div>
                    <h1 style={styles.heading}>Mood Tracker 🌿</h1>
                    <p style={styles.subtitle}>Log and review your emotional journey.</p>
                </div>
                
                <MoodTracker onLogged={fetchLogs} />

                {/* Last vs Current Mood */}
                {!loading && logs.length > 0 && (
                    <div style={styles.compareGrid}>
                        <div className="card fade-up" style={styles.compareCard}>
                            <h4 style={styles.compareTitle}>Last Mood</h4>
                            <p style={styles.compareValue}>{lastMood ? `${lastMood.mood} (${lastMood.score})` : "—"}</p>
                        </div>
                        <div className="card fade-up" style={styles.compareCard}>
                            <h4 style={styles.compareTitle}>Current Mood</h4>
                            <p style={styles.compareValue}>{currentMood ? `${currentMood.mood} (${currentMood.score})` : "—"}</p>
                        </div>
                    </div>
                )}

                {/* Graph */}
                {!loading && logs.length > 0 && (
                    <div className="card fade-up" style={styles.graphCard}>
                        <h3 style={styles.sectionTitle}>Mood Trend</h3>
                        <div style={{ height: "300px", width: "100%" }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={graphData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                    <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                                    <YAxis domain={[1, 10]} stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px" }}
                                        itemStyle={{ color: "var(--teal)" }}
                                    />
                                    <Line type="monotone" dataKey="score" stroke="var(--teal)" strokeWidth={3} dot={{ r: 4, fill: "var(--bg-card)", stroke: "var(--teal)" }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* History List */}
                {!loading && logs.length > 0 && (
                    <div className="card fade-up" style={styles.historyCard}>
                        <h3 style={styles.sectionTitle}>Mood History</h3>
                        <div style={styles.historyList}>
                            {logs.map(log => (
                                <div key={log.id} style={styles.historyItem}>
                                    <div>
                                        <div style={styles.historyMood}>{log.mood} <span style={styles.historyScore}>({log.score}/10)</span></div>
                                        {log.note && <div style={styles.historyNote}>{log.note}</div>}
                                    </div>
                                    <div style={styles.historyDate}>
                                        {new Date(log.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    page: { 
        flex: 1, 
        padding: "32px 24px", 
        overflowY: "auto" 
    },
    inner: { 
        maxWidth: "1000px", 
        margin: "0 auto", 
        display: "flex", 
        flexDirection: "column", 
        gap: "28px" 
    },
    heading: { 
        margin: 0, 
        marginBottom: "8px", 
        color: "var(--text-primary)" 
    },
    subtitle: { 
        margin: 0, 
        color: "var(--text-secondary)" 
    },
    compareGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
    compareCard: { padding: "20px", textAlign: "center", borderTopWidth: "3px", borderTopColor: "var(--teal)" },
    compareTitle: { margin: "0 0 8px 0", fontSize: "14px", color: "var(--text-secondary)" },
    compareValue: { margin: 0, fontSize: "24px", fontWeight: "bold", color: "var(--text-primary)", textTransform: "capitalize" },
    
    graphCard: { padding: "24px" },
    sectionTitle: { margin: "0 0 20px 0", fontSize: "18px", color: "var(--text-primary)" },
    
    historyCard: { padding: "24px" },
    historyList: { display: "flex", flexDirection: "column", gap: "12px" },
    historyItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "var(--bg-input)", borderRadius: "var(--radius-md)" },
    historyMood: { fontSize: "16px", fontWeight: "600", color: "var(--text-primary)", textTransform: "capitalize" },
    historyScore: { fontSize: "14px", color: "var(--text-secondary)", fontWeight: "normal" },
    historyNote: { fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" },
    historyDate: { fontSize: "12px", color: "var(--text-muted)", whiteSpace: "nowrap" }
};
