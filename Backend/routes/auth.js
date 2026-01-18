const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const controller = require("../controllers/authController");

// ================= SAFE CONTROLLER WRAPPER =================
const safe = (fn, name) => {
  if (typeof fn !== "function") {
    console.error(`Controller missing: ${name}`);
    return (req, res) =>
      res.status(501).json({ message: `${name} not implemented` });
  }
  return fn;
};

// ================= STUDENT =================
router.post(
  "/student-signup",
  safe(controller.studentSignup, "studentSignup")
);

router.post(
  "/student-verify-otp",
  safe(controller.verifyStudentSignupOTP, "verifyStudentSignupOTP")
);

// ================= TECHNICIAN =================
router.post(
  "/technician-signup",
  safe(controller.technicianSignup, "technicianSignup")
);

router.post(
  "/technician-verify-otp",
  safe(controller.verifyTechnicianSignupOTP, "verifyTechnicianSignupOTP")
);

// ================= COMMON =================
router.post(
  "/login",
  safe(controller.login, "login")
);

router.post(
  "/forgot-password",
  safe(controller.forgotPassword, "forgotPassword")
);

router.post(
  "/reset-password",
  safe(controller.resetPassword, "resetPassword")
);

console.log("AUTH ROUTES LOADED");

module.exports = router;
