import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, AlertTriangle, ChevronDown } from "lucide-react";
import { Beacon, StatusLadder } from "../components/Shared";
import { api } from "../api/client";

export default function Home() {
  const [bulletins, setBulletins] = useState([]);
  const [openBulletin, setOpenBulletin] = useState(null);
  const [stats, setStats] = useState({ total: null, resolved: null });

  useEffect(() => {
    api.listBulletins().then((d) => setBulletins(d.bulletins)).catch(() => {});
  }, []);

  return (
    <div>
      <section className="hero">
        <div className="hero-inner">
          <div className="eyebrow"><Beacon size={14} /> Community safety reporting</div>
          <h1 className="hero-title">See something.<br />Say something.<br /><span className="hero-accent">Track it through.</span></h1>
          <p className="hero-sub">
            Report incidents around you in minutes — with your location, a photo or short video, and a description.
            Every report is reviewed, and you're notified the moment there's an update.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary btn-lg" to="/signup"><Plus size={18} /> Report an incident</Link>
            <a className="btn btn-ghost btn-lg" href="#bulletins">Browse safety bulletins</a>
          </div>
        </div>
        <div className="hero-emergency">
          <AlertTriangle size={16} />
          <span>In immediate danger or witnessing an emergency right now? Call your local emergency number first — this portal is reviewed by staff, not monitored second-by-second.</span>
        </div>
      </section>

      <section className="how">
        <h2 className="section-title">How a report moves</h2>
        <p className="section-sub">Every report follows the same four-step path, and you can watch it move.</p>
        <div className="how-ladder"><StatusLadder status="received" /></div>
        <div className="how-grid">
          <div className="how-card"><span className="how-num">01</span><h3>Received</h3><p>Your report reaches the duty desk instantly with your location, media, and description attached.</p></div>
          <div className="how-card"><span className="how-num">02</span><h3>Under review</h3><p>An officer reads it. If they need more detail, they'll ask — right inside your report thread.</p></div>
          <div className="how-card"><span className="how-num">03</span><h3>Officer assigned</h3><p>Your report is handed to whoever is following up, and the status on your dashboard updates.</p></div>
          <div className="how-card"><span className="how-num">04</span><h3>Resolved</h3><p>You get a message the moment it's closed out — no need to check back and wonder.</p></div>
        </div>
      </section>

      <section className="bulletins" id="bulletins">
        <h2 className="section-title">Safety &amp; first aid bulletins</h2>
        <p className="section-sub">Short, practical guidance worth knowing before you need it.</p>
        <div className="bulletin-grid">
          {bulletins.map((b) => (
            <div className="bulletin-card" key={b.id}>
              <span className="bulletin-tag">{b.category}</span>
              <h3>{b.title}</h3>
              <p>{b.summary}</p>
              <button className="bulletin-toggle" onClick={() => setOpenBulletin(openBulletin === b.id ? null : b.id)}>
                {openBulletin === b.id ? "Show less" : "Read more"}
                <ChevronDown size={14} className={openBulletin === b.id ? "chevron-up" : ""} />
              </button>
              {openBulletin === b.id && <p className="bulletin-body">{b.body}</p>}
            </div>
          ))}
          {bulletins.length === 0 && <p className="muted">No bulletins published yet.</p>}
        </div>
      </section>

      <section className="cta">
        <div className="cta-inner">
          <div>
            <h2>Ready to report something?</h2>
            <p>It takes about two minutes, and you'll be able to follow every update from your dashboard.</p>
          </div>
          <Link className="btn btn-primary btn-lg" to="/signup"><Plus size={18} /> Report an incident</Link>
        </div>
      </section>

      <footer className="footer">
        <div><Beacon size={16} /> Beacon — community reporting, followed through.</div>
        <Link className="footer-admin" to="/admin/login">Admin / Officer portal</Link>
      </footer>
    </div>
  );
}
