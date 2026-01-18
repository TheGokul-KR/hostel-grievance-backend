import { useEffect, useState } from "react";
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

  const [form, setForm] = useState({
    techId: "",
    name: "",
    email: "",
    department: "",
    block: ""
  });

  const navigate = useNavigate();
  const role = localStorage.getItem("role")?.toLowerCase();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || role !== "admin") navigate("/", { replace: true });
  }, [navigate, role]);

  const fetchTechs = async () => {
    const res = await api.get("/admin/technicians");
    setTechs(Array.isArray(res.data) ? res.data : []);
  };

  const fetchComplaints = async () => {
    const res = await api.get("/complaints/admin/all");
    setComplaints(Array.isArray(res.data) ? res.data : []);
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
      alert("Select department");
      return;
    }

    await api.post("/admin/technicians", form);

    setForm({
      techId: "",
      name: "",
      email: "",
      department: "",
      block: ""
    });

    fetchTechs();
  };

  const deactivate = async id => {
    if (!window.confirm("Deactivate technician?")) return;
    await api.patch(`/admin/technicians/${id}/deactivate`);
    fetchTechs();
  };

  const reactivate = async id => {
    await api.patch(`/admin/technicians/${id}/reactivate`);
    fetchTechs();
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
      <div className="admin-manage-card">

        <button className="back-btn" onClick={() => navigate("/admin")}>
          ← Back
        </button>

        <h2>Manage Technicians</h2>

        {/* ADD FORM */}
        <form className="admin-form" onSubmit={addTechnician}>
          <input name="techId" placeholder="Technician ID" value={form.techId} onChange={handleChange} required />
          <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
          <input name="email" placeholder="Email" value={form.email} onChange={handleChange} required />

          {/* 🔥 DEPARTMENT DROPDOWN */}
          <select
            name="department"
            value={form.department}
            onChange={handleChange}
            required
          >
            <option value="">Select Department</option>
            {DEPARTMENTS.map(d => (
              <option key={d} value={d}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </option>
            ))}
          </select>

          <input name="block" placeholder="Block" value={form.block} onChange={handleChange} />

          <button type="submit">Add Technician</button>
        </form>

        {/* SEARCH */}
        <input
          className="admin-search"
          placeholder="Search technicians..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {/* LIST */}
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
                <tr key={t._id}>
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
                    Total:{stats.total}<br/>
                    Resolved:{stats.resolved}<br/>
                    Pending:{stats.pending}
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

        {filtered.length === 0 && <p>No technicians found.</p>}

      </div>
    </div>
  );
}

export default AdminManageTechnicians;
