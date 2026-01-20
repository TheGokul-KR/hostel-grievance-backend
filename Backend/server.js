const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

require("./db");

const app = express();

// ================= PROXY SUPPORT =================
// Required for Render / Railway behind proxy
app.set("trust proxy", 1);

// ================= MIDDLEWARE =================
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= UPLOADS DIRECTORY CHECK =================
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// serve uploaded images
app.use("/uploads", express.static(uploadDir));

// ================= HOME =================
app.get("/", (req, res) => {
  res.send("Hostel Complaint Tracker Backend is running");
});

// ================= ROUTES =================
app.use("/api/auth", require("./routes/auth"));
app.use("/api/complaints", require("./routes/complaint"));
app.use("/api/notifications", require("./routes/Notification"));
app.use("/api/notices", require("./routes/notice"));
app.use("/api/admin", require("./routes/adminRoutes"));

// ================= AUTO COMPLETE JOB =================
const autoCompleteComplaints = require("./jobs/autoCompleteComplaints");

// run once on server start
autoCompleteComplaints().catch(err =>
  console.error("Auto job startup error:", err.message)
);

// run every 1 hour
setInterval(() => {
  autoCompleteComplaints().catch(err =>
    console.error("Auto job interval error:", err.message)
  );
}, 60 * 60 * 1000);

// ================= 404 HANDLER =================
app.use((req, res) => {
  res.status(404).json({ message: "API route not found" });
});

// ================= GLOBAL ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err.message);
  res.status(500).json({
    message: err.message || "Internal server error"
  });
});

// ================= SERVER =================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
