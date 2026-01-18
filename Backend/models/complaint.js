const mongoose = require("mongoose");

// ================= STATUS HISTORY =================
const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },

    changedByRole: {
      type: String,
      enum: ["Student", "Technician", "Admin", "System"],
      required: true
    },

    changedById: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },

    remark: {
      type: String,
      default: ""
    },

    changedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

// ================= TECHNICIAN HISTORY =================
const technicianHistorySchema = new mongoose.Schema(
  {
    technicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TechnicianMaster"
    },

    technicianName: String,

    technicianDepartment: {
      type: String,
      lowercase: true
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },

    assignedByRole: {
      type: String,
      enum: ["Admin", "System", "Self"],
      default: "System"
    },

    assignedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

// ================= MAIN SCHEMA =================
const complaintSchema = new mongoose.Schema(
  {
    complaintText: {
      type: String,
      required: true,
      trim: true
    },

    // 🔒 LOCKED TO TECHNICIAN DEPARTMENTS
    category: {
      type: String,
      enum: ["cleaning","electrical","plumbing","furniture","water","others"],
      required: true,
      lowercase: true,
      index: true
    },

    roomNumber: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    studentRegNo: {
      type: String,
      required: true,
      uppercase: true,
      index: true
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
      index: true
    },

    images: {
      type: [String],
      default: []
    },

    repairImages: {
      type: [String],
      default: []
    },

    repairUploadedAt: Date,

    solutionSummary: {
      type: String,
      default: ""
    },

    keywords: {
      type: [String],
      default: []
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true
    },

    isAnonymous: {
      type: Boolean,
      default: false
    },

    isRagging: {
      type: Boolean,
      default: false,
      index: true
    },

    raggingReviewed: {
      type: Boolean,
      default: false,
      index: true
    },

    raggingReviewRemark: {
      type: String,
      default: ""
    },

    assignedTechnician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TechnicianMaster",
      default: null,
      index: true
    },

    technicianNameSnapshot: {
      type: String,
      default: ""
    },

    technicianDepartmentSnapshot: {
      type: String,
      lowercase: true,
      default: ""
    },

    technicianHistory: {
      type: [technicianHistorySchema],
      default: []
    },

    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved", "Completed"],
      default: "Pending",
      index: true
    },

    statusHistory: {
      type: [statusHistorySchema],
      default: []
    },

    technicianRemark: {
      type: String,
      default: ""
    },

    adminRemark: {
      type: String,
      default: ""
    },

    studentConfirmation: {
      type: String,
      enum: ["Pending", "Confirmed", "Rejected"],
      default: "Pending",
      index: true
    },

    resolvedAt: Date,
    studentActionAt: Date,
    completedAt: Date,

    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
      index: true
    },

    ratingFeedback: {
      type: String,
      default: ""
    },

    ratedAt: Date,

    adminReviewed: {
      type: Boolean,
      default: false,
      index: true
    },

    adminReviewedAt: Date,

    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  { timestamps: true }
);

// ================= INDEX OPTIMIZATION =================
complaintSchema.index({ assignedTechnician: 1, status: 1 });
complaintSchema.index({ category: 1, status: 1 });
complaintSchema.index({ userId: 1, status: 1 });
complaintSchema.index({ category: 1, keywords: 1, status: 1 });

// ================= LIFECYCLE GUARDS =================
complaintSchema.pre("save", async function () {
  if (this.isModified("rating") && this.status !== "Completed") {
    throw new Error("Rating allowed only after completion");
  }

  if (this.status === "Completed" && this.studentConfirmation !== "Confirmed") {
    throw new Error("Completion requires student confirmation");
  }

  if (this.status === "Resolved" && !this.assignedTechnician) {
    throw new Error("Resolved complaint must have technician");
  }
});

// ================= VIRTUAL =================
complaintSchema.virtual("isOverdue").get(function () {
  if (this.status !== "Pending") return false;
  const diff = Date.now() - this.createdAt.getTime();
  return diff > 12 * 60 * 60 * 1000;
});

complaintSchema.set("toJSON", { virtuals: true });
complaintSchema.set("toObject", { virtuals: true });

// ================= EXPORT =================


// ================= AUTO CONFIRM HELPER =================
complaintSchema.statics.autoConfirmExpired = async function () {
  const limit = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const complaints = await this.find({
    status: "Resolved",
    studentConfirmation: "Pending",
    resolvedAt: { $lte: limit }
  });

  for (const c of complaints) {
    c.studentConfirmation = "Confirmed";
    c.status = "Completed";
    c.completedAt = new Date();
    c.studentActionAt = new Date();

    c.statusHistory.push({
      status: "Completed",
      changedByRole: "System",
      changedById: null,
      remark: "Auto confirmed after 24 hours"
    });

    await c.save();
  }

  return complaints.length;
};
module.exports =
  mongoose.models.Complaint ||
  mongoose.model("Complaint", complaintSchema);