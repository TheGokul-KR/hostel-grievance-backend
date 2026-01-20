import { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import "../styles/StudentComplaintHistory.css";

const IMAGE_BASE = import.meta.env.VITE_API_BASE_URL + "/uploads/";

// ================= IMAGE NORMALIZER =================
const normalizeImage = (img) => {
  if (!img) return "";
  if (img.startsWith("http")) return img;
  return IMAGE_BASE + encodeURIComponent(img);
};

function StudentComplaintHistory() {
  const [complaints, setComplaints] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [ratingDone, setRatingDone] = useState(false);

  const [previewImg, setPreviewImg] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // ADD ONLY
  const [actionAnim, setActionAnim] = useState(null); // "confirm" | "reject"

  const navigate = useNavigate();

  // ================= AUTH GUARD =================
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token || role?.toLowerCase() !== "student") {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await api.get("/complaints/my");
      setComplaints(Array.isArray(res.data) ? res.data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const reloadAndSelect = async (id) => {
    const res = await api.get("/complaints/my");
    const list = Array.isArray(res.data) ? res.data : [];
    setComplaints(list);

    const updated = list.find(c => c._id === id);
    setSelected(updated || null);

    if (updated) {
      setRating(updated.rating || 0);
      setFeedback(updated.ratingFeedback || "");
      setRatingDone(!!updated.rating);
    }
  };

  const openDetail = (c) => {
    if (!c) return;
    setSelected(c);
    setRating(c.rating || 0);
    setFeedback(c.ratingFeedback || "");
    setRatingDone(!!c.rating);
  };

  const filtered = useMemo(() => {
    return complaints.filter(c => {
      const text = (
        (c.complaintText || "") +
        (c.category || "") +
        (c.roomNumber || "")
      ).toLowerCase();

      return (
        text.includes(search.toLowerCase()) &&
        (filter === "All" || c.status === filter)
      );
    });
  }, [complaints, search, filter]);

  const handleConfirm = async (id) => {
    if (actionLoading) return;
    setActionLoading(true);
    await api.patch(`/complaints/${id}/confirm`);
    setActionAnim("confirm");
    await reloadAndSelect(id);
    setTimeout(() => setActionAnim(null), 1400);
    setActionLoading(false);
  };

  const handleReject = async (id) => {
    if (actionLoading) return;
    setActionLoading(true);
    await api.patch(`/complaints/${id}/reject`);
    setActionAnim("reject");
    await reloadAndSelect(id);
    setTimeout(() => setActionAnim(null), 1400);
    setActionLoading(false);
  };

  const submitRating = async () => {
    if (!rating || !selected?._id) return alert("Select rating");

    await api.patch(`/complaints/${selected._id}/rate`, {
      rating,
      feedback
    });

    await reloadAndSelect(selected._id);
    setRatingDone(true);
  };

  return (
    <div className="history-bg">
      <div className="history-container">

        {actionAnim && (
          <div className={`history-action-overlay ${actionAnim}`}>
            {actionAnim === "confirm" ? "✔ Resolution Confirmed" : "✖ Resolution Rejected"}
          </div>
        )}

        {!selected && (
          <>
            <div className="history-header">
              <h2>My Complaints</h2>
              <button className="dash-btn" onClick={() => navigate("/student")}>
                ← Dashboard
              </button>
            </div>

            <input
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />

            <div className="timeline">
              {filtered.map(c => (
                <div
                  key={c._id}
                  className="timeline-card"
                  onClick={() => openDetail(c)}
                >
                  <b>{c.status}</b>
                  <p>{(c.complaintText || "").slice(0, 80)}...</p>
                  <small>Room {c.roomNumber}</small>
                </div>
              ))}
            </div>
          </>
        )}

        {selected && (
          <div className="detail-card">

            <button className="back-btn" onClick={() => setSelected(null)}>
              ← Back
            </button>

            <h3>{selected.category}</h3>

            <p><b>Status:</b> {selected.status}</p>
            <p><b>Technician:</b> {selected.technicianNameSnapshot || "Not assigned"}</p>

            <div className="detail-box">
              {selected.complaintText || ""}
            </div>

            {Array.isArray(selected.images) && selected.images.length > 0 && (
              <div className="admin-image-grid">
                {selected.images.map((img, i) => (
                  <img
                    key={i}
                    src={normalizeImage(img)}
                    onClick={() => setPreviewImg(normalizeImage(img))}
                  />
                ))}
              </div>
            )}

            {selected.solutionSummary && (
              <div className="solution-box">
                <b>Technician Solution</b>
                <p>{selected.solutionSummary}</p>
              </div>
            )}

            <div className="audit-box">
              <b>Audit Trail</b>
              {Array.isArray(selected.statusHistory) &&
                selected.statusHistory.map((s, i) => (
                  <div key={i} className="audit-row">
                    <span>{s.status}</span>
                    <small>{s.changedByRole}</small>
                  </div>
                ))}
            </div>

            {selected.status === "Resolved" && selected.studentConfirmation === "Pending" && (
              <div className="action-box">
                <button onClick={() => handleConfirm(selected._id)}>Confirm</button>
                <button onClick={() => handleReject(selected._id)}>Reject</button>
              </div>
            )}

            {selected.status === "Completed" && (
              <div className="rating-box">

                {[1, 2, 3, 4, 5].map(star => (
                  <span
                    key={star}
                    className={`star ${star <= (hover || rating) ? "filled" : ""}`}
                    onMouseEnter={() => !ratingDone && setHover(star)}
                    onMouseLeave={() => !ratingDone && setHover(0)}
                    onClick={() => !ratingDone && setRating(star)}
                  >
                    ★
                  </span>
                ))}

                <textarea
                  placeholder="Write your feedback..."
                  value={feedback}
                  disabled={ratingDone}
                  onChange={e => setFeedback(e.target.value)}
                />

                {!ratingDone && (
                  <button type="button" className="rate-btn" onClick={submitRating}>
                    Submit Rating
                  </button>
                )}
              </div>
            )}

          </div>
        )}

      </div>

      {previewImg && (
        <div className="image-modal" onClick={() => setPreviewImg(null)}>
          <img src={previewImg} />
        </div>
      )}
    </div>
  );
}

export default StudentComplaintHistory;
