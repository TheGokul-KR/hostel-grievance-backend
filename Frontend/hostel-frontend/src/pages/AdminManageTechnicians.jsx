import { useEffect, useState, useRef } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import "../styles/adminManage.css";

const DEPARTMENTS = [
  "cleaning",
  "electrical",
  "plumbing",
  "furniture",
  "water",
  "others"
];

function AdminManageTechnicians() {
  const [techs, setTechs] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const toastRef = useRef(null);

  const [form, setForm] = useState({
    techId: "",
    name: "",
    email: "",
    department: "",
    block: ""
  });

  const navigate = useNavigate();
  const role = localStorage.getItem("role")?.toLowerCase();

  // 🔒 AUTH GUARD
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || role !== "admin") navigate("/", { replace: true });
  }, [navigate, role]);

  const showToast = msg => {
    setToast(msg);
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(""), 2000);
  };

  const fetchTechs = async () => {
    try {
      const res = await api.get("/admin/technicians");
      setTechs(Array.isArray(res.data) ? res.data : []);
    } catch {
      setTechs([]);
    }
  };

  const fetchComplaints = async () => {
    try {
      const res = await api.get("/complaints/admin/all");
      setComplaints(Array.isArray(res.data) ? res.data : []);
    } catch {
      setComplaints([]);
    }
  };

  useEffect(() => {
    fetchTechs();
    fetchComplaints();
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addTechnician = async e => {
    e.preventDefault();

    if (!form.department) {
      showToast("Select department");
      return;
    }

    try {
      await api.post("/admin/technicians", form);

      setForm({
        techId: "",
        name: "",
        email: "",
        department: "",
        block: ""
      });

      showToast("Technician added successfully");
      fetchTechs();
    } catch (err) {
      showToast(err.response?.data?.message || "Add failed");
    }
  };

  const deactivate = async id => {
    if (!window.confirm("Deactivate technician?")) return;

    try {
      await api.patch(`/admin/technicians/${id}/deactivate`);
      showToast("Technician deactivated");
      fetchTechs();
    } catch {
      showToast("Deactivate failed");
    }
  };

  const reactivate = async id => {
    try {
      await api.patch(`/admin/technicians/${id}/reactivate`);
      showToast("Technician reactivated");
      fetchTechs();
    } catch {
      showToast("Reactivate failed");
    }
  };

  const getStats = tech => {
    const list = complaints.filter(
      c => String(c.assignedTechnician) === String(tech._id)
    );

    return {
      total: list.length,
      resolved: list.filter(c => c.status === "Completed").length,
      pending: list.filter(c => c.status !== "Completed").length
    };
  };

  const filtered = techs.filter(t =>
    (t.name + t.techId + t.email + t.department + t.block)
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="admin-manage-bg">
      <div className="admin-manage-card animated-fade">

        <button className="back-btn" onClick={() => navigate("/admin")}>
          ← Back
        </button>

        <h2>Manage Technicians</h2>

        {/* ADD FORM */}
        <form className="admin-form glass" onSubmit={addTechnician}>
          <input name="techId" placeholder="Technician ID" value={form.techId} onChange={handleChange} required />
          <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
          <input name="email" placeholder="Email" value={form.email} onChange={handleChange} required />

          <select name="department" value={form.department} onChange={handleChange} required>
            <option value="">Select Department</option>
            {DEPARTMENTS.map(d => (
              <option key={d} value={d}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </option>
            ))}
          </select>

          <input name="block" placeholder="Block" value={form.block} onChange={handleChange} />

          <button type="submit" className="primary-btn">Add Technician</button>
        </form>

        {/* SEARCH */}
        <input
          className="admin-search"
          placeholder="Search technicians..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {/* LIST */}
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Dept</th>
                <th>Block</th>
                <th>Account</th>
                <th>Status</th>
                <th>Performance</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map(t => {
                const stats = getStats(t);
                return (
                  <tr key={t._id} className="row-hover">
                    <td>{t.techId}</td>
                    <td>{t.name}</td>
                    <td>{t.email}</td>
                    <td>{t.department}</td>
                    <td>{t.block || "-"}</td>

                    <td>
                      {t.userExists
                        ? (t.userActive ? "Active" : "Disabled")
                        : "Not Registered"}
                    </td>

                    <td className={t.activated ? "status-active" : "status-inactive"}>
                      {t.activated ? "Active" : "Inactive"}
                    </td>

                    <td>
                      <div className="stats-box">
                        Total: {stats.total}<br/>
                        Resolved: {stats.resolved}<br/>
                        Pending: {stats.pending}
                      </div>
                    </td>

                    <td>
                      {t.activated ? (
                        <button className="danger" onClick={() => deactivate(t._id)}>
                          Deactivate
                        </button>
                      ) : (
                        <button className="success" onClick={() => reactivate(t._id)}>
                          Reactivate
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && <p>No technicians found.</p>}

      </div>

      {toast && <div className="toast-msg">{toast}</div>}
    </div>
  );
}

export default AdminManageTechnicians;
