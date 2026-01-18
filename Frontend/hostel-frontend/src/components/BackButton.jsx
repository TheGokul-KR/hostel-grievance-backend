import { useNavigate } from "react-router-dom";

function BackButton({ fallback = "/student" }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <button
      onClick={handleBack}
      style={{
        padding: "8px 16px",
        borderRadius: "8px",
        border: "none",
        background: "#555",
        color: "white",
        fontWeight: "bold",
        cursor: "pointer",
        marginBottom: "15px"
      }}
    >
      ⬅ Back
    </button>
  );
}

export default BackButton;
