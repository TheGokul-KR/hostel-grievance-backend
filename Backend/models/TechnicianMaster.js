const mongoose = require("mongoose");

const technicianMasterSchema = new mongoose.Schema(
  {
    techId: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },

    // 🔑 CRITICAL FOR AUTO ROUTING
    department: {
      type: String,
      enum: ["cleaning","electrical","plumbing","furniture","water","others"],
      required: true,
      lowercase: true,
      index: true
    },

    block: {
      type: String,
      trim: true,
      default: ""
    },

    role: {
      type: String,
      enum: ["Technician"],
      default: "Technician"
    },

    activated: {
      type: Boolean,
      default: false,
      index: true
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },

    activatedAt: {
      type: Date,
      default: null
    },

    deactivatedAt: {
      type: Date,
      default: null
    },

    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    importedByAdmin: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// 🔒 Active technician techId uniqueness
technicianMasterSchema.index(
  { techId: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false }
  }
);

// 🔒 Active technician email uniqueness
technicianMasterSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false }
  }
);

module.exports =
  mongoose.models.TechnicianMaster ||
  mongoose.model("TechnicianMaster", technicianMasterSchema);
