import React, { useCallback, useEffect, useRef, useState } from "react";
import { X, MapPin, Send, ExternalLink, Plus, Edit3, Trash2 } from "lucide-react";
import { STATUS_STEPS, StatusLadder, UrgencyBadge, timeAgo } from "../components/Shared";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function AdminDashboard() {
  const { socket } = useAuth();
  const [tab, setTab] = useState("reports");
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );

  const load = useCallback(async () => {
    const { reports } = await api.listReports();
    setReports(reports);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().then(setNotifPermission);
    }
  }, []);

  // The core "instant notification" requirement: the socket pushes new
  // reports and updates the moment they happen — no polling needed.
  useEffect(() => {
    const s = socket?.current;
    if (!s) return;

    const onNew = ({ report }) => {
      setReports((prev) => [report, ...prev]);
      if (Notification?.permission === "granted") {
        new Notification("New report filed", {
          body: `${report.category} • ${report.urgency} urgency, from ${report.reporter?.name || "a citizen"}`,
        });
      }
    };
    const onUpdate = ({ report }) => {
      setReports((prev) => prev.map((r) => (r.id === report.id ? report : r)));
      setSelected((prev) => (prev?.id === report.id ? report : prev));
    };

    s.on("new-report", onNew);
    s.on("report-updated", onUpdate);
    return () => { s.off("new-report", onNew); s.off("report-updated", onUpdate); };
  }, [socket]);

  async function openReport(r) {
    setSelected(r);
    if (r.adminUnread) {
      try {
        const { report } = await api.markSeen(r.id);
        setReports((prev) => prev.map((x) => (x.id === report.id ? report : x)));
        setSelected(report);
      } catch (e) { /* ignore */ }
    }
  }

  async function updateStatus(status) {
    if (!selected) return;
    const { report } = await api.updateStatus(selected.id, status);
    setSelected(report);
    setReports((prev) => prev.map((x) => (x.id === report.id ? report : x)));
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!message.trim() || !selected) return;
    const { report } = await api.sendMessage(selected.id, message.trim());
    setSelected(report);
    setReports((prev) => prev.map((x) => (x.id === report.id ? report : x)));
    setMessage("");
  }

  const unseenCount = reports.filter((r) => r.adminUnread).length;
  const filtered = filter === "all" ? reports : reports.filter((r) => r.status === filter);

  return (
    <div className="dash">
      <div className="dash-head">
        <div>
          <h1>Duty desk</h1>
          <p className="muted">
            {unseenCount > 0 ? `${unseenCount} new report${unseenCount > 1 ? "s" : ""} awaiting review` : "All reports reviewed"}
            {notifPermission !== "granted" && notifPermission !== "unsupported" && " • enable browser notifications for instant alerts"}
          </p>
        </div>
        <div className="admin-tabs">
          <button className={tab === "reports" ? "auth-tab active" : "auth-tab"} onClick={() => setTab("reports")}>Reports</button>
          <button className={tab === "bulletins" ? "auth-tab active" : "auth-tab"} onClick={() => setTab("bulletins")}>Bulletins</button>
        </div>
      </div>

      {tab === "reports" && (
        <>
          <div className="filter-row">
            <button className={filter === "all" ? "filter-chip filter-chip-on" : "filter-chip"} onClick={() => setFilter("all")}>All ({reports.length})</button>
            {STATUS_STEPS.map((s) => (
              <button key={s.key} className={filter === s.key ? "filter-chip filter-chip-on" : "filter-chip"} onClick={() => setFilter(s.key)}>
                {s.label} ({reports.filter((r) => r.status === s.key).length})
              </button>
            ))}
          </div>

          <div className="dash-grid">
            <div className="report-list">
              {filtered.length === 0 && <div className="empty-state">No reports in this view.</div>}
              {filtered.map((r) => (
                <button key={r.id} className={`report-card ${selected?.id === r.id ? "report-card-active" : ""}`} onClick={() => openReport(r)}>
                  <div className="report-card-top">
                    <span className="report-cat">{r.category}</span>
                    {r.adminUnread && <span className="pulse-dot" title="Unread" />}
                  </div>
                  <p className="report-desc">{r.description}</p>
                  <div className="report-card-bottom">
                    <UrgencyBadge level={r.urgency} />
                    <span className="muted small">by {r.reporter?.name} • {timeAgo(r.updatedAt)}</span>
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
                <p className="muted small">
                  Reported by {selected.reporter?.name} ({selected.reporter?.username})
                  {selected.reporter?.phone ? ` • ${selected.reporter.phone}` : ""} • {timeAgo(selected.createdAt)}
                </p>

                <div className="field">
                  <span>Update status</span>
                  <div className="urgency-row">
                    {STATUS_STEPS.map((s) => (
                      <button key={s.key} type="button"
                        className={`urgency-chip ${selected.status === s.key ? "urgency-chip-on" : ""}`}
                        style={{ "--chip-color": "var(--ink-2)" }}
                        onClick={() => updateStatus(s.key)}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="report-full-desc">{selected.description}</p>
                {selected.latitude ? (
                  <a className="map-link" target="_blank" rel="noreferrer"
                    href={`https://www.openstreetmap.org/?mlat=${selected.latitude}&mlon=${selected.longitude}#map=17/${selected.latitude}/${selected.longitude}`}>
                    <MapPin size={14} /> {selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)} <ExternalLink size={12} />
                  </a>
                ) : (
                  <p className="muted small"><MapPin size={12} /> No location shared.</p>
                )}
                {selected.mediaUrl && selected.mediaType === "image" && (
                  <img src={`${api.API_URL}${selected.mediaUrl}`} className="media-preview" alt="evidence" />
                )}
                {selected.mediaUrl && selected.mediaType === "video" && (
                  <video src={`${api.API_URL}${selected.mediaUrl}`} controls className="media-preview" />
                )}

                <div className="thread">
                  <h3>Message thread</h3>
                  {selected.messages.length === 0 && <p className="muted small">No messages yet. Ask the citizen for more detail if you need it.</p>}
                  {selected.messages.map((m) => (
                    <div key={m.id} className={`msg ${m.from === "admin" ? "msg-me" : "msg-them"}`}>
                      <span className="msg-from">{m.from === "admin" ? "You" : selected.reporter?.name}</span>
                      <p>{m.text}</p>
                      <span className="msg-time">{timeAgo(m.createdAt)}</span>
                    </div>
                  ))}
                  <form className="reply-row" onSubmit={sendMessage}>
                    <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Request more information or send an update…" />
                    <button className="icon-btn icon-btn-accent" type="submit"><Send size={15} /></button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {tab === "bulletins" && <BulletinAdmin />}
    </div>
  );
}

function BulletinAdmin() {
  const [bulletins, setBulletins] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", category: "First Aid", summary: "", body: "" });

  const load = useCallback(async () => {
    const { bulletins } = await api.listBulletins();
    setBulletins(bulletins);
  }, []);

  useEffect(() => { load(); }, [load]);

  function startNew() {
    setForm({ title: "", category: "First Aid", summary: "", body: "" });
    setEditing("new");
  }
  function startEdit(b) {
    setForm({ title: b.title, category: b.category, summary: b.summary, body: b.body });
    setEditing(b.id);
  }
  async function save(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.summary.trim() || !form.body.trim()) return;
    if (editing === "new") await api.createBulletin(form);
    else await api.updateBulletin(editing, form);
    setEditing(null);
    load();
  }
  async function remove(id) {
    await api.deleteBulletin(id);
    load();
  }

  return (
    <div className="bulletin-admin">
      <div className="dash-head" style={{ marginTop: 0 }}>
        <p className="muted">Published to the public front page.</p>
        <button className="btn btn-primary" onClick={startNew}><Plus size={16} /> New bulletin</button>
      </div>
      {editing && (
        <form className="form bulletin-form" onSubmit={save}>
          <label className="field"><span>Title</span><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label className="field"><span>Category</span>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option>First Aid</option><option>Safety</option><option>Community</option>
            </select>
          </label>
          <label className="field"><span>Short summary</span><input value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></label>
          <label className="field"><span>Full text</span><textarea rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></label>
          <div className="urgency-row">
            <button className="btn btn-primary" type="submit">Save bulletin</button>
            <button className="btn btn-ghost" type="button" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      )}
      <div className="bulletin-admin-list">
        {bulletins.map((b) => (
          <div className="bulletin-admin-row" key={b.id}>
            <div>
              <span className="bulletin-tag">{b.category}</span>
              <strong>{b.title}</strong>
              <p className="muted small">{b.summary}</p>
            </div>
            <div className="row-actions">
              <button className="icon-btn" onClick={() => startEdit(b)}><Edit3 size={15} /></button>
              <button className="icon-btn" onClick={() => remove(b.id)}><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
