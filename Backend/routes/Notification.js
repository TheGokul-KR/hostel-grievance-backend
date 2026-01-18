const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const controller = require("../controllers/notificationController");

// ================= SAFE CONTROLLER WRAPPER =================
const safe = (fn, name) => {
  if (typeof fn !== "function") {
    console.error(`Notification controller missing: ${name}`);
    return (req, res) =>
      res.status(501).json({ message: `${name} not implemented` });
  }

  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      console.error(`Notification crash in ${name}:`, err.message);
      return res.status(500).json({ message: err.message });
    }
  };
};

// ================= STUDENT =================
router.get(
  "/student",
  auth(["Student"]),
  safe(controller.getMyNotifications, "getMyNotifications")
);

router.patch(
  "/student/:id/read",
  auth(["Student"]),
  safe(controller.markAsRead, "markAsRead")
);

// ================= TECHNICIAN =================
router.get(
  "/technician",
  auth(["Technician"]),
  safe(controller.getMyNotifications, "getMyNotifications")
);

router.patch(
  "/technician/:id/read",
  auth(["Technician"]),
  safe(controller.markAsRead, "markAsRead")
);

// ================= ADMIN =================
router.get(
  "/admin",
  auth(["Admin"]),
  safe(controller.getMyNotifications, "getMyNotifications")
);

router.patch(
  "/admin/:id/read",
  auth(["Admin"]),
  safe(controller.markAsRead, "markAsRead")
);

module.exports = router;
