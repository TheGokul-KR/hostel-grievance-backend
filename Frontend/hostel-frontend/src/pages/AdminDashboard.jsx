import { useEffect, useState, useMemo, useRef } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import "../styles/admin.css";

const IMAGE_BASE = import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, "") + "/uploads/";

// ================= IMAGE NORMALIZER =================
const normalizeImage = (img) => {
  if (!img) return "";
  if (img.startsWith("http")) return img;
  return IMAGE_BASE + encodeURIComponent(img);
};

function AdminDashboard() {
  const [all, setAll] = useState([]);
  const [ragging, setRagging] = useState([]);

  const [page, setPage] = useState("NORMAL");
  const [selected, setSelected] = useState(null);
  const [previewImg, setPreviewImg] = useState(null);

  const [remark, setRemark] = useState("");
  const [search, setSearch] = useState("");

  const selectedIdRef = useRef(null);
  const pageRef = useRef("NORMAL");

  const navigate = useNavigate();
  const role = localStorage.getItem("role")?.toLowerCase();

  // ================= AUTH GUARD =================
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || role !== "admin") {
      navigate("/", { replace: true });
    }
  }, [navigate, role]);

  // ================= FETCH =================
  const fetchData = async () => {
    const [a, r] = await Promise.all([
      api.get("/complaints/admin/all"),
      api.get("/complaints/admin/ragging")
    ]);

    const allList = Array.isArray(a.data) ? a.data : [];
    const ragList = Array.isArray(r.data) ? r.data : [];

    setAll(allList);
    setRagging(ragList);

    if (selectedIdRef.current) {
      const found =
        allList.find(c => c._id === selectedIdRef.current) ||
        ragList.find(c => c._id === selectedIdRef.current);

      if (found) setSelected(found);
      else setSelected(null);
    }
  };

  // ================= AUTO REFRESH =================
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selected) setRemark(selected.adminRemark || "");
  }, [selected]);

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  const overdue = all.filter(c => c.isOverdue);

  const filteredAll = useMemo(() => {
    return all.filter(c =>
      (
        (c.complaintText || "") +
        (c.category || "") +
        (c.roomNumber || "")
      )
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [all, search]);

  const reloadSelected = async id => {
    const res = await api.get("/complaints/admin/all");
    const list = Array.isArray(res.data) ? res.data : [];
    setAll(list);
    const updated = list.find(c => c._id === id);
    if (updated) setSelected(updated);
  };

  const markReviewed = async id => {
    await api.patch(`/complaints/admin/ragging/${id}/review`);
    fetchData();
    setSelected(null);
  };

  const saveRemark = async () => {
    if (!selected?._id) return;
    await api.patch(`/complaints/admin/ragging/${selected._id}/remark`, {
      remark
    });
    await reloadSelected(selected._id);
  };

  const completedCount = all.filter(c => c.status === "Completed").length;
  const pendingCount = all.filter(c => c.status !== "Completed").length;

  const avgResolution =
    completedCount === 0
      ? "N/A"
      : Math.round(
          all
            .filter(c => c.status === "Completed")
            .reduce((a, b) => a + (b.resolutionHours || 24), 0) / completedCount
        ) + "h";

  const criticalMode = ragging.length > 0 || overdue.length > 0;

  const getStageClass = stage =>
    selected?.status === stage ? "journey-step active" : "journey-step";

  return (
    <div className={`admin-bg ${criticalMode ? "critical-mode" : ""}`}>

      <div className="admin-top">
        <h2>Administrator Dashboard</h2>
        <button className="admin-logout" onClick={logout}>Logout</button>
      </div>

      <div className="admin-health-panel">
        <div>🟢 Active: {pendingCount}</div>
        <div>✅ Completed: {completedCount}</div>
        <div>⏱ Avg Resolution: {avgResolution}</div>
        <div className="danger">🚨 Ragging: {ragging.length}</div>
        <div className="danger">⚠ Overdue: {overdue.length}</div>
      </div>

      {criticalMode && (
        <div className="critical-banner">
          ⚠ CRITICAL MODE ACTIVE — Immediate attention required
        </div>
      )}

      <div className="admin-layout">

        <div className="admin-menu">
          <div onClick={() => { setPage("NORMAL"); pageRef.current="NORMAL"; setSelected(null); }}>📄 Complaints</div>
          <div onClick={() => { setPage("RAGGING"); pageRef.current="RAGGING"; setSelected(null); }}>🚨 Ragging</div>
          <div onClick={() => { setPage("OVERDUE"); pageRef.current="OVERDUE"; setSelected(null); }}>⏱ Overdue</div>
          <hr/>
          <div onClick={() => navigate("/admin/students")}>👨‍🎓 Students</div>
          <div onClick={() => navigate("/admin/technicians")}>🛠 Technicians</div>
          <div onClick={() => navigate("/admin/notices")}>📢 Notices</div>
        </div>

        <div className="admin-content">

{/* ================= NORMAL ================= */}
{page === "NORMAL" && (
<>
<h3>All Complaints</h3>

<input
  className="admin-search"
  placeholder="Search complaints..."
  value={search}
  onChange={e => setSearch(e.target.value)}
/>

{!selected && filteredAll.map(c => (
<div key={c._id} className="admin-card" onClick={() => {
  selectedIdRef.current = c._id;
  setSelected(c);
}}>
<b>{c.category}</b> — {c.status}
<p>{(c.complaintText || "").slice(0,120)}...</p>
</div>
))}

{selected && (
<div className="admin-detail">

<button onClick={() => setSelected(null)}>⬅ Back</button>

<div className="journey-bar">
  <div className={getStageClass("Pending")}>Submitted</div>
  <div className={getStageClass("In Progress")}>In Progress</div>
  <div className={getStageClass("Resolved")}>Resolved</div>
  <div className={getStageClass("Completed")}>Completed</div>
</div>

<p><b>Status:</b> {selected.status}</p>
<p><b>Room:</b> {selected.roomNumber}</p>
<p><b>Category:</b> {selected.category}</p>
<p><b>Technician:</b> {selected.technicianNameSnapshot || "Auto assigned"}</p>

<div className="detail-text">{selected.complaintText || ""}</div>

{Array.isArray(selected.images) && selected.images.length > 0 && (
<div className="image-grid">
{selected.images.map((img,i)=>(
<img
  key={i}
  src={normalizeImage(img)}
  onClick={() => setPreviewImg(normalizeImage(img))}
/>
))}
</div>
)}

{Array.isArray(selected.repairImages) && selected.repairImages.length > 0 && (
<>
<h4>Repair Evidence</h4>
<div className="image-grid">
{selected.repairImages.map((img,i)=>(
<img
  key={i}
  src={normalizeImage(img)}
  onClick={() => setPreviewImg(normalizeImage(img))}
/>
))}
</div>
</>
)}

{selected.rating && (
<div className="rating-box">
⭐ {selected.rating}/5
<p>{selected.ratingFeedback}</p>
</div>
)}

<div className="timeline-box">
<h4>Timeline</h4>
{Array.isArray(selected.statusHistory) && selected.statusHistory.length > 0 ? (
selected.statusHistory.map((s,i)=>(
<div key={i}>
<b>{s.status}</b> — {s.changedByRole}
</div>
))
) : (
<p>No timeline available</p>
)}
</div>

</div>
)}
</>
)}

{/* ================= RAGGING ================= */}
{page === "RAGGING" && (
<>
<h3>Ragging Complaints</h3>

{!selected && ragging.map(c=>(
<div key={c._id} className="ragging-card" onClick={()=>setSelected(c)}>
<p>{(c.complaintText || "").slice(0,120)}...</p>
<small>{c.adminReviewed ? "Reviewed" : "Pending Review"}</small>
</div>
))}

{selected && (
<div className="admin-detail">

<button onClick={()=>setSelected(null)}>⬅ Back</button>

<div className="detail-text">{selected.complaintText || ""}</div>

{Array.isArray(selected.images) && selected.images.length > 0 && (
<>
<h4>Ragging Evidence Images</h4>
<div className="image-grid">
{selected.images.map((img,i)=>(
<img
  key={i}
  src={normalizeImage(img)}
  onClick={()=>setPreviewImg(normalizeImage(img))}
/>
))}
</div>
</>
)}

<textarea
placeholder="Admin remark..."
value={remark}
onChange={e=>setRemark(e.target.value)}
/>

<div className="admin-action-box">
{!selected.adminReviewed && (
<button className="review-btn" onClick={()=>markReviewed(selected._id)}>
Mark Reviewed
</button>
)}

<button className="remark-btn" onClick={saveRemark}>
Save Remark
</button>
</div>

</div>
)}
</>
)}

{/* ================= OVERDUE ================= */}
{page === "OVERDUE" && (
<>
<h3>Overdue Complaints</h3>

{overdue.map(c=>(
<div key={c._id}
  className="admin-card danger"
  onClick={()=>{setSelected(c);setPage("NORMAL")}}
>
<b>{c.category}</b> — {c.status}
<p>{(c.complaintText || "").slice(0,120)}...</p>
</div>
))}

{overdue.length === 0 && <p>No overdue complaints</p>}
</>
)}

        </div>
      </div>

      {previewImg && (
        <div className="image-modal" onClick={()=>setPreviewImg(null)}>
          <img src={previewImg}/>
        </div>
      )}

    </div>
  );
}

export default AdminDashboard;
