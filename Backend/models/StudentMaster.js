const mongoose = require("mongoose");

const studentMasterSchema = new mongoose.Schema(
  {
    regNo: {
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

    roomNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true
    },

    block: {
      type: String,
      trim: true,
      default: ""
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

// 🔒 Active student regNo uniqueness
studentMasterSchema.index(
  { regNo: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false }
  }
);

// 🔒 Active student email uniqueness
studentMasterSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false }
  }
);

module.exports =
  mongoose.models.StudentMaster ||
  mongoose.model("StudentMaster", studentMasterSchema);
