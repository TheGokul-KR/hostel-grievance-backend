const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    content: {
      type: String,
      required: true,
      trim: true
    },

    priority: {
      type: String,
      enum: ["Low", "Normal", "High"],
      default: "Normal",
      index: true
    },

    visibleTo: {
      type: String,
      enum: ["Students", "Technicians", "All"],
      default: "All",
      index: true
    },

    category: {
      type: String,
      default: "Hostel",
      index: true
    },

    pinned: {
      type: Boolean,
      default: false,
      index: true
    },

    expiresAt: {
      type: Date,
      default: null,
      index: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Notice ||
  mongoose.model("Notice", noticeSchema);
