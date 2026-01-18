const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const controller = require("../controllers/adminController");

// ================= STUDENTS =================

// add student
router.post(
  "/students",
  auth(["Admin"]),
  controller.addStudent
);

// get all students
router.get(
  "/students",
  auth(["Admin"]),
  controller.getStudents
);

// deactivate student
router.patch(
  "/students/:id/deactivate",
  auth(["Admin"]),
  controller.deactivateStudent
);

// reactivate student
router.patch(
  "/students/:id/reactivate",
  auth(["Admin"]),
  controller.reactivateStudent
);

// ================= TECHNICIANS =================

// add technician
router.post(
  "/technicians",
  auth(["Admin"]),
  controller.addTechnician
);

// get all technicians
router.get(
  "/technicians",
  auth(["Admin"]),
  controller.getTechnicians
);

// deactivate technician
router.patch(
  "/technicians/:id/deactivate",
  auth(["Admin"]),
  controller.deactivateTechnician
);

// reactivate technician
router.patch(
  "/technicians/:id/reactivate",
  auth(["Admin"]),
  controller.reactivateTechnician
);

module.exports = router;
