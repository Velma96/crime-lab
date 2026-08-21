import React, { useCallback, useEffect, useState } from "react";
import { Plus, X, MapPin, Send, FileText, ExternalLink } from "lucide-react";
import { StatusLadder, UrgencyBadge, timeAgo } from "../components/Shared";
import ReportForm from "../components/ReportForm";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function CitizenDashboard() {
  const { user, socket } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { reports } = await api.listReports();
      setReports(reports);
    } catch (e) { /* handled by empty state */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Live updates: an officer changed status or replied while we're looking at the dashboard.
  useEffect(() => {
    const s = socket?.current;
    if (!s) return;
    const onUpdate = ({ report }) => {
      setReports((prev) => {
        const exists = prev.some((r) => r.id === report.id);
        return exists ? prev.map((r) => (r.id === report.id ? report : r)) : [report, ...prev];
      });
      setSelected((prev) => (prev?.id === report.id ? report : prev));
    };
    s.on("report-updated", onUpdate);
    return () => s.off("report-updated", onUpdate);
  }, [socket]);

  async function openReport(r) {
    setSelected(r);
    if (r.citizenUnread) {
      try {
        const { report } = await api.markSeen(r.id);
        setReports((prev) => prev.map((x) => (x.id === report.id ? report : x)));
        setSelected(report);
      } catch (e) { /* ignore */ }
    }
  }

  async function sendReply(e) {
    e.preventDefault();
    if (!reply.trim() || !selected) return;
    try {
      const { report } = await api.sendMessage(selected.id, reply.trim());
      setSelected(report);
      setReports((prev) => prev.map((x) => (x.id === report.id ? report : x)));
      setReply("");
    } catch (e) { /* show inline if needed */ }
  }

  return (
    <div className="dash">
      <div className="dash-head">
        <div>
          <h1>My reports</h1>
          <p className="muted">Signed in as {user.name}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> New report</button>
      </div>

      {loading && reports.length === 0 && <div className="empty-state">Loading your reports…</div>}
      {!loading && reports.length === 0 && (
        <div className="empty-state">
          <FileText size={28} />
          <p>You haven't filed a report yet.</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>File your first report</button>
        </div>
      )}

      <div className="dash-grid">
        <div className="report-list">
          {reports.map((r) => (
            <button key={r.id} className={`report-card ${selected?.id === r.id ? "report-card-active" : ""}`} onClick={() => openReport(r)}>
              <div className="report-card-top">
                <span className="report-cat">{r.category}</span>
                {r.citizenUnread && <span className="pulse-dot" title="New update" />}
              </div>
              <p className="report-desc">{r.description}</p>
              <div className="report-card-bottom">
                <UrgencyBadge level={r.urgency} />
                <span className="muted small">{timeAgo(r.updatedAt)}</span>
              </div>
              <StatusLadder status={r.status} compact />
            </button>
          ))}
        </div>

        {selected && (
          <div className="report-detail">
            <div className="report-detail-head">
              <div>
                <span className="report-cat">{selected.category}</span>
                <UrgencyBadge level={selected.urgency} />
              </div>
              <button className="icon-btn" onClick={() => setSelected(null)}><X size={16} /></button>
            </div>
            <StatusLadder status={selected.status} />
            <p className="report-full-desc">{selected.description}</p>
            {selected.latitude && (
              <a className="map-link" target="_blank" rel="noreferrer"
                href={`https://www.openstreetmap.org/?mlat=${selected.latitude}&mlon=${selected.longitude}#map=17/${selected.latitude}/${selected.longitude}`}>
                <MapPin size={14} /> {selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)} <ExternalLink size={12} />
              </a>
            )}
            {selected.mediaUrl && selected.mediaType === "image" && (
              <img src={`${api.API_URL}${selected.mediaUrl}`} className="media-preview" alt="evidence" />
            )}
            {selected.mediaUrl && selected.mediaType === "video" && (
              <video src={`${api.API_URL}${selected.mediaUrl}`} controls className="media-preview" />
            )}

            <div className="thread">
              <h3>Messages</h3>
              {selected.messages.length === 0 && <p className="muted small">No messages yet. If an officer needs more information, it'll show up here.</p>}
              {selected.messages.map((m) => (
                <div key={m.id} className={`msg ${m.from === "citizen" ? "msg-me" : "msg-them"}`}>
                  <span className="msg-from">{m.from === "citizen" ? "You" : "Officer"}</span>
                  <p>{m.text}</p>
                  <span className="msg-time">{timeAgo(m.createdAt)}</span>
                </div>
              ))}
              <form className="reply-row" onSubmit={sendReply}>
                <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Add more information…" />
                <button className="icon-btn icon-btn-accent" type="submit"><Send size={15} /></button>
              </form>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <ReportForm
          onClose={() => setShowForm(false)}
          onCreated={(report) => { setShowForm(false); setReports((prev) => [report, ...prev]); }}
        />
      )}
    </div>
  );
}
