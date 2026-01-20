import { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import "../styles/technician.css";

function TechnicianRadar() {
  const [complaints, setComplaints] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role")?.toLowerCase();

    if (!token || role !== "technician") {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const fetchComplaints = async () => {
    try {
      const res = await api.get("/complaints/technician");
      setComplaints(Array.isArray(res.data) ? res.data : []);
    } catch {
      setComplaints([]);
    }
  };

  useEffect(() => {
  fetchComplaints();
  const interval = setInterval(fetchComplaints, 5000);
  return () => clearInterval(interval);
}, []);

  const now = Date.now();

  const metrics = useMemo(() => {
    const active = complaints.filter(c =>
      ["Pending", "In Progress"].includes(c.status)
    ).length;

    const highPriority = complaints.filter(
      c => c.priority?.toLowerCase() === "high"
    ).length;

    const aging24 = complaints.filter(c => {
      const created = new Date(c.createdAt).getTime();
      return now - created > 24 * 60 * 60 * 1000;
    }).length;

    const resolvedToday = complaints.filter(c => {
      if (!c.statusHistory?.length) return false;
      const last = c.statusHistory[c.statusHistory.length - 1];
      return (
        last.status === "Resolved" &&
        new Date(
          last.changedAt || last.updatedAt || Date.now()
        ).toDateString() === new Date().toDateString()
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

  const radarDots = useMemo(() => {
    return complaints.map(c => {
      const ageHours =
        (now - new Date(c.createdAt).getTime()) / (1000 * 60 * 60);

      let level = "safe";
      if (ageHours > 24) level = "critical";
      else if (ageHours > 6) level = "warning";

      return { ...c, ageHours: ageHours.toFixed(1), level };
    });
  }, [complaints, now]);

  return (
    <div className="tech-bg">

      {/* HEADER */}
      <div className="tech-topbar glass-panel">
        <div>
          <h2 className="tech-title">Technician Radar</h2>
          <small style={{ color: "#c7d2fe" }}>System Intelligence View</small>
        </div>

        <button className="radar-btn" onClick={() => navigate("/technician")}>
          Back to Dashboard
        </button>
      </div>

      {/* METRIC RINGS */}
      <div className="radar-rings">

        <div className="radar-ring safe">
          <span>{metrics.active}</span>
          <p>Active</p>
        </div>

        <div className="radar-ring warning">
          <span>{metrics.highPriority}</span>
          <p>High Priority</p>
        </div>

        <div className="radar-ring critical">
          <span>{metrics.aging24}</span>
          <p>Aging &gt; 24h</p>
        </div>

        <div className="radar-ring info">
          <span>{metrics.resolvedToday}</span>
          <p>Resolved Today</p>
        </div>

      </div>

      {/* KPI GRID */}
      <div className="radar-grid">

        <div className="radar-card">
          <b>Total Complaints</b>
          <h3>{metrics.total}</h3>
        </div>

        <div className="radar-card">
          <b>Active Backlog</b>
          <h3>{metrics.active}</h3>
        </div>

        <div className="radar-card">
          <b>High Priority</b>
          <h3>{metrics.highPriority}</h3>
        </div>

        <div className="radar-card">
          <b>Aging &gt; 24h</b>
          <h3>{metrics.aging24}</h3>
        </div>

      </div>

      {/* RADAR TIMELINE */}
      <div className="timeline-box">
        <h3 style={{ marginBottom: "10px" }}>Live Complaint Aging Radar</h3>

        <div className="radar-timeline">
          {radarDots.map(c => (
            <div key={c._id} className={`radar-dot ${c.level}`}>
              <div className="radar-tooltip">
                <b>Room {c.roomNumber}</b>
                <p>{c.status}</p>
                <small>{c.ageHours}h old</small>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default TechnicianRadar;
