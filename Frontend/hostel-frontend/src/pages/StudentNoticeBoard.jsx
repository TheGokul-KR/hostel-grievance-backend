import { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import "../styles/notice.css";

function StudentNoticeBoard() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const rawRole = localStorage.getItem("role");
    const role = rawRole ? rawRole.trim().toLowerCase() : null;

    if (!token || role !== "student") {
      navigate("/", { replace: true });
      return;
    }

    setAuthChecked(true);
  }, [navigate]);

  const loadNotices = async () => {
    try {
      const res = await api.get("/notices");
      let data = Array.isArray(res.data) ? res.data : [];

      data.sort((a, b) => {
        if (a.pinned !== b.pinned) return b.pinned - a.pinned;
        if (a.priority !== b.priority)
          return ["Low","Normal","High"].indexOf(b.priority) -
                 ["Low","Normal","High"].indexOf(a.priority);
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      setNotices(data);
    } catch {
      setNotices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authChecked) {
      loadNotices();
    }
  }, [authChecked]);

  const formatDate = (d) =>
    new Date(d).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

  if (!authChecked) return null;

  return (
    <div className="notice-bg">

      <div className="notice-header glass">
        <div className="notice-title">
          📢 Hostel Notices
        </div>

        <button className="notice-back" onClick={() => navigate("/student")}>
          ← Dashboard
        </button>
      </div>

      <div className="notice-container">

        {loading && <p className="empty-msg">Loading notices…</p>}

        {!loading && notices.length === 0 && (
          <p className="empty-msg">No notices available.</p>
        )}

        {!loading && notices.map((n, i) => (
          <div
            key={n._id}
            className={`notice-card 
              ${n.priority === "High" ? "high" : ""} 
              ${n.priority === "Normal" ? "normal" : ""} 
              ${n.priority === "Low" ? "low" : ""}`}
            style={{ animationDelay: `${i * 0.08}s` }}
          >

            <div className={`notice-stripe ${n.priority?.toLowerCase()}`} />

            {n.pinned && (
              <div className="pin-badge">📌 Pinned</div>
            )}

            <div className="notice-body">

              <h3 className="notice-title-text">
                {n.title}
              </h3>

              <div className="notice-meta">
                <span className="notice-category">
                  {n.category || "Hostel"}
                </span>
                <span className="notice-date">
                  {formatDate(n.createdAt)}
                </span>
              </div>

              <p className="notice-content">
                {n.content}
              </p>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}

export default StudentNoticeBoard;
