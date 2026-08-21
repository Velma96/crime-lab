import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, LogOut, User, ShieldCheck } from "lucide-react";
import { Beacon } from "./Shared";
import { useAuth } from "../context/AuthContext";

export default function NavBar({ unseenCount = 0 }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand">
          <Beacon size={22} />
          <span>Beacon</span>
        </Link>
        <div className="nav-links">
          {!user && (
            <>
              <Link className="nav-link" to="/">Home</Link>
              <Link className="btn btn-ghost" to="/login">Citizen Login</Link>
              <Link className="btn btn-primary" to="/signup">Report Now</Link>
            </>
          )}
          {user && user.role === "CITIZEN" && (
            <>
              <Link className="nav-link" to="/">Home</Link>
              <Link className="btn btn-ghost" to="/dashboard">My Reports</Link>
              <span className="nav-user"><User size={14} /> {user.name}</span>
              <button className="icon-btn" onClick={handleLogout} title="Log out"><LogOut size={16} /></button>
            </>
          )}
          {user && user.role === "ADMIN" && (
            <>
              <Link className="nav-link" to="/">Home</Link>
              <Link className="btn btn-ghost admin-dash-btn" to="/admin/dashboard">
                <Bell size={14} />
                Dashboard
                {unseenCount > 0 && <span className="unseen-count">{unseenCount}</span>}
              </Link>
              <span className="nav-user"><ShieldCheck size={14} /> {user.name}</span>
              <button className="icon-btn" onClick={handleLogout} title="Log out"><LogOut size={16} /></button>
            </>
          )}
        </div>
      </div>
      {!user && (
        <Link className="admin-link" to="/admin/login">Admin / Officer portal →</Link>
      )}
    </div>
  );
}
