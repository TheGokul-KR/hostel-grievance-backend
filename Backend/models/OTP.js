const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    // 🔑 Single unified identifier (regNo / techId / email input)
    identifier: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },

    role: {
      type: String,
      enum: ["Student", "Technician"],
      required: true,
      index: true
    },

    otp: {
      type: String,
      required: true,
      index: true
    },

    purpose: {
      type: String,
      enum: ["signup", "forgot_password"],
      required: true,
      index: true
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true
    },

    verified: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  { timestamps: true }
);

// 🔒 Auto delete expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// 🔒 Fast lookup for OTP validation
otpSchema.index({
  identifier: 1,
  email: 1,
  role: 1,
  purpose: 1,
  otp: 1,
  verified: 1
});

// 🔒 Prevent multiple active OTP for same identity + purpose
otpSchema.index(
  {
    identifier: 1,
    role: 1,
    purpose: 1,
    verified: 1
  },
  {
    unique: false,
    partialFilterExpression: { verified: false }
  }
);

module.exports =
  mongoose.models.OTP ||
  mongoose.model("OTP", otpSchema);
