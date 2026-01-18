import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/auth.css";

function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(""); // success | error | ""

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMsg("");
    setStatus("");

    try {
      setLoading(true);

      const res = await api.post("/auth/login", {
        identifier: identifier.trim(),
        password
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("regNo", res.data.regNo || "");
      localStorage.setItem("techId", res.data.techId || "");
      localStorage.setItem("name", res.data.name || "");
      localStorage.setItem("roomNumber", res.data.roomNumber || "");

      setStatus("success");
      setMsg("Authentication successful");

      const role = res.data.role?.toLowerCase();

      setTimeout(() => {
        if (role === "student") navigate("/student", { replace: true });
        else if (role === "technician") navigate("/technician", { replace: true });
        else if (role === "Admin" || role === "administrator")
          navigate("/admin", { replace: true });
        else setMsg("Unknown role: " + res.data.role);
      }, 600);

    } catch (err) {
      setStatus("error");
      setMsg(err.response?.data?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className={`auth-glass ${status}`}>
<div className="auth-brand">
  <h1 className="brand-title">
    Hostel Grievance <span>&</span> Compliance
  </h1>
  <h2 className="brand-subtitle">
    Management System
  </h2>

</div>

        <h3 className="auth-title">Secure Login</h3>

        {msg && <div className="auth-msg">{msg}</div>}

        <form onSubmit={handleLogin} className="auth-form">

          <div className="input-group">
            <input
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
            <label>Register No / Tech ID / Email</label>
          </div>

          <div className="input-group">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <label>Password</label>

            <span
              className="toggle-pass"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁"}
            </span>
          </div>

          <button className="auth-btn" disabled={loading}>
            {loading ? "Authenticating..." : "Login"}
          </button>

        </form>

        <div className="auth-links">
          <span onClick={() => navigate("/forgot-password")}>
            Forgot password?
          </span>
          <span onClick={() => navigate("/signup")}>
            Create account
          </span>
        </div>

      </div>
    </div>
  );
}

export default Login;
