import React, { useRef, useState } from "react";
import { X, MapPin, Camera, Send, Siren, Loader2 } from "lucide-react";
import { CATEGORIES, URGENCY } from "./Shared";
import { api } from "../api/client";

export default function ReportForm({ onClose, onCreated }) {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [urgency, setUrgency] = useState("low");
  const [description, setDescription] = useState("");
  const [coords, setCoords] = useState(null);
  const [geoStatus, setGeoStatus] = useState("idle");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mediaError, setMediaError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const fileRef = useRef(null);

  function getLocation() {
    if (!navigator.geolocation) { setGeoStatus("error"); return; }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy) });
        setGeoStatus("done");
      },
      () => setGeoStatus("error"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    setMediaError("");
    if (!f.type.startsWith("image/") && !f.type.startsWith("video/")) {
      setMediaError("Please attach an image or video file.");
      return;
    }
    if (f.size > 25 * 1024 * 1024) {
      setMediaError("File is too large — please keep evidence under 25MB.");
      return;
    }
    setFile(f);
    setPreview({ url: URL.createObjectURL(f), type: f.type.startsWith("video/") ? "video" : "image" });
  }

  async function submit(e) {
    e.preventDefault();
    setFormError("");
    if (!description.trim()) { setFormError("Please describe what happened."); return; }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("category", category);
      formData.append("urgency", urgency);
      formData.append("description", description.trim());
      if (coords) {
        formData.append("latitude", coords.lat);
        formData.append("longitude", coords.lng);
        formData.append("accuracy", coords.accuracy);
      }
      if (file) formData.append("media", file);

      const { report } = await api.createReport(formData);
      onCreated(report);
    } catch (err) {
      setFormError(err.message);
    }
    setSubmitting(false);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Report an incident</h2>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="form modal-body">
          <label className="field">
            <span>Category</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          <div className="field">
            <span>Urgency</span>
            <div className="urgency-row">
              {URGENCY.map((u) => (
                <button type="button" key={u.key}
                  className={`urgency-chip ${urgency === u.key ? "urgency-chip-on" : ""}`}
                  style={{ "--chip-color": u.color }}
                  onClick={() => setUrgency(u.key)}>
                  {u.label}
                </button>
              ))}
            </div>
            {urgency === "emergency" && (
              <div className="inline-warning"><Siren size={14} /> If this is happening right now and someone is in danger, call your local emergency number first.</div>
            )}
          </div>

          <label className="field">
            <span>What happened?</span>
            <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Be as specific as you can — time, what you saw, who or what was involved…" />
          </label>

          <div className="field">
            <span>Location</span>
            <button type="button" className="btn btn-ghost btn-block" onClick={getLocation}>
              <MapPin size={16} />
              {geoStatus === "loading" ? "Getting your location…" : coords ? "Location captured — tap to refresh" : "Use my current location"}
            </button>
            {coords && (
              <div className="coords-chip">
                {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)} <span className="muted">(±{coords.accuracy}m)</span>
              </div>
            )}
            {geoStatus === "error" && <div className="form-error">Couldn't get your location. You can still submit without it.</div>}
          </div>

          <div className="field">
            <span>Photo or video evidence <em>(optional)</em></span>
            <button type="button" className="btn btn-ghost btn-block" onClick={() => fileRef.current?.click()}>
              <Camera size={16} /> {file ? `Attached: ${file.name}` : "Attach a photo or video"}
            </button>
            <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFile} style={{ display: "none" }} />
            {preview?.type === "image" && <img src={preview.url} alt="evidence preview" className="media-preview" />}
            {preview?.type === "video" && <video src={preview.url} controls className="media-preview" />}
            {mediaError && <div className="form-error">{mediaError}</div>}
          </div>

          {formError && <div className="form-error">{formError}</div>}
          <button className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? <Loader2 size={16} className="spin" /> : <><Send size={16} /> Submit report</>}
          </button>
        </form>
      </div>
    </div>
  );
}
