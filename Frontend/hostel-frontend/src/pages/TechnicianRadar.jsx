import { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import "../styles/technician.css";

function TechnicianRadar() {
  const [complaints, setComplaints] = useState([]);
  const navigate = useNavigate();

  /* ===== AUTH ===== */
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role")?.toLowerCase();
    if (!token || role !== "technician") {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  /* ===== FETCH ===== */
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/complaints/technician");
        setComplaints(Array.isArray(res.data) ? res.data : []);
      } catch {
        setComplaints([]);
      }
    };
    fetch();
    const i = setInterval(fetch, 5000);
    return () => clearInterval(i);
  }, []);

  const now = Date.now();

  /* ===== METRICS ===== */
  const metrics = useMemo(() => {
    const active = complaints.filter(c =>
      ["Pending", "In Progress"].includes(c.status)
    ).length;

    const highPriority = complaints.filter(
      c => c.priority?.toLowerCase() === "high"
    ).length;

    const aging24 = complaints.filter(c =>
      now - new Date(c.createdAt).getTime() > 24 * 60 * 60 * 1000
    ).length;

    const resolvedToday = complaints.filter(c => {
      const last = c.statusHistory?.at(-1);
      return (
        last?.status === "Resolved" &&
        new Date(last.changedAt).toDateString() === new Date().toDateString()
      );
    }).length;

    return {
      total: complaints.length,
      active,
      highPriority,
      aging24,
      resolvedToday
    };
  }, [complaints, now]);

  /* ===== RADAR DOTS ===== */
  const radarDots = useMemo(() => {
    return complaints.map(c => {
      const hours =
        (now - new Date(c.createdAt).getTime()) / (1000 * 60 * 60);

      let level = "safe";
      if (hours > 24) level = "critical";
      else if (hours > 6) level = "warning";

      return {
        ...c,
        hours: hours.toFixed(1),
        level
      };
    });
  }, [complaints, now]);

  return (
    <div className="tech-shell">

      {/* ===== TOP BAR ===== */}
      <div className="tech-topbar">
        <div>
          <div className="tech-title">Technician Radar</div>
          <div className="dept-badge">Operational Intelligence</div>
        </div>
        <button className="tech-btn" onClick={() => navigate("/technician")}>
          Back
        </button>
      </div>

      {/* ===== KPI CARDS ===== */}
      <div className="radar-kpi-grid">
        <div className="radar-kpi">
          <b>{metrics.total}</b>
          <span>Total</span>
        </div>
        <div className="radar-kpi">
          <b>{metrics.active}</b>
          <span>Active</span>
        </div>
        <div className="radar-kpi danger">
          <b>{metrics.highPriority}</b>
          <span>High Priority</span>
        </div>
        <div className="radar-kpi danger">
          <b>{metrics.aging24}</b>
          <span>Aging &gt; 24h</span>
        </div>
        <div className="radar-kpi success">
          <b>{metrics.resolvedToday}</b>
          <span>Resolved Today</span>
        </div>
      </div>

      {/* ===== RADAR VISUAL ===== */}
      <div className="radar-panel">
        <h3 className="panel-title">Live Complaint Aging Radar</h3>

        <div className="radar-field">
          {radarDots.map(c => (
            <div
              key={c._id}
              className={`radar-dot ${c.level}`}
              style={{
                left: `${Math.random() * 85}%`,
                top: `${Math.random() * 85}%`
              }}
            >
              <div className="radar-tooltip">
                <b>Room {c.roomNumber}</b>
                <p>{c.status}</p>
                <small>{c.hours}h old</small>
              </div>
            </div>
          ))}
        </div>

        {radarDots.length === 0 && (
          <p className="tech-empty">No complaints available</p>
        )}
      </div>

    </div>
  );
}

export default TechnicianRadar;
