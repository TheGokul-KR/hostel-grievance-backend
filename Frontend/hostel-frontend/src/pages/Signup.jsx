import { useState, useEffect } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";

function Signup() {
  const navigate = useNavigate();

  const [role, setRole] = useState("Student"); // Student | Technician

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);

  const [msg, setMsg] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const [timer, setTimer] = useState(0);

  // ================= PASSWORD STRENGTH =================
  const passwordStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strength = passwordStrength();

  // ================= OTP TIMER =================
  useEffect(() => {
    if (timer === 0) return;
    const i = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(i);
  }, [timer]);

  // ================= SEND OTP =================
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setMsg("");
    setStatus("");

    if (!identifier || !password || !confirm) {
      setMsg("All fields are required");
      setStatus("error");
      return;
    }

    if (password !== confirm) {
      setMsg("Passwords do not match");
      setStatus("error");
      return;
    }

    try {
      setLoading(true);

      const endpoint =
        role === "Student"
          ? "/auth/student-signup"
          : "/auth/technician-signup";

      const payload =
        role === "Student"
          ? { regNo: identifier, password }
          : { techId: identifier, password };

      const res = await api.post(endpoint, payload);

      setMsg(res.data.message || "OTP sent");
      setStatus("success");
      setStep(2);
      setTimer(30);

    } catch (err) {
      setMsg(err.response?.data?.message || "OTP send failed");
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  // ================= VERIFY OTP =================
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setMsg("");
    setStatus("");

    if (!otp) {
      setMsg("Enter OTP");
      setStatus("error");
      return;
    }

    try {
      setLoading(true);

      const endpoint =
        role === "Student"
          ? "/auth/student-verify-otp"
          : "/auth/technician-verify-otp";

      const payload =
        role === "Student"
          ? { regNo: identifier, otp, password }
          : { techId: identifier, otp, password };

      const res = await api.post(endpoint, payload);

      setMsg(res.data.message || "Account created");
      setStatus("success");
      setStep(3);

      setTimeout(() => navigate("/"), 1600);

    } catch (err) {
      setMsg(err.response?.data?.message || "OTP verification failed");
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  // ================= RESEND OTP =================
  const resendOTP = async () => {
    if (timer > 0) return;

    try {
      const endpoint =
        role === "Student"
          ? "/auth/student-signup"
          : "/auth/technician-signup";

      const payload =
        role === "Student"
          ? { regNo: identifier, password }
          : { techId: identifier, password };

      await api.post(endpoint, payload);

      setTimer(30);
      setMsg("OTP resent");
      setStatus("success");
    } catch {
      setMsg("OTP resend failed");
      setStatus("error");
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

        <h3 className="auth-title">
          {step === 1 && "Account Registration"}
          {step === 2 && "Verify OTP"}
          {step === 3 && "Account Created"}
        </h3>

        {msg && <div className="auth-msg">{msg}</div>}

        {/* STEP 1 */}
        {step === 1 && (
          <form onSubmit={handleSendOTP} className="auth-form">

            <select
              className="role-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option>Student</option>
              <option>Technician</option>
            </select>

            <div className="input-group">
              <input
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value.toUpperCase())}
              />
              <label>
                {role === "Student" ? "Register Number" : "Technician ID"}
              </label>
            </div>

            <div className="input-group">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <label>Password</label>
            </div>

            <div style={{ fontSize: 11, color: "#c7d2fe" }}>
              Strength:
              <span style={{ color:
                strength <= 1 ? "#ef4444" :
                strength === 2 ? "#facc15" :
                "#22c55e"
              }}>
                {" "}
                {strength <= 1 ? "Weak" : strength === 2 ? "Medium" : "Strong"}
              </span>
            </div>

            <div className="input-group">
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              <label>Confirm Password</label>
            </div>

            <button className="auth-btn" disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="auth-form">

            <div className="input-group">
              <input
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <label>Enter OTP</label>
            </div>

            <button className="auth-btn" disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <div style={{ textAlign: "center", marginTop: 10, fontSize: 12 }}>
              {timer > 0 ? (
                <span>Resend OTP in {timer}s</span>
              ) : (
                <span
                  onClick={resendOTP}
                  style={{ color: "#38bdf8", cursor: "pointer" }}
                >
                  Resend OTP
                </span>
              )}
            </div>

          </form>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div style={{ textAlign: "center", color: "#22c55e", fontWeight: 700 }}>
            🎉 Account created successfully
            <p style={{ fontSize: 13, color: "#c7d2fe", marginTop: 10 }}>
              Redirecting to login…
            </p>
          </div>
        )}

        {step !== 3 && (
          <div className="auth-links">
            <span onClick={() => navigate("/")}>Already have account?</span>
          </div>
        )}

      </div>
    </div>
  );
}

export default Signup;
