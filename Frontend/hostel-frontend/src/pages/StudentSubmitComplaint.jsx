import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import BackButton from "../components/BackButton";
import "../styles/StudentSubmitComplaint.css";

function StudentSubmitComplaint() {
  const navigate = useNavigate();

  const [complaintText, setComplaintText] = useState("");
  const [category, setCategory] = useState("cleaning");
  const [priority, setPriority] = useState("Medium");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  // ADD ONLY
  const [showSuccess, setShowSuccess] = useState(false);

  const roomNumber = localStorage.getItem("roomNumber") || "N/A";

  const rawRole = localStorage.getItem("role");
  const role = rawRole ? rawRole.toLowerCase() : null;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || role !== "student") {
      navigate("/", { replace: true });
    }
  }, [navigate, role]);

  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.preview));
    };
  }, [images]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!complaintText.trim()) {
      alert("Complaint description is required");
      return;
    }

    const formData = new FormData();
    formData.append("complaintText", complaintText.trim());
    formData.append("category", category.toLowerCase());
    formData.append("priority", priority);
    formData.append("roomNumber", roomNumber);
    formData.append("isAnonymous", false);
    formData.append("isRagging", false);

    images.forEach(img => formData.append("images", img.file));

    setLoading(true);

    try {
      await api.post("/complaints", formData);

      // ADD ONLY
      setShowSuccess(true);

      setTimeout(() => {
        navigate("/student/history");
      }, 1800);

    } catch (err) {
      console.error(err.response?.data || err.message);
      alert(err.response?.data?.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="submit-bg">

      {showSuccess && (
        <div className="submit-success-overlay">
          <div className="submit-success-box">
            ✅ Complaint Submitted Successfully
            <p>Redirecting to history...</p>
          </div>
        </div>
      )}

      <div className="submit-card">

        <BackButton fallback="/student" />

        <h2>Submit Complaint</h2>
        <p className="subtitle">
          Room Number: <b>{roomNumber}</b> (auto locked)
        </p>

        <form onSubmit={handleSubmit}>
          <textarea
            className="input-box textarea-big"
            placeholder="Describe your complaint..."
            value={complaintText}
            onChange={(e) => setComplaintText(e.target.value)}
          />

          <select
            className="input-box"
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            <option value="cleaning">Cleaning</option>
            <option value="electrical">Electrical</option>
            <option value="plumbing">Plumbing</option>
            <option value="furniture">Furniture</option>
            <option value="water">Water</option>
            <option value="others">Others</option>
          </select>

          <select
            className="input-box"
            value={priority}
            onChange={e => setPriority(e.target.value)}
          >
            <option value="Low">Low Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="High">High Priority</option>
          </select>

          <div className="image-upload-box">
            <label className="upload-label">
              Upload Images (max 5)
              <input
                type="file"
                multiple
                hidden
                accept="image/*"
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
            {loading ? "Submitting..." : "Submit Complaint"}
          </button>

        </form>
      </div>
    </div>
  );
}

export default StudentSubmitComplaint;
