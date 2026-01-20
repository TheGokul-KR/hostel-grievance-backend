import { useEffect, useState, useRef } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import "../styles/technician.css";
import NotificationBell from "../components/NotificationBell";

const IMAGE_BASE = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, "") + "/uploads/"
  : "http://localhost:5000/uploads/";

const NEXT_STATUS = {
  Pending: "In Progress",
  "In Progress": "Resolved",
  Resolved: null,
  Completed: null
};

const normalizeImage = (img) => {
  if (!img) return "";
  if (img.startsWith("http")) return img;
  return IMAGE_BASE + encodeURIComponent(img);
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
  const selectedIdRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role?.toLowerCase() !== "technician") {
      localStorage.clear();
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const fetchComplaints = async () => {
    try {
      const res = await api.get("/complaints/technician");
      const list = Array.isArray(res.data) ? res.data : [];
      setComplaints(list);

      if (selectedIdRef.current) {
        const found = list.find(c => c._id === selectedIdRef.current);
        if (found) {
          setSelectedComplaint(found);
          return;
        } else {
          selectedIdRef.current = null;
          setSelectedComplaint(null);
        }
      }

      if (!selectedIdRef.current && list.length > 0) {
        setSelectedComplaint(list[0]);
        selectedIdRef.current = list[0]._id;
      }

    } catch {
      setComplaints([]);
    }
  };

  useEffect(() => {
    fetchComplaints();
    const interval = setInterval(fetchComplaints, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const filteredCount = complaints.filter(c =>
      (statusFilter === "All" || c.status === statusFilter) &&
      (
        (c.complaintText || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.roomNumber || "").toLowerCase().includes(search.toLowerCase())
      )
    ).length;

    if (complaints.length > 0 && filteredCount === 0) {
      setStatusFilter("All");
      setSearch("");
    }
  }, [complaints, statusFilter, search]);

  const loadSimilar = async (id) => {
    try {
      await api.get(`/complaints/similar/${id}`);
    } catch {}
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/complaints/${id}/status`, {
        status,
        remark: "",
        solutionSummary
      });
      setSolutionSummary("");
      await fetchComplaints();
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
                selectedIdRef.current = c._id;
                setSelectedComplaint(c);
                loadSimilar(c._id);
              }}
            >
              <div className="card-head">
                <span className={`status ${c.status.replace(/\s/g, "")}`}>{c.status}</span>
                <span className="room">Room {c.roomNumber}</span>
              </div>

              <p className="card-title">
                {(c.complaintText || "").slice(0, 80)}...
              </p>

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

              <div className="detail-box">
                {selectedComplaint.complaintText || ""}
              </div>

              <div className="detail-row">
                <span><b>Category:</b> {selectedComplaint.category}</span>
                <span><b>Room:</b> {selectedComplaint.roomNumber}</span>
              </div>

              {!selectedComplaint.isRagging && (
                <div className="repair-preview">
                  <h4>Student Evidence</h4>

                  {Array.isArray(selectedComplaint.images) && selectedComplaint.images.length > 0 ? (
                    <div className="repair-grid">
                      {selectedComplaint.images.map((img, i) => (
                        <img
                          key={i}
                          src={normalizeImage(img)}
                          className="repair-thumb"
                          onClick={() => setPreviewImage(normalizeImage(img))}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="muted">No student images uploaded</p>
                  )}
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
