const Complaint = require("../models/complaint");
const TechnicianMaster = require("../models/TechnicianMaster");

// ---------------- STATUS RULES ----------------
const technicianTransitions = {
  Pending: ["In Progress"],
  "In Progress": ["Resolved"]
};

// ---------------- HELPER: KEYWORD EXTRACT ----------------
const extractKeywords = (text = "") => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .split(" ")
    .filter(w => w.length > 3)
    .slice(0, 10);
};

// ---------------- STUDENT ----------------

exports.createComplaint = async (req, res) => {
  try {
    const {
      complaintText,
      category,
      roomNumber,
      priority,
      isAnonymous = false,
      isRagging = false
    } = req.body;

    if (!complaintText || !category)
      return res.status(400).json({ message: "Complaint text and category required" });

    const images =
      Array.isArray(req.files) && req.files.length > 0
        ? req.files.map(f => f.filename)
        : [];

    const finalRoom = isRagging ? (roomNumber?.trim() || null) : req.user.roomNumber;

    if (!isRagging && !finalRoom)
      return res.status(400).json({ message: "Room number required" });

    const complaint = await Complaint.create({
      complaintText: complaintText.trim(),
      category: category.toLowerCase(),
      roomNumber: finalRoom,
      studentRegNo: req.user.regNo,
      priority: priority || "Medium",
      images,
      userId: req.user.userId,
      isAnonymous,
      isRagging,
      keywords: extractKeywords(complaintText),
      status: "Pending",
      studentConfirmation: "Pending",
      statusHistory: [{
        status: "Pending",
        changedByRole: "Student",
        changedById: req.user.userId
      }]
    });

    return res.status(201).json(complaint);

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getMyComplaints = async (req, res) => {
  const complaints = await Complaint.find({
    userId: req.user.userId,
    isDeleted: false
  }).sort({ createdAt: -1 });

  return res.json(complaints);
};

// ---------------- TECHNICIAN ----------------

exports.getTechnicianComplaints = async (req, res) => {
  try {
    const tech = await TechnicianMaster.findOne({
      techId: req.user.techId,
      activated: true,
      isDeleted: false
    });

    if (!tech)
      return res.status(403).json({ message: "Technician not valid" });

    const complaints = await Complaint.find({
      isDeleted: false,
      isRagging: false,
      category: tech.department,
      $or: [
        { assignedTechnician: null },
        { assignedTechnician: tech._id }
      ]
    }).sort({ createdAt: -1 });

    return res.json(complaints);

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ---------------- SMART SIMILAR ----------------

exports.getSimilarComplaints = async (req, res) => {
  const base = await Complaint.findById(req.params.id);
  if (!base) return res.status(404).json({ message: "Not found" });

  const similar = await Complaint.find({
    _id: { $ne: base._id },
    category: base.category,
    status: { $in: ["Resolved", "Completed"] },
    keywords: { $in: base.keywords }
  }).limit(5);

  return res.json(similar);
};

// ---------------- REPAIR IMAGE ----------------

exports.uploadRepairImage = async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ message: "Not found" });

  if (!Array.isArray(req.files) || req.files.length === 0)
    return res.status(400).json({ message: "No images uploaded" });

  const imgs = req.files.map(f => f.filename);

  complaint.repairImages.push(...imgs);
  complaint.repairUploadedAt = new Date();

  await complaint.save();
  return res.json(complaint);
};

// ---------------- UPDATE STATUS ----------------

exports.updateComplaintStatus = async (req, res) => {
  try {
    const { status, remark, solutionSummary } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Not found" });

    if (complaint.status === "Completed")
      return res.status(400).json({ message: "Complaint already completed" });

    if (!technicianTransitions[complaint.status]?.includes(status))
      return res.status(400).json({ message: "Illegal status change" });

    if (!complaint.assignedTechnician && status === "In Progress") {
      const tech = await TechnicianMaster.findOne({
        techId: req.user.techId,
        activated: true,
        isDeleted: false
      });

      if (!tech)
        return res.status(403).json({ message: "Technician not valid" });

      complaint.assignedTechnician = tech._id;
      complaint.technicianNameSnapshot = tech.name;
      complaint.technicianDepartmentSnapshot = tech.department;

      complaint.technicianHistory.push({
        technicianId: tech._id,
        technicianName: tech.name,
        technicianDepartment: tech.department,
        assignedBy: req.user.userId,
        assignedByRole: "Self"
      });
    }

    complaint.status = status;
    complaint.technicianRemark = remark || "";

    if (solutionSummary) complaint.solutionSummary = solutionSummary;

    complaint.statusHistory.push({
      status,
      changedByRole: "Technician",
      changedById: req.user.userId,
      remark: remark || ""
    });

    if (status === "Resolved") {
      complaint.resolvedAt = new Date();
      complaint.studentConfirmation = "Pending";
    }

    await complaint.save();
    return res.json(complaint);

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ---------------- CONFIRM ----------------

exports.confirmComplaint = async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ message: "Not found" });

  if (String(complaint.userId) !== String(req.user.userId))
    return res.status(403).json({ message: "Unauthorized" });

  if (complaint.status !== "Resolved")
    return res.status(400).json({ message: "Complaint not resolved yet" });

  if (complaint.studentConfirmation !== "Pending")
    return res.status(400).json({ message: "Already processed" });

  complaint.studentConfirmation = "Confirmed";
  complaint.status = "Completed";
  complaint.studentActionAt = new Date();
  complaint.completedAt = new Date();

  complaint.statusHistory.push({
    status: "Completed",
    changedByRole: "Student",
    changedById: req.user.userId,
    remark: "Student confirmed resolution"
  });

  await complaint.save();
  return res.json(complaint);
};

