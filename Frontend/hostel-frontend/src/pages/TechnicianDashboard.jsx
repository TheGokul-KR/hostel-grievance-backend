import { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import "../styles/technician.css";
import NotificationBell from "../components/NotificationBell";

const IMAGE_BASE = import.meta.env.VITE_API_BASE_URL + "/uploads/";


const NEXT_STATUS = {
  Pending: "In Progress",
  "In Progress": "Resolved",
  Resolved: null,
  Completed: null
};

function TechnicianDashboard() {

  const department = localStorage.getItem("department")?.toLowerCase() || "";
  const techName = localStorage.getItem("name") || "Technician";

  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const [solutionSummary, setSolutionSummary] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [previewImage, setPreviewImage] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role?.toLowerCase() !== "technician") {
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
  }, []);

  const loadSimilar = async (id) => {
    try {
      await api.get(`/complaints/similar/${id}`);
    } catch {}
  };

  const reloadAndSelect = async (id) => {
    const res = await api.get("/complaints/technician");
    const list = Array.isArray(res.data) ? res.data : [];
    setComplaints(list);

    const updated = list.find(c => c._id === id);
    setSelectedComplaint(updated || null);
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/complaints/${id}/status`, {
        status,
        remark: "",
        solutionSummary
      });
      setSolutionSummary("");
      await reloadAndSelect(id);
    } catch (err) {
      alert(err.response?.data?.message || "Status update failed");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/", { replace: true });
  };

  const filtered = complaints.filter(c => {
    const txt = (c.complaintText || "").toLowerCase();
    const room = (c.roomNumber || "").toLowerCase();
    const s = search.toLowerCase();

    return (
      (statusFilter === "All" || c.status === statusFilter) &&
      (txt.includes(s) || room.includes(s))
    );
  });

  // 🔥 ONLY REAL FIX HERE
  const ratingValue = selectedComplaint?.rating ?? null;
  const feedbackValue = selectedComplaint?.ratingFeedback ?? null;

  return (
    <div className="tech-bg">

      <div className="tech-topbar glass-panel">
        <div>
          <h2 className="tech-title">Technician Dashboard</h2>
          <span className="dept-badge">{department}</span>
        </div>

        <div className="tech-actions">
          <button className="radar-btn" onClick={() => navigate("/technician/radar")}>
            Radar
          </button>

          <div className="profile-badge">{techName}</div>

          <NotificationBell />

          <button className="tech-logout" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="tech-layout">

        <div className="tech-list">

          <div className="tech-search-filter">
            <input
              className="tech-search"
              placeholder="Search complaint or room..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="tech-filter"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option>All</option>
              <option>Pending</option>
              <option>In Progress</option>
              <option>Resolved</option>
              <option>Completed</option>
            </select>
          </div>

          {filtered.map(c => (
            <div
              key={c._id}
              className={`tech-card glass-card ${selectedComplaint?._id === c._id ? "active" : ""}`}
              onClick={() => {
                setSelectedComplaint(c);
                loadSimilar(c._id);
              }}
            >
              <div className="card-head">
                <span className={`status ${c.status.replace(/\s/g, "")}`}>{c.status}</span>
                <span className="room">Room {c.roomNumber}</span>
              </div>

              <p className="card-title">{c.complaintText.slice(0, 80)}...</p>

              <small className="card-meta">
                {c.priority} Priority • {c.category}
              </small>
            </div>
          ))}
        </div>

        <div className="tech-detail glass-panel">

          {!selectedComplaint ? (
            <div className="tech-empty">Select a complaint to view details</div>
          ) : (
            <>
              <h3 className="detail-title">Complaint Detail</h3>

              <div className="detail-box">{selectedComplaint.complaintText}</div>

              <div className="detail-row">
                <span><b>Category:</b> {selectedComplaint.category}</span>
                <span><b>Room:</b> {selectedComplaint.roomNumber}</span>
              </div>

              {!selectedComplaint.isRagging && (
                <div className="repair-preview">
                  <h4>Student Evidence</h4>

                  {selectedComplaint.images?.length > 0 ? (
                    <div className="repair-grid">
                      {selectedComplaint.images.map((img, i) => (
                        <img
                          key={i}
                          src={`${IMAGE_BASE}${encodeURIComponent(img)}`}
                          className="repair-thumb"
                          onClick={() =>
                            setPreviewImage(`${IMAGE_BASE}${encodeURIComponent(img)}`)
                          }
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="muted">No student images uploaded</p>
                  )}
                </div>
              )}

              {selectedComplaint.statusHistory?.length > 0 && (
                <div className="timeline-box">
                  <h4>Status Timeline</h4>
                  {selectedComplaint.statusHistory.map((t, i) => (
                    <div key={i} className="timeline-item">
                      <span>{t.status}</span>
                      <small>
                        {new Date(t.changedAt || t.updatedAt || Date.now()).toLocaleString()}
                      </small>
                    </div>
                  ))}
                </div>
              )}

              {ratingValue !== null && (
                <div className="rating-box">
                  <h4>Student Rating</h4>
                  <div className="stars">
                    {"★".repeat(ratingValue)}
                    {"☆".repeat(5 - ratingValue)}
                  </div>
                </div>
              )}

              {feedbackValue && (
                <div className="feedback-box">
                  <h4>Student Feedback</h4>
                  <p>{feedbackValue}</p>
                </div>
              )}

              <textarea
                className="tech-input"
                placeholder="Solution summary"
                value={solutionSummary}
                onChange={e => setSolutionSummary(e.target.value)}
              />

              {NEXT_STATUS[selectedComplaint.status] && (
                <button
                  className="accept-btn"
                  onClick={() =>
                    updateStatus(
                      selectedComplaint._id,
                      NEXT_STATUS[selectedComplaint.status]
                    )
                  }
                >
                  Move to {NEXT_STATUS[selectedComplaint.status]}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {previewImage && (
        <div className="image-modal" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} className="modal-img" />
        </div>
      )}
    </div>
  );
}

export default TechnicianDashboard;
