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
    <div className="tech-shell">

      {/* TOP BAR */}
      <div className="tech-topbar">
        <div>
          <div className="tech-title">Technician Radar</div>
          <div className="dept-badge">Operational Intelligence</div>
        </div>

        <button className="tech-btn" onClick={() => navigate("/technician")}>
          Back
        </button>
      </div>

      {/* KPI GRID */}
      <div className="admin-kpi">
        <div className="kpi-card">
          <b>{metrics.total}</b>
          <span>Total</span>
        </div>
        <div className="kpi-card">
          <b>{metrics.active}</b>
          <span>Active</span>
        </div>
        <div className="kpi-card danger">
          <b>{metrics.highPriority}</b>
          <span>High Priority</span>
        </div>
        <div className="kpi-card danger">
          <b>{metrics.aging24}</b>
          <span>Aging &gt;24h</span>
        </div>
        <div className="kpi-card">
          <b>{metrics.resolvedToday}</b>
          <span>Resolved Today</span>
        </div>
      </div>

      {/* RADAR PANEL */}
      <div className="admin-panel">

        <h3 className="panel-title">Live Complaint Aging Radar</h3>

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

        {radarDots.length === 0 && (
          <p className="tech-empty">No complaints available</p>
        )}

      </div>

    </div>
  );
}

export default TechnicianRadar;
