import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/auth.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setMsg("");
    setStatus("");

    if (!email) {
      setMsg("Email is required");
      setStatus("error");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/forgot-password", {
        email: email.trim().toLowerCase()
      });

      setMsg(res.data.message || "OTP sent successfully");
      setStatus("success");

      setTimeout(() => {
        navigate("/reset-password", { state: { email } });
      }, 1200);

    } catch (err) {
      setMsg(err.response?.data?.message || "OTP send failed");
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

        <h3 className="auth-title">Recover Password</h3>

        {msg && <div className="auth-msg">{msg}</div>}

        <form onSubmit={handleSendOTP} className="auth-form">

          <div className="input-group">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label>Email Address</label>
          </div>

          <button className="auth-btn" disabled={loading}>
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>

        </form>

        <div className="auth-links">
          <span onClick={() => navigate("/")}>Back to login</span>
        </div>

      </div>
    </div>
  );
}

export default ForgotPassword;
