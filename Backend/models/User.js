const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    regNo: {
      type: String,
      uppercase: true,
      trim: true,
      index: true,
      default: null
    },

    techId: {
      type: String,
      uppercase: true,
      trim: true,
      index: true,
      default: null
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

    password: {
      type: String,
      required: true,
      select: false
    },

    role: {
      type: String,
      enum: ["Student", "Technician", "Admin"],
      required: true,
      index: true
    },

    roomNumber: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
      default: null
    },

    department: {
      type: String,
      trim: true,
      lowercase: true,
      default: null
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true
    },

    isEmailVerified: {
      type: Boolean,
      default: false
    },

    otp: {
      type: String,
      select: false,
      default: null
    },

    otpExpiresAt: {
      type: Date,
      default: null
    },

    createdByAdmin: {
      type: Boolean,
      default: false
    },

    lastLogin: {
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



// ================= INDEX RULES =================

// Student regNo unique
userSchema.index(
  { regNo: 1 },
  {
    unique: true,
    partialFilterExpression: {
      role: "Student",
      regNo: { $type: "string" },
      isDeleted: false
    }
  }
);

// Technician techId unique
userSchema.index(
  { techId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      role: "Technician",
      techId: { $type: "string" },
      isDeleted: false
    }
  }
);

// Email unique per role
userSchema.index(
  { email: 1, role: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false }
  }
);



// ================= VALIDATION =================

userSchema.pre("validate", function () {

  if (this.role === "Student" && !this.regNo) {
    throw new Error("Student must have regNo");
  }

  if (this.role === "Technician" && !this.techId) {
    throw new Error("Technician must have techId");
  }

  if (!this.email) {
    throw new Error("User must have email");
  }

});



// ================= PASSWORD HASH =================

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});



// ================= METHODS =================

userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};



// ================= JSON CLEAN =================

userSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.otp;
    delete ret.otpExpiresAt;
    return ret;
  }
});



// ================= EXPORT =================

module.exports =
  mongoose.models.User ||
  mongoose.model("User", userSchema);
