const Complaint = require("../models/Complaint");
const Notification = require("../models/Notification");

const HOURS = (h) => h * 60 * 60 * 1000;

const autoCompleteComplaints = async () => {
  try {
    const now = new Date();

    // ================= AUTO CONFIRM USING MODEL =================
    const autoCount = await Complaint.autoConfirmExpired();

    if (autoCount > 0) {
      console.log(`Auto confirmed ${autoCount} complaints`);
    }

    // ================= RESOLVED WAITING STUDENT REMINDER =================
    const resolvedWaiting = await Complaint.find({
      status: "Resolved",
      studentConfirmation: "Pending",
      resolvedAt: { $ne: null }
    });

    for (let c of resolvedWaiting) {
      const diff = now - new Date(c.resolvedAt);

      if (diff >= HOURS(12) && diff < HOURS(24)) {
        await Notification.create({
          userId: c.userId,
          role: "student",
          complaintId: c._id,
          message: "Your complaint is resolved. Please confirm or it will auto-complete."
        });
      }
    }

    // ================= PENDING OVERDUE =================
    const pendingComplaints = await Complaint.find({ status: "Pending" });

    for (let c of pendingComplaints) {
      const diff = now - new Date(c.createdAt);

      if (diff >= HOURS(24) && c.assignedTechnician) {
        await Notification.create({
          userId: c.assignedTechnician,
          role: "technician",
          complaintId: c._id,
          message: "Complaint pending for more than 24 hours."
        });
      }
    }

    // ================= IN PROGRESS OVERDUE =================
    const inProgress = await Complaint.find({ status: "In Progress" });

    for (let c of inProgress) {
      const lastUpdate = c.updatedAt || c.createdAt;
      const diff = now - new Date(lastUpdate);

      if (diff >= HOURS(48)) {
        await Notification.create({
          userId: null,
          role: "admin",
          complaintId: c._id,
          message: "Complaint in progress for more than 48 hours."
        });
      }
    }

    console.log("Reminder & auto-complete job executed");

  } catch (err) {
    console.error("Reminder job error:", err.message);
  }
};

module.exports = autoCompleteComplaints;
