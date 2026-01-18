import { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import "../styles/adminManage.css";

function AdminManageStudents() {
  const [students, setStudents] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    regNo: "",
    name: "",
    email: "",
    roomNumber: ""
  });

  const navigate = useNavigate();
  const role = localStorage.getItem("role")?.toLowerCase();

  // 🔒 AUTH GUARD
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || role !== "admin") {
      navigate("/", { replace: true });
    }
  }, [navigate, role]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/students");
      setStudents(Array.isArray(res.data) ? res.data : []);
    } finally {
      setLoading(false);
    }
  };

  const fetchComplaints = async () => {
    const res = await api.get("/complaints/admin/all");
    setComplaints(Array.isArray(res.data) ? res.data : []);
  };

  useEffect(() => {
    fetchStudents();
    fetchComplaints();
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addStudent = async e => {
    e.preventDefault();

    await api.post("/admin/students", form);

    setForm({
      regNo: "",
      name: "",
      email: "",
      roomNumber: ""
    });

    fetchStudents();
  };

  const deactivate = async id => {
    if (!window.confirm("Deactivate this student?")) return;
    await api.patch(`/admin/students/${id}/deactivate`);
    fetchStudents();
  };

  const reactivate = async id => {
    await api.patch(`/admin/students/${id}/reactivate`);
    fetchStudents();
  };

  const getStats = regNo => {
    const list = complaints.filter(c => c.studentRegNo === regNo);
    return {
      total: list.length,
      completed: list.filter(c => c.status === "Completed").length,
      pending: list.filter(c => c.status !== "Completed").length
    };
  };

  const filtered = students.filter(s =>
    (s.name + s.regNo + s.email + s.roomNumber)
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="admin-manage-bg">
      <div className="admin-manage-card">

        <button className="back-btn" onClick={() => navigate("/admin")}>
          ← Back to Dashboard
        </button>

        <h2>Manage Students</h2>

        {/* ADD FORM */}
        <form className="admin-form" onSubmit={addStudent}>
          <input name="regNo" placeholder="Register No" value={form.regNo} onChange={handleChange} required />
          <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
          <input name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
          <input name="roomNumber" placeholder="Room Number" value={form.roomNumber} onChange={handleChange} required />
          <button type="submit">Add Student</button>
        </form>

        {/* SEARCH */}
        <input
          className="admin-search"
          placeholder="Search students..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {loading && <p>Loading students...</p>}

        {/* LIST */}
        <table className="admin-table">
          <thead>
            <tr>
              <th>Reg No</th>
              <th>Name</th>
              <th>Email</th>
              <th>Room</th>
              <th>Account</th>
              <th>Status</th>
              <th>Complaints</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map(s => {
              const stats = getStats(s.regNo);

              return (
                <tr key={s._id}>
                  <td>{s.regNo}</td>
                  <td>{s.name}</td>
                  <td>{s.email}</td>
                  <td>{s.roomNumber}</td>

                  {/* ACCOUNT CREATED */}
                  <td>
                    {s.userExists ? "Created" : "Not Created"}
                  </td>

                  {/* ACCOUNT ACTIVE */}
                  <td className={s.userActive ? "status-active" : "status-inactive"}>
                    {s.userActive ? "Active" : "Inactive"}
                  </td>

                  <td>
                    <div className="stats-box">
                      Total: {stats.total}<br/>
                      Completed: {stats.completed}<br/>
                      Pending: {stats.pending}
                    </div>
                  </td>

                  <td>
                    {s.userActive ? (
                      <button className="danger" onClick={() => deactivate(s._id)}>
                        Deactivate
                      </button>
                    ) : (
                      <button className="success" onClick={() => reactivate(s._id)}>
                        Reactivate
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && !loading && <p>No students found.</p>}

      </div>
    </div>
  );
}

export default AdminManageStudents;
