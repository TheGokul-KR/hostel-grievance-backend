const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },

    role: {
      type: String,
      enum: ["Student", "Technician", "Admin", "System"],
      required: true,
      index: true
    },

    title: {
      type: String,
      default: ""
    },

    message: {
      type: String,
      required: true
    },

    type: {
      type: String,
      enum: [
        "Complaint",
        "Ragging",
        "Assignment",
        "StatusUpdate",
        "Rating",
        "AdminNotice",
        "System"
      ],
      default: "System",
      index: true
    },

    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      default: null,
      index: true
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low",
      index: true
    },

    expiresAt: {
      type: Date,
      default: null
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  { timestamps: true }
);

// Auto delete expired notifications
notificationSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { expiresAt: { $ne: null } } }
);

module.exports =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);
  
notificationSchema.pre("validate", function () {
  console.log("NOTIFICATION ROLE RECEIVED:", this.role);
});
