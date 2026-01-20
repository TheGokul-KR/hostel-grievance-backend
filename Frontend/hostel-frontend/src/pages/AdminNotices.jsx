import { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import "../styles/admin.css";

function AdminNotices() {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(null);

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

  const load = async () => {
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
    }
  };

  const openNew = () => setForm({ ...emptyForm });
  const openEdit = n => setForm({ ...n });
  const closeForm = () => setForm(null);

  const saveNotice = async () => {
    if (!form.title || !form.content) {
      alert("Title and content required");
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
      } else {
        await api.post("/notices", payload);
      }

      closeForm();
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "Save failed");
    }
  };

  const remove = async id => {
    if (!window.confirm("Delete this notice?")) return;
    try {
      await api.delete(`/notices/${id}`);
      load();
    } catch {
      alert("Delete failed");
    }
  };

  const togglePin = async n => {
    try {
      await api.patch(`/notices/${n._id}`, { pinned: !n.pinned });
      load();
    } catch {
      alert("Pin update failed");
    }
  };

  const filtered = list.filter(n =>
    (n.title + n.content)
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="admin-bg notice-bg">

      <div className="admin-top">
        <h2>📢 Notice Board Management</h2>
        <div>
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
        placeholder="Search notices..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className="admin-content notice-grid">

        {filtered.map(n => (
          <div
            key={n._id}
            className={`admin-card notice-card animated-card ${n.priority === "High" ? "danger" : ""}`}
          >
            <div className="notice-head">
              <b>{n.title}</b>
              {n.pinned && <span className="pin-badge">📌 Pinned</span>}
            </div>

            <p className="notice-content">{n.content}</p>

            <small>
              Priority: {n.priority} | {new Date(n.createdAt).toLocaleString()}
            </small>

            {n.expiresAt && (
              <p className="expiry">
                ⏳ Expires: {new Date(n.expiresAt).toLocaleDateString()}
              </p>
            )}

            <div className="admin-action-box">
              <button onClick={() => openEdit(n)}>Edit</button>
              <button onClick={() => togglePin(n)}>
                {n.pinned ? "Unpin" : "Pin"}
              </button>
              <button className="danger" onClick={() => remove(n._id)}>
                Delete
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p style={{ textAlign: "center", marginTop: 40 }}>
            No notices found
          </p>
        )}
      </div>

      {/* ================= MODAL ================= */}
      {form && (
        <div className="modal-bg" onClick={closeForm}>
          <div className="modal-box animated zoom-in" onClick={e => e.stopPropagation()}>

            <h3>{form._id ? "Edit Notice" : "Create Notice"}</h3>

            <input
              placeholder="Title"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />

            <textarea
              placeholder="Content"
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
              <button className="primary" onClick={saveNotice}>Save</button>
              <button onClick={closeForm}>Cancel</button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default AdminNotices;
