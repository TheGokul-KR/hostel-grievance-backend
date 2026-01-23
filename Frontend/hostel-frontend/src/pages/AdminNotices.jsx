import { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import "../styles/admin.css";

function AdminNotices() {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const navigate = useNavigate();
  const role = localStorage.getItem("role")?.toLowerCase();

  const emptyForm = {
    _id: null,
    title: "",
    content: "",
    category: "Hostel",
    priority: "Normal",
    pinned: false,
    expiresAt: ""
  };

  // 🔐 AUTH GUARD
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || role !== "admin") {
      navigate("/", { replace: true });
    }
  }, [navigate, role]);

  useEffect(() => {
    load();
  }, []);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/notices");
      const data = Array.isArray(res.data) ? res.data : [];

      data.sort((a, b) => {
        if (a.pinned !== b.pinned) return b.pinned - a.pinned;
        if (a.priority !== b.priority)
          return ["Low", "Normal", "High"].indexOf(b.priority) -
                 ["Low", "Normal", "High"].indexOf(a.priority);
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      setList(data);
    } catch {
      setList([]);
      showToast("error", "Failed to load notices");
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => setForm({ ...emptyForm });
  const openEdit = n => setForm({ ...n });
  const closeForm = () => setForm(null);

  const saveNotice = async () => {
    if (!form.title || !form.content) {
      showToast("error", "Title and content are required");
      return;
    }

    const payload = {
      title: form.title,
      content: form.content,
      priority: form.priority,
      pinned: form.pinned,
      expiresAt: form.expiresAt || null
    };

    try {
      if (form._id) {
        await api.patch(`/notices/${form._id}`, payload);
        showToast("success", "Notice updated successfully");
      } else {
        await api.post("/notices", payload);
        showToast("success", "Notice created successfully");
      }

      closeForm();
      load();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Save failed");
    }
  };

  const remove = async id => {
    if (!window.confirm("Are you sure you want to delete this notice?")) return;
    try {
      await api.delete(`/notices/${id}`);
      showToast("success", "Notice deleted");
      load();
    } catch {
      showToast("error", "Delete failed");
    }
  };

  const togglePin = async n => {
    try {
      await api.patch(`/notices/${n._id}`, { pinned: !n.pinned });
      showToast("success", n.pinned ? "Notice unpinned" : "Notice pinned");
      load();
    } catch {
      showToast("error", "Pin update failed");
    }
  };

  const filtered = list.filter(n =>
    (n.title + n.content)
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="admin-bg notice-bg">

      {/* 🔔 TOAST */}
      {toast && (
        <div className={`toast ${toast.type} slide-in`}>
          {toast.message}
        </div>
      )}

      <div className="admin-top">
        <h2>📢 Notice Management</h2>
        <div className="admin-top-actions">
          <button onClick={() => navigate("/admin")} className="admin-btn">
            ⬅ Dashboard
          </button>
          <button onClick={openNew} className="admin-btn primary pulse-btn">
            ➕ New Notice
          </button>
        </div>
      </div>

      <input
        className="admin-search"
        placeholder="Search notices by title or content..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className="admin-content notice-grid">

        {loading && (
          <div className="loading-box">Loading notices...</div>
        )}

        {!loading && filtered.map(n => (
          <div
            key={n._id}
            className={`notice-card animated-card 
              priority-${n.priority.toLowerCase()}
              ${n.pinned ? "pinned" : ""}`}
          >
            <div className="notice-header">
              <h4>{n.title}</h4>
              {n.pinned && <span className="pin-badge">📌 Pinned</span>}
            </div>

            <p className="notice-body">{n.content}</p>

            <div className="notice-meta">
              <span>Priority: {n.priority}</span>
              <span>{new Date(n.createdAt).toLocaleString()}</span>
            </div>

            {n.expiresAt && (
              <div className="expiry">
                ⏳ Expires: {new Date(n.expiresAt).toLocaleDateString()}
              </div>
            )}

            <div className="admin-action-box">
              <button onClick={() => openEdit(n)}>✏ Edit</button>
              <button onClick={() => togglePin(n)}>
                {n.pinned ? "Unpin" : "Pin"}
              </button>
              <button className="danger" onClick={() => remove(n._id)}>
                🗑 Delete
              </button>
            </div>
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <p>No notices found</p>
            <button className="admin-btn" onClick={openNew}>
              Create first notice
            </button>
          </div>
        )}
      </div>

      {/* ================= MODAL ================= */}
      {form && (
        <div className="modal-bg fade-in" onClick={closeForm}>
          <div
            className="modal-box zoom-in"
            onClick={e => e.stopPropagation()}
          >
            <h3>{form._id ? "Edit Notice" : "Create Notice"}</h3>

            <input
              placeholder="Notice title"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />

            <textarea
              placeholder="Notice content"
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
            />

            <select
              value={form.priority}
              onChange={e => setForm({ ...form, priority: e.target.value })}
            >
              <option>Low</option>
              <option>Normal</option>
              <option>High</option>
            </select>

            <label className="pin-check">
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={e => setForm({ ...form, pinned: e.target.checked })}
              />
              Pin this notice
            </label>

            <input
              type="date"
              value={form.expiresAt || ""}
              onChange={e => setForm({ ...form, expiresAt: e.target.value })}
            />

            <div className="admin-action-box">
              <button className="primary" onClick={saveNotice}>
                💾 Save
              </button>
              <button onClick={closeForm}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminNotices;
