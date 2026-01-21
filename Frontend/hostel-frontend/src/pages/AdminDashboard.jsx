import { useEffect, useState, useMemo, useRef } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import "../styles/admin.css";

const IMAGE_BASE =
  import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, "") + "/uploads/";

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

  const navigate = useNavigate();
  const role = localStorage.getItem("role")?.toLowerCase();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || role !== "admin") {
      navigate("/", { replace: true });
    }
  }, [navigate, role]);

  const fetchData = async () => {
    try {
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
    } catch {
      setAll([]);
      setRagging([]);
    }
  };

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
    <div className={`admin-shell ${criticalMode ? "critical" : ""}`}>

      {/* ===== TOP BAR ===== */}
      <div className="admin-topbar">
        <div className="admin-title">Hostel Administration Panel</div>
        <button className="admin-btn logout" onClick={logout}>Logout</button>
      </div>

      {/* ===== KPI BAR ===== */}
      <div className="admin-kpi">
        <div className="kpi-card"><b>{pendingCount}</b><span>Active</span></div>
        <div className="kpi-card"><b>{completedCount}</b><span>Completed</span></div>
        <div className="kpi-card"><b>{avgResolution}</b><span>Avg Time</span></div>
        <div className="kpi-card danger"><b>{ragging.length}</b><span>Ragging</span></div>
        <div className="kpi-card danger"><b>{overdue.length}</b><span>Overdue</span></div>
      </div>

      {criticalMode && (
        <div className="admin-alert">
          ⚠ Critical operational risk detected. Immediate action required.
        </div>
      )}

      <div className="admin-main">

        {/* ===== SIDE NAV ===== */}
        <div className="admin-nav">
          <button onClick={() => { setPage("NORMAL"); setSelected(null); }}>Complaints</button>
          <button onClick={() => { setPage("RAGGING"); setSelected(null); }}>Ragging</button>
          <button onClick={() => { setPage("OVERDUE"); setSelected(null); }}>Overdue</button>

          <hr/>

          <button onClick={() => navigate("/admin/students")}>Students</button>
          <button onClick={() => navigate("/admin/technicians")}>Technicians</button>
          <button onClick={() => navigate("/admin/notices")}>Notices</button>
        </div>

        {/* ===== CONTENT ===== */}
        <div className="admin-panel">

{/* ================= NORMAL ================= */}
{page === "NORMAL" && (
<>
<h3 className="panel-title">All Complaints</h3>

<input
  className="admin-search"
  placeholder="Search complaints..."
  value={search}
  onChange={e => setSearch(e.target.value)}
/>

{!selected && filteredAll.map(c => (
<div key={c._id} className="list-card" onClick={() => {
  selectedIdRef.current = c._id;
  setSelected(c);
}}>
<div className="list-head">
  <span>{c.category}</span>
  <span className="status">{c.status}</span>
</div>
<p>{(c.complaintText || "").slice(0,120)}...</p>
</div>
))}

{selected && (
<div className="detail-panel">

<button className="back-btn" onClick={() => setSelected(null)}>Back</button>

<div className="journey-bar">
  <div className={getStageClass("Pending")}>Submitted</div>
  <div className={getStageClass("In Progress")}>In Progress</div>
  <div className={getStageClass("Resolved")}>Resolved</div>
  <div className={getStageClass("Completed")}>Completed</div>
</div>

<div className="detail-grid">
  <div><b>Status</b><span>{selected.status}</span></div>
  <div><b>Room</b><span>{selected.roomNumber}</span></div>
  <div><b>Category</b><span>{selected.category}</span></div>
  <div><b>Technician</b><span>{selected.technicianNameSnapshot || "Auto"}</span></div>
</div>

<div className="detail-text">{selected.complaintText || ""}</div>

{Array.isArray(selected.images) && (
<div className="image-grid">
{selected.images.map((img,i)=>(
<img key={i} src={normalizeImage(img)} alt="" onClick={()=>setPreviewImg(normalizeImage(img))}/>
))}
</div>
)}

</div>
)}
</>
)}

{/* ================= RAGGING ================= */}
{page === "RAGGING" && (
<>
<h3 className="panel-title">Ragging Complaints</h3>

{!selected && ragging.map(c=>(
<div key={c._id} className="list-card danger" onClick={()=>setSelected(c)}>
<p>{(c.complaintText || "").slice(0,120)}...</p>
<span>{c.adminReviewed ? "Reviewed" : "Pending"}</span>
</div>
))}

{selected && (
<div className="detail-panel">

<button className="back-btn" onClick={()=>setSelected(null)}>Back</button>

<div className="detail-text">{selected.complaintText || ""}</div>

<textarea
className="admin-remark"
placeholder="Admin remark..."
value={remark}
onChange={e=>setRemark(e.target.value)}
/>

<div className="action-row">
{!selected.adminReviewed && (
<button className="admin-btn danger" onClick={()=>markReviewed(selected._id)}>
Mark Reviewed
</button>
)}
<button className="admin-btn" onClick={saveRemark}>
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
<h3 className="panel-title">Overdue Complaints</h3>

{overdue.map(c=>(
<div key={c._id} className="list-card danger" onClick={()=>{setSelected(c);setPage("NORMAL")}}>
<b>{c.category}</b> — {c.status}
</div>
))}

{overdue.length === 0 && <p>No overdue complaints</p>}
</>
)}

        </div>
      </div>

      {previewImg && (
        <div className="image-modal" onClick={()=>setPreviewImg(null)}>
          <img src={previewImg} alt="preview"/>
        </div>
      )}

    </div>
  );
}

export default AdminDashboard;
