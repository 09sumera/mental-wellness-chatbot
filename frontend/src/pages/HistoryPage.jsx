import React, { useState, useEffect } from "react";
import { chatAPI } from "../services/api";

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await chatAPI.getHistory();

        if (data.history) {
          setHistory(data.history);
        }
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}> 
      <h2>📜 Chat History</h2>

      <div style={{ border: "1px solid #ccc", padding: "15px", borderRadius: "5px" }}>
        {loading ? (
          <p>Loading...</p>
        ) : history.length > 0 ? (
          history.map((msg, index) => (
            <p key={index} style={{ marginBottom: "10px" }}>
              <strong>{msg.role === "user" ? "You" : "Bot"}:</strong> {msg.message}
            </p>
          ))
        ) : (
          <p>No previous chats found.</p>
        )}
      </div>
    </div>
  );
}
