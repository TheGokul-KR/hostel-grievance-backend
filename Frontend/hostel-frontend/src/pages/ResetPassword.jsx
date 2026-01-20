import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/auth.css";

function ResetPassword() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const identifier =
    state?.identifier || sessionStorage.getItem("reset_identifier");

  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!identifier) navigate("/forgot-password");
  }, [identifier, navigate]);

  const handleReset = async (e) => {
    e.preventDefault();
    setMsg("");
    setStatus("");

    if (!otp || !password) {
      setMsg("All fields are required");
      setStatus("error");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/reset-password", {
        identifier: identifier.trim(),
        otp,
        newPassword: password,
        role: "Student" // unchanged
      });

      setMsg(res.data.message || "Password reset successful");
      setStatus("success");

      sessionStorage.removeItem("reset_identifier");

      setTimeout(() => navigate("/"), 1500);

    } catch (err) {
      setMsg(err.response?.data?.message || "Reset failed");
      setStatus("error");
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

        <h3 className="auth-title">Reset Password</h3>

        {msg && <div className={`auth-msg ${status}`}>{msg}</div>}

        <form onSubmit={handleReset} className="auth-form">

          <div className="input-group">
            <input
              placeholder=" "
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            />
            <label>OTP</label>
          </div>

          <div className="input-group">
            <input
              placeholder=" "
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <label>New Password</label>
          </div>

          <button className="auth-btn" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>

        </form>

      </div>
    </div>
  );
}

export default ResetPassword;
