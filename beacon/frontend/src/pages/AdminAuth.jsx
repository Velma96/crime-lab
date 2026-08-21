import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Info, Loader2 } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function AdminAuth() {
  const [username, setUsername] = useState("");
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
      const { token, user } = await api.adminLogin({ username, password });
      login(token, user);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-admin">
        <Link className="back-link" to="/"><ArrowLeft size={14} /> Back home</Link>
        <ShieldCheck size={26} />
        <h1>Admin / officer portal</h1>
        <p className="auth-sub">Restricted access — for reviewing and responding to citizen reports.</p>
        <form onSubmit={submit} className="form">
          <label className="field">
            <span>Username</span>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" />
          </label>
          <label className="field">
            <span>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? <Loader2 size={16} className="spin" /> : "Log in"}
          </button>
        </form>
        <p className="auth-note"><Info size={13} /> First time? Run <code>npm run seed</code> in the backend to create the starting admin account (username <code>admin</code>, password <code>admin123</code>) — change the password right after.</p>
      </div>
    </div>
  );
}
