const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const controller = require("../controllers/noticeController");

// ================= PUBLIC =================
router.get(
  "/",
  auth(["Student", "Technician", "Admin"]),
  controller.getNotices
);

// ================= ADMIN =================
router.post(
  "/",
  auth(["Admin"]),
  controller.createNotice
);

router.patch(
  "/:id",
  auth(["Admin"]),
  controller.updateNotice
);

router.delete(
  "/:id",
  auth(["Admin"]),
  controller.deleteNotice
);

module.exports = router;
