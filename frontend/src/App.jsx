import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ChatWithSidebar from "./pages/ChatWithSidebar";
import DashboardPage from "./pages/Dashboard";
import ResourcesPage from "./pages/Resources";
import MoodPage from "./pages/MoodPage";
import Navbar from "./components/Navbar";
import { authAPI } from "./services/api";
import "./styles/main.css";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [authMode, setAuthMode] = useState("login"); // "login" or "signup"

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [signupStep, setSignupStep] = useState(1);
  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const requestOtp = async () => {
    setAuthError("");
    if (!email) return setAuthError("Email is required.");
    setIsLoading(true);
    try {
      await authAPI.requestOtp({ username: email });
      setSignupStep(2);
    } catch (err) {
      setAuthError(err.message || "Server error.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async () => {
    setAuthError("");
    if (!email || !password || !name || !otp) return setAuthError("All fields are required.");
    setIsLoading(true);
    try {
      const data = await authAPI.register({ username: email, name, password, otp });
      if (data.token) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
      }
    } catch (err) {
      setAuthError(err.message || "Server error.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async () => {
    setAuthError("");
    if (!email || !password) return setAuthError("Email and password required.");
    setIsLoading(true);
    try {
      const data = await authAPI.login({ username: email, password });
      if (data.token) {
        setToken(data.token);
      }
    } catch (err) {
      setAuthError(err.message || "Server error.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = (mode) => {
    setAuthMode(mode);
    setAuthError("");
    setSignupStep(1);
    setEmail("");
    setPassword("");
    setName("");
    setOtp("");
  };

  if (!token) {
    return (
      <div style={styles.container}>
        <div className="glass-panel fade-up" style={styles.authCard}>

          <div style={{ marginBottom: "16px", padding: "0 8px", display: "flex", justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <img src="/logo.png" alt="Serenova" style={{ height: "36px" }} />
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: "20px", fontWeight: "600" }}>Serenova</div>
                <div style={{ fontSize: "12px", opacity: 0.7 }}>
                  Where your mind finds peace.
                </div>
              </div>
            </div>
          </div>

          <div style={styles.tabsMenu}>
            <button
              onClick={() => toggleAuthMode("login")}
              style={{
                ...styles.tabBtn,
                borderBottomColor: authMode === "login" ? "var(--teal)" : "transparent",
                color: authMode === "login" ? "var(--teal)" : "var(--text-muted)",
              }}>
              Log in
            </button>
            <button
              onClick={() => toggleAuthMode("signup")}
              style={{
                ...styles.tabBtn,
                borderBottomColor: authMode === "signup" ? "var(--teal)" : "transparent",
                color: authMode === "signup" ? "var(--teal)" : "var(--text-muted)",
              }}>
              Sign up
            </button>
          </div>

          {authError && <p style={styles.errorMsg} className="fade-in">{authError}</p>}

          {authMode === "login" && (
            <form onSubmit={(e) => { e.preventDefault(); handleLoginSubmit(); }} style={styles.form} className="fade-in">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" required className="input" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className="input" />
              <button type="submit" className="btn btn-primary" style={{ marginTop: "10px" }} disabled={isLoading}>
                {isLoading ? "Proceeding..." : "Continue"}
              </button>
            </form>
          )}

          {authMode === "signup" && signupStep === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); requestOtp(); }} style={styles.form} className="fade-in">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" required className="input" />
              <button type="submit" className="btn btn-primary" style={{ marginTop: "10px" }} disabled={isLoading}>
                {isLoading ? "Sending OTP..." : "Continue"}
              </button>
            </form>
          )}

          {authMode === "signup" && signupStep === 2 && (
            <form onSubmit={(e) => { e.preventDefault(); handleSignupSubmit(); }} style={styles.form} className="fade-in">
              <p style={styles.otpHelper}>Enter the OTP sent to <strong style={{ color: "var(--teal)" }}>{email}</strong></p>
              <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit OTP" required className="input" />
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" required className="input" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create Password" required className="input" />
              <button type="submit" className="btn btn-primary" style={{ marginTop: "10px" }} disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Account"}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Wraps views other than ChatWithSidebar in the app layout frame.
  const Layout = ({ children }) => (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100%" }}>
      <Navbar />
      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
        {children}
      </div>
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={<ChatWithSidebar />} />
      <Route path="/dashboard" element={<Layout><DashboardPage user={{}} /></Layout>} />
      <Route path="/resources" element={<Layout><ResourcesPage /></Layout>} />
      <Route path="/mood" element={<Layout><MoodPage /></Layout>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  authCard: {
    width: "100%",
    maxWidth: "400px",
    padding: "40px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  headerArea: {
    textAlign: "center",
    marginBottom: "10px",
  },
  brandIcon: {
    width: "80px",
    height: "80px",
    objectFit: "contain",
    display: "block",
    margin: "0 auto 10px auto",
  },
  title: {
    margin: "0 0 8px 0",
    color: "var(--text-primary)",
    fontSize: "32px",
  },
  subtitle: {
    margin: 0,
    color: "var(--text-secondary)",
    fontSize: "15px",
  },
  tabsMenu: {
    display: "flex",
    justifyContent: "center",
    borderBottom: "1px solid var(--border)",
    marginBottom: "10px",
  },
  tabBtn: {
    flex: 1,
    padding: "12px",
    background: "transparent",
    border: "none",
    borderBottom: "2px solid transparent",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "600",
    transition: "color var(--transition), border-color var(--transition)",
    fontFamily: "var(--font-body)",
  },
  errorMsg: {
    color: "var(--rose)",
    fontSize: "14px",
    background: "rgba(255, 126, 103, 0.1)",
    padding: "12px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid rgba(255, 126, 103, 0.2)",
    textAlign: "center",
    fontWeight: "500",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  otpHelper: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    margin: "0 0 4px 0",
    textAlign: "center",
  }
};