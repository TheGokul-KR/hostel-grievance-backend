import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton";
import api from "../services/api";
import "../styles/dashboard.css";

const IMAGE_BASE = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, "") + "/uploads/"
  : "http://localhost:5000/uploads/";

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
  const [ratingLoading, setRatingLoading] = useState(false);

  const [detailComplaint, setDetailComplaint] = useState(null);

  const [showWelcome, setShowWelcome] = useState(true);
  const [showLogout, setShowLogout] = useState(false);

  // 🔒 AUTH
  useEffect(() => {
    if (!token || role !== "student") {
      navigate("/", { replace: true });
    }
  }, [token, role, navigate]);

  useEffect(() => {
    const t = setTimeout(() => setShowWelcome(false), 1500);
    return () => clearTimeout(t);
  }, []);

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
    setShowLogout(true);
    setTimeout(() => {
      localStorage.clear();
      navigate("/", { replace: true });
    }, 1200);
  };

  const total = list.length;
  const pending = list.filter(c => c.status === "Pending").length;
  const inProgress = list.filter(c => c.status === "In Progress").length;
  const resolved = list.filter(c => c.status === "Resolved").length;
  const completed = list.filter(c => c.status === "Completed").length;

  const needsAction = list.filter(
    c => c.status === "Resolved" && c.studentConfirmation === "Pending"
  );

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

  const confirmComplaint = async id => {
    try {
      await api.patch(`/complaints/${id}/confirm`);
      setRatingTarget(id);
      loadStats();
    } catch {
      alert("Confirmation failed");
    }
  };

  const rejectComplaint = async id => {
    if (!window.confirm("Reject this resolution?")) return;
    try {
      await api.patch(`/complaints/${id}/reject`);
      loadStats();
    } catch {
      alert("Rejection failed");
    }
  };

  const submitRating = async () => {
    if (!feedback.trim()) {
      alert("Please enter feedback");
      return;
    }

    try {
      setRatingLoading(true);

      await api.patch(`/complaints/${ratingTarget}/rate`, {
        rating,
        feedback
      });

      setRatingTarget(null);
      setRating(5);
      setFeedback("");
      loadStats();

    } catch {
      alert("Rating submission failed");
    } finally {
      setRatingLoading(false);
    }
  };

  const formatImg = img =>
    img?.startsWith("http") ? img : IMAGE_BASE + encodeURIComponent(img);

  return (
    <div className="sd-page">

      {showWelcome && (
        <div className="sd-welcome-overlay fade-slide">
          Welcome, {name} 👋
        </div>
      )}

      {showLogout && (
        <div className="sd-logout-overlay fade-slide">
          Logging out from Student Dashboard…
        </div>
      )}

      <div className="sd-header fade-up">
        <BackButton fallback="/" />
        <div>
          <h2>Hello, {name}</h2>
          <p>Your complaint control center</p>
        </div>
      </div>

      {needsAction.length > 0 && (
        <div className="sd-section sd-alerts fade-up">
          <h3>Needs Your Action</h3>

          {needsAction.map(c => (
            <div key={c._id} className="alert warning bounce-in">
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

      <div className="sd-section fade-up">
        <h3>Complaint Status Overview</h3>

        <div className="fancy-status">
          <div className="status-card orange float-card"><div className="status-ring"></div><h3>{pending}</h3><p>Pending</p></div>
          <div className="status-card blue float-card"><div className="status-ring"></div><h3>{inProgress}</h3><p>In Progress</p></div>
          <div className="status-card purple float-card"><div className="status-ring"></div><h3>{resolved}</h3><p>Resolved</p></div>
          <div className="status-card green float-card"><div className="status-ring"></div><h3>{completed}</h3><p>Completed</p></div>
        </div>
      </div>

      <div className="sd-actions fade-up">
        <div className="sd-tile blue hover-pop" onClick={() => navigate("/student/submit")}>New Complaint</div>
        <div className="sd-tile red hover-pop" onClick={() => navigate("/student/ragging")}>Ragging</div>
        <div className="sd-tile purple hover-pop" onClick={() => navigate("/student/history")}>History</div>
        <div className="sd-tile teal hover-pop" onClick={() => navigate("/student/notices")}>Notices</div>
        <div className="sd-tile gray hover-pop" onClick={logout}>Logout</div>
      </div>

      <div className="sd-section sd-kpi fade-up">
        <div className="kpi-card pop-in"><h4>{avgResolution || 0} days</h4><span>Avg Resolution</span></div>
        <div className="kpi-card pop-in"><h4>{needsAction.length}</h4><span>Awaiting Confirmation</span></div>
        <div className="kpi-card pop-in"><h4>{resolved}</h4><span>Resolved</span></div>
      </div>

      {ratingTarget && (
        <div className="image-modal fade-bg" onClick={() => setRatingTarget(null)}>
          <div className="rating-box zoom-in" onClick={e => e.stopPropagation()}>
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
              <button disabled={ratingLoading} onClick={submitRating}>
                {ratingLoading ? "Submitting..." : "Submit"}
              </button>
              <button onClick={() => setRatingTarget(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default StudentDashboard;
