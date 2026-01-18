import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton";
import api from "../services/api";
import "../styles/dashboard.css";

const IMAGE_BASE = "http://localhost:3000/uploads/";

function StudentDashboard() {
  const navigate = useNavigate();

  const name = localStorage.getItem("name") || "Student";
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role")?.toLowerCase();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [ratingTarget, setRatingTarget] = useState(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");

  const [detailComplaint, setDetailComplaint] = useState(null);

  useEffect(() => {
    if (!token || role !== "student") {
      navigate("/", { replace: true });
    }
  }, [token, role, navigate]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await api.get("/complaints/my");
      setList(Array.isArray(res.data) ? res.data : []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const logout = () => {
    if (!window.confirm("Logout from system?")) return;
    localStorage.clear();
    navigate("/", { replace: true });
  };

  const total = list.length;
  const pending = list.filter(c => c.status === "Pending").length;
  const inProgress = list.filter(c => c.status === "In Progress").length;
  const resolved = list.filter(c => c.status === "Resolved").length;
  const completed = list.filter(c => c.status === "Completed").length;

  const needsAction = list.filter(
    c => c.status === "Resolved" && c.studentConfirmation === "Pending"
  );

  const overdue = list.filter(c => c.isOverdue).length;

  const progressPercent = total
    ? Math.round(((completed + resolved) / total) * 100)
    : 0;

  const avgResolution =
    completed
      ? Math.round(
          list
            .filter(c => c.status === "Completed" && c.resolvedAt && c.createdAt)
            .reduce(
              (a, b) =>
                a + (new Date(b.resolvedAt) - new Date(b.createdAt)),
              0
            ) / completed / 86400000
        )
      : 0;

  const confirmComplaint = async (id) => {
    await api.patch(`/complaints/${id}/confirm`);
    setRatingTarget(id);
    loadStats();
  };

  const rejectComplaint = async (id) => {
    if (!window.confirm("Reject this resolution?")) return;
    await api.patch(`/complaints/${id}/reject`);
    loadStats();
  };

  const submitRating = async () => {
    await api.patch(`/complaints/${ratingTarget}/rate`, {
      rating,
      feedback
    });

    setRatingTarget(null);
    setRating(5);
    setFeedback("");
    loadStats();
  };

  const chartData = useMemo(() => {
    const max = Math.max(pending, inProgress, resolved, completed, 1);
    return [
      { label: "Pending", value: pending, color: "orange", height: (pending / max) * 100 },
      { label: "In Progress", value: inProgress, color: "purple", height: (inProgress / max) * 100 },
      { label: "Resolved", value: resolved, color: "blue", height: (resolved / max) * 100 },
      { label: "Completed", value: completed, color: "green", height: (completed / max) * 100 }
    ];
  }, [pending, inProgress, resolved, completed]);

  const formatImg = img =>
    img?.startsWith("http") ? img : IMAGE_BASE + img;

  return (
    <div className="sd-page">

      <div className="sd-header">
        <BackButton fallback="/" />
        <div>
          <h2>Hello, {name}</h2>
          <p>Your complaint control center</p>
        </div>
      </div>

      {needsAction.length > 0 && (
        <div className="sd-section sd-alerts">
          <h3>Needs Your Action</h3>

          {needsAction.map(c => (
            <div key={c._id} className="alert warning">
              Complaint in Room {c.roomNumber} resolved.
              <div style={{ marginTop: 6 }}>
                <button onClick={() => confirmComplaint(c._id)}>Confirm</button>
                <button onClick={() => rejectComplaint(c._id)}>Reject</button>
                <button onClick={() => setDetailComplaint(c)}>View</button>
              </div>
            </div>
          ))}
        </div>
      )}

 <div className="sd-section">
  <h3>Complaint Status Overview</h3>

  <div className="fancy-status">
    <div className="status-card orange">
      <div className="status-ring"></div>
      <h3>{pending}</h3>
      <p>Pending</p>
    </div>

    <div className="status-card blue">
      <div className="status-ring"></div>
      <h3>{inProgress}</h3>
      <p>In Progress</p>
    </div>

    <div className="status-card purple">
      <div className="status-ring"></div>
      <h3>{resolved}</h3>
      <p>Resolved</p>
    </div>

    <div className="status-card green">
      <div className="status-ring"></div>
      <h3>{completed}</h3>
      <p>Completed</p>
    </div>
  </div>
</div>


      <div className="sd-actions">

        <div className="sd-tile blue" onClick={() => navigate("/student/submit")}>
          <h4>New Complaint</h4>
          <p>Create a complaint</p>
        </div>

        <div className="sd-tile red" onClick={() => navigate("/student/ragging")}>
          <h4>Ragging</h4>
          <p>Emergency report</p>
        </div>

        <div className="sd-tile purple" onClick={() => navigate("/student/history")}>
          <h4>History</h4>
          <p>Track complaints</p>
        </div>

        <div className="sd-tile teal" onClick={() => navigate("/student/notices")}>
          <h4>Notices</h4>
          <p>Hostel updates</p>
        </div>

        <div className="sd-tile gray" onClick={logout}>
          <h4>Logout</h4>
          <p>Exit account</p>
        </div>

      </div>

      <div className="sd-section sd-kpi">
        <div className="kpi-card"><h4>{avgResolution || 0} days</h4><span>Avg Resolution</span></div>
        <div className="kpi-card"><h4>{needsAction.length}</h4><span>Awaiting Confirmation</span></div>
        <div className="kpi-card"><h4>{resolved}</h4><span>Resolved</span></div>
      </div>

      {detailComplaint && (
        <div className="image-modal" onClick={() => setDetailComplaint(null)}>
          <div className="rating-box" onClick={e => e.stopPropagation()}>
            <h3>Complaint Detail</h3>

            <p><b>Status:</b> {detailComplaint.status}</p>
            <p><b>Category:</b> {detailComplaint.category}</p>
            <p><b>Technician:</b> {detailComplaint.technicianNameSnapshot || "Not assigned"}</p>

            <div className="detail-text">{detailComplaint.complaintText}</div>

            {detailComplaint.repairImages?.length > 0 && (
              <>
                <h4>Repair Evidence</h4>
                <div className="image-grid">
                  {detailComplaint.repairImages.map((img,i)=>(
                    <img key={i} src={formatImg(img)} alt="repair" />
                  ))}
                </div>
              </>
            )}

            {detailComplaint.statusHistory?.length > 0 ? (
              <>
                <h4>Timeline</h4>
                {detailComplaint.statusHistory.map((s,i)=>(
                  <div key={i}>
                    <b>{s.status}</b> — {s.changedByRole}
                  </div>
                ))}
              </>
            ) : (
              <p className="timeline-empty">No timeline available</p>
            )}

            <button onClick={() => setDetailComplaint(null)}>Close</button>
          </div>
        </div>
      )}

      {ratingTarget && (
        <div className="image-modal" onClick={() => setRatingTarget(null)}>
          <div className="rating-box" onClick={e => e.stopPropagation()}>
            <h3>Rate Resolution</h3>

            <select value={rating} onChange={e => setRating(+e.target.value)}>
              <option value={5}>⭐⭐⭐⭐⭐</option>
              <option value={4}>⭐⭐⭐⭐</option>
              <option value={3}>⭐⭐⭐</option>
              <option value={2}>⭐⭐</option>
              <option value={1}>⭐</option>
            </select>

            <textarea
              placeholder="Feedback..."
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
            />

            <div style={{ marginTop: 10 }}>
              <button onClick={submitRating}>Submit</button>
              <button onClick={() => setRatingTarget(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default StudentDashboard;


