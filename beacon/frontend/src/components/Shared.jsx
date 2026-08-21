import React from "react";

export const CATEGORIES = [
  "Theft", "Assault", "Vandalism", "Suspicious Activity",
  "Traffic Incident", "Domestic Disturbance", "Fraud / Scam", "Other",
];

export const URGENCY = [
  { key: "low", label: "Low", color: "var(--teal)" },
  { key: "medium", label: "Medium", color: "var(--amber)" },
  { key: "high", label: "High", color: "var(--orange)" },
  { key: "emergency", label: "Emergency", color: "var(--red)" },
];

export const STATUS_STEPS = [
  { key: "received", label: "Received" },
  { key: "reviewing", label: "Under Review" },
  { key: "assigned", label: "Officer Assigned" },
  { key: "resolved", label: "Resolved" },
];

export function timeAgo(dateInput) {
  const ts = new Date(dateInput).getTime();
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function StatusLadder({ status, compact }) {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return (
    <div className={compact ? "ladder ladder-compact" : "ladder"}>
      {STATUS_STEPS.map((s, i) => (
        <div key={s.key} className="ladder-step">
          <div className={`ladder-dot ${i <= idx ? "ladder-dot-on" : ""} ${i === idx ? "ladder-dot-current" : ""}`} />
          {!compact && <div className={`ladder-label ${i <= idx ? "ladder-label-on" : ""}`}>{s.label}</div>}
          {i < STATUS_STEPS.length - 1 && <div className={`ladder-line ${i < idx ? "ladder-line-on" : ""}`} />}
        </div>
      ))}
    </div>
  );
}

export function UrgencyBadge({ level }) {
  const u = URGENCY.find((x) => x.key === level) || URGENCY[0];
  return (
    <span className="badge" style={{ "--badge-color": u.color }}>
      {level === "emergency" && <span className="pulse-dot" />}
      {u.label}
    </span>
  );
}

export function Beacon({ size = 20 }) {
  return (
    <span className="beacon-mark" style={{ width: size, height: size }}>
      <span className="beacon-core" />
      <span className="beacon-ring" />
    </span>
  );
}
