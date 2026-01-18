import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/StudentRaggingComplaint.css";

function StudentRaggingComplaint() {
  const navigate = useNavigate();

  const [complaintText, setComplaintText] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const rawRole = localStorage.getItem("role");
  const role = rawRole ? rawRole.toLowerCase() : null;

  // 🔒 AUTH GUARD
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || role !== "student") {
      navigate("/", { replace: true });
    }
  }, [navigate, role]);

  // cleanup previews
  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.preview));
    };
  }, [images]);

  // ================= IMAGE =================
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length + images.length > 5) {
      alert("Maximum 5 images allowed");
      return;
    }

    const withPreview = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setImages(prev => [...prev, ...withPreview]);
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(images[index].preview);
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!complaintText.trim()) {
      alert("Please describe the incident.");
      return;
    }

    if (!roomNumber.trim()) {
      alert("Room number is required for ragging complaint.");
      return;
    }

    const formData = new FormData();
    formData.append("complaintText", complaintText.trim());
    formData.append("category", "Ragging");
    formData.append("roomNumber", roomNumber.trim());
    formData.append("isAnonymous", isAnonymous ? "true" : "false");
    formData.append("isRagging", "true");

    images.forEach(img => formData.append("images", img.file));

    setLoading(true);

    try {
      await api.post("/complaints", formData);

      alert("Your grievance has been securely recorded.");
      navigate("/student/history");
    } catch (err) {
      console.error("RAGGING SUBMIT ERROR:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ragging-bg">
      <div className="ragging-card">

        <h2>Ragging Grievance Submission</h2>

        <p className="ragging-info">
          This report will be handled with strict confidentiality and reviewed
          with the highest priority by authorities.
        </p>

        <form onSubmit={handleSubmit}>

          <input
            type="text"
            className="input-box"
            placeholder="Enter room number involved"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            required
          />

          <textarea
            className="input-box"
            placeholder="Describe the incident clearly with date, location and people involved..."
            value={complaintText}
            onChange={(e) => setComplaintText(e.target.value)}
            required
          />

          <div className="anonymous-box">
            <label>
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={() => setIsAnonymous(!isAnonymous)}
              />
              Keep my identity confidential
            </label>
          </div>

          <div className="image-upload-box">
            <label className="upload-label">
              📷 Upload Evidence (optional, max 5)
              <input
                type="file"
                multiple
                accept="image/*"
                hidden
                onChange={handleImageChange}
              />
            </label>

            {images.length > 0 && (
              <div className="preview-grid">
                {images.map((img, i) => (
                  <div key={i} className="preview-card">
                    <img src={img.preview} alt="preview" />
                    <span
                      className="remove-preview"
                      onClick={() => removeImage(i)}
                    >
                      ✖
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="submit-btn" disabled={loading}>
            {loading ? "Submitting..." : "Submit Grievance Securely"}
          </button>

          <button
            type="button"
            className="back-btn"
            onClick={() => navigate("/student")}
          >
            Return to Dashboard
          </button>

        </form>

      </div>
    </div>
  );
}

export default StudentRaggingComplaint;
