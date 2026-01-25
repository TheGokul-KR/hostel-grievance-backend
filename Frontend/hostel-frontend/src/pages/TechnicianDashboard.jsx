import { useEffect, useState, useRef } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import "../styles/technician.css";
import NotificationBell from "../components/NotificationBell";

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
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [toast, setToast] = useState("");

  const navigate = useNavigate();
  const selectedIdRef = useRef(null);

  // AUTH
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
        setSelectedComplaint(found || null);
      }
    } catch {
      setComplaints([]);
    }
  };

  useEffect(() => {
    fetchComplaints();
    const i = setInterval(fetchComplaints, 5000);
    return () => clearInterval(i);
  }, []);

  const updateStatus = async (id, status) => {
    try {
      setLoadingStatus(true);

      await api.patch(`/complaints/${id}/status`, {
        status,
        solutionSummary: solutionSummary || ""
      });

      setSolutionSummary("");
      setToast(`Moved to ${status}`);
      setTimeout(() => setToast(""), 2000);
      await fetchComplaints();
    } catch (err) {
      alert(err.response?.data?.message || "Update failed");
    } finally {
      setLoadingStatus(false);
    }
  };

  const filtered = complaints.filter(c => {
    const s = search.toLowerCase();
    return (
      (statusFilter === "All" || c.status === statusFilter) &&
      ((c.complaintText || "").toLowerCase().includes(s) ||
        (c.roomNumber || "").toLowerCase().includes(s))
    );
  });

  return (
    <div className="tech-shell">

      {toast && <div className="tech-toast">{toast}</div>}

      {/* TOP BAR */}
      <div className="tech-topbar">
        <div>
          <div className="tech-title">Technician Dashboard</div>
          <div className="dept-badge">{department}</div>
        </div>

        <div className="tech-actions">
          <button className="tech-btn" onClick={() => navigate("/technician/radar")}>
            Radar
          </button>
          <NotificationBell />
          <button className="tech-btn danger" onClick={() => {
            localStorage.clear();
            navigate("/", { replace: true });
          }}>
            Logout
          </button>
        </div>
      </div>

      <div className="tech-main">

        {/* LIST */}
        <div className="tech-list">
          <div className="tech-filter-bar">
            <input
              className="tech-search"
              placeholder="Search complaint"
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
              className={`tech-list-card ${c.status.replace(/\s/g, "")} ${selectedComplaint?._id === c._id ? "active" : ""}`}
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
              <div className="list-text">{c.complaintText}</div>
            </div>
          ))}
        </div>

        {/* DETAIL */}
        <div className="tech-detail">
          {!selectedComplaint ? (
            <div className="tech-empty">Select a complaint</div>
          ) : (
            <>
              <h3>Complaint Details</h3>

              <p>{selectedComplaint.complaintText}</p>

              {/* TIMELINE */}
              <div className="timeline">
                {selectedComplaint.statusHistory?.map((h, i) => (
                  <div key={i} className="timeline-item">
                    <span>{h.status}</span>
                    <small>{new Date(h.changedAt).toLocaleString()}</small>
                    {h.remark && <p>{h.remark}</p>}
                  </div>
                ))}
              </div>

              <textarea
                className="tech-input"
                placeholder="Optional instructions / notes"
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
