import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { ArrowLeft, Info, Loader2 } from "lucide-react";
import { Beacon } from "../components/Shared";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function CitizenAuth() {
  const location = useLocation();
  const [mode, setMode] = useState(location.pathname === "/login" ? "login" : "signup");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { token, user } =
        mode === "signup"
          ? await api.signup({ name, username, phone, password })
          : await api.login({ username, password });
      login(token, user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link className="back-link" to="/"><ArrowLeft size={14} /> Back home</Link>
        <Beacon size={26} />
        <h1>{mode === "signup" ? "Create your account" : "Welcome back"}</h1>
        <p className="auth-sub">{mode === "signup" ? "Sign up to report incidents and follow their progress." : "Log in to see your reports and messages."}</p>
        <div className="auth-tabs">
          <button className={mode === "signup" ? "auth-tab active" : "auth-tab"} onClick={() => setMode("signup")}>Sign up</button>
          <button className={mode === "login" ? "auth-tab active" : "auth-tab"} onClick={() => setMode("login")}>Log in</button>
        </div>
        <form onSubmit={submit} className="form">
          {mode === "signup" && (
            <label className="field">
              <span>Full name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
            </label>
          )}
          <label className="field">
            <span>Username</span>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="janedoe" autoCapitalize="none" />
          </label>
          {mode === "signup" && (
            <label className="field">
              <span>Phone <em>(optional, for officer follow-up)</em></span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712 345 678" />
            </label>
          )}
          <label className="field">
            <span>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? <Loader2 size={16} className="spin" /> : mode === "signup" ? "Create account" : "Log in"}
          </button>
        </form>
        <p className="auth-note"><Info size={13} /> Passwords are hashed and stored in your own PostgreSQL database — never sent or stored in plain text.</p>
      </div>
    </div>
  );
}
