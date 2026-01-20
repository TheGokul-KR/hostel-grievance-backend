const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ================= UPLOAD ROOT =================
const uploadDir = path.join(__dirname, "../uploads");

// ensure folder exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ================= ALLOWED EXTENSIONS =================
const allowedExt = [".jpg", ".jpeg", ".png", ".webp"];

// ================= STORAGE CONFIG =================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      ext;

    cb(null, uniqueName);
  }
});

// ================= FILTER =================
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed"), false);
  }

  if (!allowedExt.includes(ext)) {
    return cb(new Error("Invalid image format"), false);
  }

  cb(null, true);
};

// ================= UPLOAD INSTANCE =================
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter
});

module.exports = upload;
