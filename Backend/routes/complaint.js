const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const controller = require("../controllers/complaintController");

// ================= MULTER ERROR HANDLER =================
const handleUpload = (req, res, next) => {
  upload.array("images", 5)(req, res, err => {
    if (err) {
      return res.status(400).json({
        message: err.message || "Image upload failed"
      });
    }
    next();
  });
};

// ================= REPAIR IMAGE UPLOAD HANDLER =================
const handleRepairUpload = (req, res, next) => {
  upload.array("repairImages", 5)(req, res, err => {
    if (err) {
      return res.status(400).json({
        message: err.message || "Repair image upload failed"
      });
    }
    next();
  });
};

// ================= STUDENT ROUTES =================

// Create complaint
router.post(
  "/",
  auth(["Student"]),
  handleUpload,
  controller.createComplaint
);

// Get my complaints
router.get(
  "/my",
  auth(["Student"]),
  controller.getMyComplaints
);

// Confirm resolution
router.patch(
  "/:id/confirm",
  auth(["Student"]),
  controller.confirmComplaint
);

// Reject resolution
router.patch(
  "/:id/reject",
  auth(["Student"]),
  controller.rejectComplaint
);

// Rate complaint
router.patch(
  "/:id/rate",
  auth(["Student"]),
  controller.rateComplaint
);

// Delete complaint
router.delete(
  "/:id",
  auth(["Student"]),
  controller.deleteComplaint
);

// ================= TECHNICIAN ROUTES =================

// Technician sees all complaints
router.get(
  "/technician",
  auth(["Technician"]),
  controller.getTechnicianComplaints
);

// Technician updates status
router.patch(
  "/:id/status",
  auth(["Technician"]),
  controller.updateComplaintStatus
);

// Upload repair evidence images
router.post(
  "/:id/repair-image",
  auth(["Technician"]),
  handleRepairUpload,
  controller.uploadRepairImage
);

// Get similar complaints (intelligence)
router.get(
  "/similar/:id",
  auth(["Technician"]),
  controller.getSimilarComplaints
);

// ================= ADMIN ROUTES =================

// Admin sees all complaints
router.get(
  "/admin/all",
  auth(["Admin"]),
  controller.getAllComplaints
);

// Admin sees ragging complaints
router.get(
  "/admin/ragging",
  auth(["Admin"]),
  controller.getRaggingComplaints
);

// Admin marks ragging reviewed
router.patch(
  "/admin/ragging/:id/review",
  auth(["Admin"]),
  controller.markRaggingReviewed
);

// Admin saves remark
router.patch(
  "/admin/ragging/:id/remark",
  auth(["Admin"]),
  controller.saveAdminRemark
);

router.patch(
  "/:id/hide",
  auth(["Student"]),
  controller.hideCompletedComplaint
);


module.exports = router;
