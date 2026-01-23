import { useEffect, useState, useMemo, useRef } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import "../styles/admin.css";

const IMAGE_BASE =
  import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, "") + "/uploads/";

const normalizeImage = img => {
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

  /* ================= AUTH ================= */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || role !== "admin") navigate("/", { replace: true });
  }, [navigate, role]);

  /* ================= DATA ================= */
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
        setSelected(found || null);
      }
    } catch {
      setAll([]);
      setRagging([]);
    }
  };

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 5000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (selected) setRemark(selected.adminRemark || "");
  }, [selected]);

  /* ================= ACTIONS ================= */
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
    fetchData();
  };

  /* ================= METRICS ================= */
  const completedCount = all.filter(c => c.status === "Completed").length;
  const pendingCount = all.filter(c => c.status !== "Completed").length;

  const avgResolution =
    completedCount === 0
      ? "N/A"
      : Math.round(
          all
            .filter(c => c.status === "Completed")
            .reduce((a, b) => a + (b.resolutionHours || 24), 0) /
            completedCount
        ) + "h";

  const criticalMode = ragging.length > 0 || overdue.length > 0;

  return (
    <div className={`admin-dashboard ${criticalMode ? "critical" : ""}`}>

      {/* ================= HEADER ================= */}
      <header className="admin-header">
        <h1>Admin Control Center</h1>
        <button className="logout-btn" onClick={logout}>Logout</button>
      </header>

      {/* ================= KPIs ================= */}
      <section className="dashboard-kpis">
        <div className="kpi active"><b>{pendingCount}</b><span>Active</span></div>
        <div className="kpi success"><b>{completedCount}</b><span>Completed</span></div>
        <div className="kpi info"><b>{avgResolution}</b><span>Avg Time</span></div>
        <div className="kpi danger"><b>{ragging.length}</b><span>Ragging</span></div>
        <div className="kpi danger"><b>{overdue.length}</b><span>Overdue</span></div>
      </section>

      {/* ================= TABS ================= */}
      <nav className="dashboard-tabs">
        <button onClick={() => { setPage("NORMAL"); setSelected(null); }}>Complaints</button>
        <button onClick={() => { setPage("RAGGING"); setSelected(null); }}>Ragging</button>
        <button onClick={() => { setPage("OVERDUE"); setSelected(null); }}>Overdue</button>

        <span className="spacer" />

        <button onClick={() => navigate("/admin/students")}>Students</button>
        <button onClick={() => navigate("/admin/technicians")}>Technicians</button>
        <button onClick={() => navigate("/admin/notices")}>Notices</button>
      </nav>

      {/* ================= MAIN ================= */}
      <main className="dashboard-main">

        {/* ===== LIST ===== */}
        <section className="dashboard-list">

          {page === "NORMAL" && (
            <>
              <input
                className="search-input"
                placeholder="Search complaints..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />

              {filteredAll.map(c => (
                <div
                  key={c._id}
                  className="list-item"
                  onClick={() => {
                    selectedIdRef.current = c._id;
                    setSelected(c);
                  }}
                >
                  <div className="list-top">
                    <span>{c.category}</span>
                    <span>{c.status}</span>
                  </div>
                  <p>{(c.complaintText || "").slice(0, 100)}...</p>
                </div>
              ))}
            </>
          )}

          {page === "RAGGING" &&
            ragging.map(c => (
              <div
                key={c._id}
                className="list-item danger"
                onClick={() => setSelected(c)}
              >
                <p>{(c.complaintText || "").slice(0, 100)}...</p>
                <small>{c.adminReviewed ? "Reviewed" : "Pending"}</small>
              </div>
            ))}

          {page === "OVERDUE" &&
            overdue.map(c => (
              <div
                key={c._id}
                className="list-item danger"
                onClick={() => {
                  setSelected(c);
                  setPage("NORMAL");
                }}
              >
                <b>{c.category}</b> — {c.status}
              </div>
            ))}
        </section>

        {/* ===== DETAILS ===== */}
        <section className="dashboard-detail">
          {!selected && <p className="empty">Select an item to view details</p>}

          {selected && (
            <>
              <button className="back-btn" onClick={() => setSelected(null)}>
                ← Back
              </button>

              <h3>{selected.category}</h3>
              <p>{selected.complaintText}</p>

              {Array.isArray(selected.images) && (
                <div className="image-grid">
                  {selected.images.map((img, i) => (
                    <img
                      key={i}
                      src={normalizeImage(img)}
                      alt=""
                      onClick={() => setPreviewImg(normalizeImage(img))}
                    />
                  ))}
                </div>
              )}

              {page === "RAGGING" && (
                <>
                  <textarea
                    value={remark}
                    placeholder="Admin remark..."
                    onChange={e => setRemark(e.target.value)}
                  />
                  <div className="action-row">
                    {!selected.adminReviewed && (
                      <button onClick={() => markReviewed(selected._id)}>
                        Mark Reviewed
                      </button>
                    )}
                    <button onClick={saveRemark}>Save Remark</button>
                  </div>
                </>
              )}
            </>
          )}
        </section>
      </main>

      {previewImg && (
        <div className="image-modal" onClick={() => setPreviewImg(null)}>
          <img src={previewImg} alt="preview" />
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
