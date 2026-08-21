import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import CitizenAuth from "./pages/CitizenAuth";
import CitizenDashboard from "./pages/CitizenDashboard";
import AdminAuth from "./pages/AdminAuth";
import AdminDashboard from "./pages/AdminDashboard";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Beacon } from "./components/Shared";

function RequireCitizen({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Boot />;
  if (!user || user.role !== "CITIZEN") return <Navigate to="/login" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Boot />;
  if (!user || user.role !== "ADMIN") return <Navigate to="/admin/login" replace />;
  return children;
}

function Boot() {
  return (
    <div className="boot">
      <Beacon size={28} />
      <span>Loading Beacon…</span>
    </div>
  );
}

function Shell() {
  const { loading } = useAuth();
  if (loading) return <Boot />;
  return (
    <div className="app-root">
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<CitizenAuth />} />
        <Route path="/login" element={<CitizenAuth />} />
        <Route path="/dashboard" element={<RequireCitizen><CitizenDashboard /></RequireCitizen>} />
        <Route path="/admin/login" element={<AdminAuth />} />
        <Route path="/admin/dashboard" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </BrowserRouter>
  );
}
