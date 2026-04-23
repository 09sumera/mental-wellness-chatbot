const BASE_URL =
    (import.meta.env.VITE_API_URL || "https://mental-wellness-chatbot-zsdy.onrender.com") + "/api";

console.log("BASE URL:", BASE_URL);
// ── Token helpers ─────────────────────────────────────────────────────────────
export const getToken = () => localStorage.getItem("token");
export const setToken = (t) => localStorage.setItem("token", t);
export const clearToken = () => localStorage.removeItem("token");

// ── Sleep helper ──────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Base fetch wrapper with retry ─────────────────────────────────────────────
async function request(endpoint, options = {}, retries = 2) {
    const token = localStorage.getItem("token");
    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const res = await fetch(`${BASE_URL}${endpoint}`, {
                ...options,
                headers,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
            return data;
        } catch (err) {
            const isNetworkError = err instanceof TypeError && err.message === "Failed to fetch";
            if (isNetworkError && attempt < retries) {
                console.warn(`[api] Network error on ${endpoint}, retrying (${attempt + 1}/${retries})...`);
                await sleep(800);
                continue;
            }
            if (isNetworkError) {
                throw new Error("Cannot reach backend.");
            }
            throw err;
        }
    }
}

// ── Health check ──────────────────────────────────────────────────────────────
export const healthCheck = () => request("/health");

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
    register: (payload) =>
        request("/user/register", { method: "POST", body: JSON.stringify(payload) }),

    login: async (payload) => {
        const data = await request("/user/login", {
            method: "POST",
            body: JSON.stringify(payload),
        });
        if (data.token) setToken(data.token);
        return data;
    },

    logout: () => clearToken(),

    getProfile: () => request("/user/profile"),

    updateProfile: (payload) =>
        request("/user/profile", { method: "PUT", body: JSON.stringify(payload) }),
};

// ── Chat ──────────────────────────────────────────────────────────────────────
export const chatAPI = {
    sendMessage: (message, chat_id = null) =>
        request("/chat/message", { method: "POST", body: JSON.stringify({ message, chat_id }) }),

    getHistory: () => request("/chat/history"),

    clearHistory: () => request("/chat/history", { method: "DELETE" }),

    getConversations: () => request("/chat/conversations"),

    getConversation: (chat_id) => request(`/chat/conversation/${chat_id}`),

    renameConversation: (chat_id, title) =>
        request(`/chat/conversation/${chat_id}`, { method: "PUT", body: JSON.stringify({ title }) }),

    deleteConversation: (chat_id) =>
        request(`/chat/conversation/${chat_id}`, { method: "DELETE" }),
};

// ── Mood ──────────────────────────────────────────────────────────────────────
export const moodAPI = {
    logMood: (payload) =>
        request("/mood/log", { method: "POST", body: JSON.stringify(payload) }),

    getHistory: () => request("/mood/history"),

    getSummary: () => request("/mood/summary"),
};