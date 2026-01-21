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

const normalizeImage = img => {
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
  const [newAlert, setNewAlert] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const navigate = useNavigate();
  const selectedIdRef = useRef(null);
  const lastCountRef = useRef(0);
  const intervalRef = useRef(null);

  // 🔒 AUTH
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

      if (lastCountRef.current !== 0 && list.length > lastCountRef.current) {
        setNewAlert(true);
        setTimeout(() => setNewAlert(false), 2000);
      }

      lastCountRef.current = list.length;
      setComplaints(list);

      if (selectedIdRef.current) {
        const found = list.find(c => c._id === selectedIdRef.current);
        setSelectedComplaint(found || null);
      } else if (list.length > 0) {
        setSelectedComplaint(list[0]);
        selectedIdRef.current = list[0]._id;
      }

    } catch {
      setComplaints([]);
    }
  };

  useEffect(() => {
    fetchComplaints();
    intervalRef.current = setInterval(fetchComplaints, 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const updateStatus = async (id, status) => {
    if (!solutionSummary.trim()) {
      alert("Enter solution summary first");
      return;
    }

    try {
      setLoadingStatus(true);

      await api.patch(`/complaints/${id}/status`, {
        status,
        remark: "",
        solutionSummary
      });

      setSolutionSummary("");
      await fetchComplaints();

    } catch (err) {
      alert(err.response?.data?.message || "Status update failed");
    } finally {
      setLoadingStatus(false);
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
    <div className="tech-shell">

      {newAlert && (
        <div className="tech-toast">
          New complaint assigned
        </div>
      )}

      {/* ===== TOP BAR ===== */}
      <div className="tech-topbar">
        <div>
          <div className="tech-title">Technician Panel</div>
          <div className="dept-badge">{department}</div>
        </div>

        <div className="tech-actions">
          <button className="tech-btn" onClick={() => navigate("/technician/radar")}>
            Radar
          </button>

          <div className="tech-user">{techName}</div>
          <NotificationBell />

          <button className="tech-btn danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="tech-main">

        {/* ===== LIST ===== */}
        <div className="tech-list">

          <div className="tech-filter-bar">
            <input
              className="tech-search"
              placeholder="Search..."
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
              className={`tech-list-card
                ${selectedComplaint?._id === c._id ? "active" : ""}
                ${c.priority === "High" ? "high" : ""}
              `}
              onClick={() => {
                selectedIdRef.current = c._id;
                setSelectedComplaint(c);
              }}
            >
              <div className="list-head">
                <span className={`status ${c.status.replace(/\s/g, "")}`}>
                  {c.status}
                </span>
                <span>Room {c.roomNumber}</span>
              </div>

              <div className="list-text">
                {(c.complaintText || "").slice(0, 90)}...
              </div>

              <div className="list-meta">
                {c.priority} • {c.category}
              </div>
            </div>
          ))}
        </div>

        {/* ===== DETAIL ===== */}
        <div className="tech-detail">

          {!selectedComplaint ? (
            <div className="tech-empty">
              Select a complaint
            </div>
          ) : (
            <>
              <div className="detail-title">Complaint Detail</div>

              <div className="detail-box">
                {selectedComplaint.complaintText || ""}
              </div>

              <div className="detail-grid">
                <div><b>Category</b><span>{selectedComplaint.category}</span></div>
                <div><b>Room</b><span>{selectedComplaint.roomNumber}</span></div>
              </div>

              {!selectedComplaint.isRagging && (
                <div className="evidence-box">
                  <h4>Student Evidence</h4>

                  {selectedComplaint.images?.length ? (
                    <div className="repair-grid">
                      {selectedComplaint.images.map((img, i) => (
                        <img
                          key={i}
                          src={normalizeImage(img)}
                          onClick={() => setPreviewImage(normalizeImage(img))}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="muted">No images uploaded</p>
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
                  className="tech-btn primary"
                  disabled={loadingStatus}
                  onClick={() =>
                    updateStatus(
                      selectedComplaint._id,
                      NEXT_STATUS[selectedComplaint.status]
                    )
                  }
                >
                  {loadingStatus
                    ? "Updating..."
                    : `Move to ${NEXT_STATUS[selectedComplaint.status]}`}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {previewImage && (
        <div className="image-modal" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} />
        </div>
      )}
    </div>
  );
}

export default TechnicianDashboard;