// ---------------- REJECT ----------------

exports.rejectComplaint = async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ message: "Not found" });

  if (String(complaint.userId) !== String(req.user.userId))
    return res.status(403).json({ message: "Unauthorized" });

  if (complaint.status !== "Resolved")
    return res.status(400).json({ message: "Complaint not resolved yet" });

  if (complaint.studentConfirmation !== "Pending")
    return res.status(400).json({ message: "Already processed" });

  complaint.studentConfirmation = "Rejected";
  complaint.status = "In Progress";
  complaint.studentActionAt = new Date();
  complaint.resolvedAt = null;

  complaint.statusHistory.push({
    status: "In Progress",
    changedByRole: "Student",
    changedById: req.user.userId,
    remark: "Student rejected resolution"
  });

  await complaint.save();
  return res.json(complaint);
};

// ---------------- RATING ----------------

exports.rateComplaint = async (req, res) => {
  const { rating, feedback, ratingFeedback } = req.body;

  const finalFeedback = feedback || ratingFeedback || "";

  if (!rating || rating < 1 || rating > 5)
    return res.status(400).json({ message: "Invalid rating" });

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ message: "Not found" });

  if (complaint.status !== "Completed")
    return res.status(400).json({ message: "Not completed yet" });

  if (complaint.rating)
    return res.status(400).json({ message: "Already rated" });

  complaint.rating = rating;
  complaint.ratingFeedback = finalFeedback;
  complaint.ratedAt = new Date();
  
complaint.statusHistory.push({
  status: "Rated",
  changedByRole: "Student",
  changedById: req.user.userId,
  remark: `Rating: ${rating}`
});

  await complaint.save();
  return res.json(complaint);
};

// ---------------- DELETE ----------------

exports.deleteComplaint = async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ message: "Not found" });

  if (String(complaint.userId) !== String(req.user.userId))
    return res.status(403).json({ message: "Unauthorized" });

  complaint.isDeleted = true;
  await complaint.save();

  return res.json({ success: true });
};

// ---------------- ADMIN ----------------

exports.getAllComplaints = async (req, res) => {
  const complaints = await Complaint.find({ isDeleted: false })
    .sort({ createdAt: -1 });
  return res.json(complaints);
};

exports.getRaggingComplaints = async (req, res) => {
  const complaints = await Complaint.find({
    isDeleted: false,
    isRagging: true
  }).sort({ createdAt: -1 });

  return res.json(complaints);
};

exports.markRaggingReviewed = async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ message: "Not found" });

  if (!complaint.isRagging)
    return res.status(400).json({ message: "Not a ragging complaint" });

  complaint.raggingReviewed = true;
  complaint.raggingReviewedAt = new Date();

  complaint.adminReviewed = true;
  complaint.adminReviewedAt = new Date();

  complaint.statusHistory.push({
    status: "Ragging Reviewed",
    changedByRole: "Admin",
    changedById: req.user.userId,
    remark: "Ragging complaint reviewed by admin"
  });

  await complaint.save();
  return res.json(complaint);
};

exports.saveAdminRemark = async (req, res) => {
  const { remark } = req.body;

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ message: "Not found" });

  complaint.adminRemark = remark || "";

  await complaint.save();
  return res.json(complaint);
};
