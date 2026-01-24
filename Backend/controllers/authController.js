require("dotenv").config();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const StudentMaster = require("../models/StudentMaster");
const TechnicianMaster = require("../models/TechnicianMaster");
const OTP = require("../models/OTP");
const nodemailer = require("nodemailer");

// ================= BREVO SMTP =================
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS
  }
});

// ================= HELPERS =================
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const sendOTPEmail = async (email, otp, role) => {
  try {
    return await transporter.sendMail({
      from: "Hostel Grievance & Compliance <thegokul.pc@gmail.com>",
      to: email,
      subject: `${role} OTP Verification`,
      text: `Your ${role} OTP is ${otp}. It expires in 5 minutes.`
    });
  } catch (err) {
    console.error("OTP EMAIL ERROR:", err);
    throw err;
  }
};

// =======================================================
// ================= STUDENT SIGNUP =======================
// =======================================================
exports.studentSignup = async (req, res) => {
  try {
    const { regNo, password } = req.body;
    if (!regNo || !password)
      return res.status(400).json({ message: "regNo and password required" });

    const upperReg = regNo.trim().toUpperCase();

    const student = await StudentMaster.findOne({
      regNo: upperReg,
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    });

    if (!student) return res.status(400).json({ message: "Student not found" });
    if (student.activated)
      return res.status(400).json({ message: "Already activated" });

    const existing = await User.findOne({ regNo: upperReg, role: "Student" });
    if (existing)
      return res.status(400).json({ message: "User already exists" });

    const otp = generateOTP();

    await OTP.deleteMany({
      identifier: upperReg,
      role: "Student",
      purpose: "signup"
    });

    await OTP.create({
      identifier: upperReg,
      email: student.email.toLowerCase(),
      role: "Student",
      otp,
      purpose: "signup",
      verified: false,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    await sendOTPEmail(student.email, otp, "Student");

    return res.json({ message: "OTP sent" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ================= VERIFY STUDENT OTP =================
exports.verifyStudentSignupOTP = async (req, res) => {
  try {
    const { regNo, otp, password } = req.body;

    const upperReg = regNo.trim().toUpperCase();

    const record = await OTP.findOne({
      identifier: upperReg,
      otp,
      role: "Student",
      purpose: "signup",
      verified: false,
      expiresAt: { $gt: new Date() }
    });

    if (!record)
      return res.status(400).json({ message: "Invalid or expired OTP" });

    const student = await StudentMaster.findOne({
      regNo: upperReg,
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    });

    if (!student) return res.status(400).json({ message: "Student not found" });

    await User.create({
      regNo: student.regNo,
      name: student.name,
      email: student.email.toLowerCase(),
      password: password, // FIXED
      role: "Student",
      roomNumber: student.roomNumber,
      isActive: true,
      isEmailVerified: true
    });

    record.verified = true;
    await record.save();

    student.activated = true;
    student.activatedAt = new Date();
    await student.save();

    return res.json({ message: "Student account created" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// =======================================================
// ================= TECHNICIAN SIGNUP ====================
// =======================================================
exports.technicianSignup = async (req, res) => {
  try {
    const { techId, password } = req.body;

    if (!techId || !password)
      return res.status(400).json({ message: "techId and password required" });

    const upperTech = techId.trim().toUpperCase();

    const tech = await TechnicianMaster.findOne({
      techId: upperTech,
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    });

    if (!tech) return res.status(400).json({ message: "Technician not found" });
    if (tech.activated)
      return res.status(400).json({ message: "Already activated" });

    const existing = await User.findOne({
      techId: upperTech,
      role: "Technician"
    });

    if (existing)
      return res.status(400).json({ message: "Account already exists" });

    const otp = generateOTP();

    await OTP.deleteMany({
      identifier: upperTech,
      role: "Technician",
      purpose: "signup"
    });

    await OTP.create({
      identifier: upperTech,
      email: tech.email.toLowerCase(),
      role: "Technician",
      otp,
      purpose: "signup",
      verified: false,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    await sendOTPEmail(tech.email, otp, "Technician");

    return res.json({ message: "OTP sent" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ================= VERIFY TECH OTP =================
exports.verifyTechnicianSignupOTP = async (req, res) => {
  try {
    const { techId, otp, password } = req.body;

    const upperTech = techId.trim().toUpperCase();

    const record = await OTP.findOne({
      identifier: upperTech,
      otp,
      role: "Technician",
      purpose: "signup",
      verified: false,
      expiresAt: { $gt: new Date() }
    });

    if (!record)
      return res.status(400).json({ message: "Invalid or expired OTP" });

    const tech = await TechnicianMaster.findOne({
      techId: upperTech,
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    });

    if (!tech) return res.status(400).json({ message: "Technician not found" });

    await User.create({
      techId: tech.techId,
      name: tech.name,
      email: tech.email.toLowerCase(),
      password: password, // FIXED
      role: "Technician",
      department: tech.department,
      isActive: true,
      isEmailVerified: true
    });

    record.verified = true;
    await record.save();

    tech.activated = true;
    tech.activatedAt = new Date();
    await tech.save();

    return res.json({ message: "Technician account created" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// =======================================================
// ======================= LOGIN ==========================
// =======================================================
exports.login = async (req, res) => {
  try {
    
const rawIdentifier =
  req.body.identifier ||
  req.body.email ||
  req.body.regNo ||
  req.body.techId;

const { password } = req.body;

if (!rawIdentifier || !password) {
  return res
    .status(400)
    .json({ message: "Identifier and password required" });
}

const clean = rawIdentifier.trim();

    const user = await User.findOne({
      $and: [
        {
          $or: [
            { regNo: clean.toUpperCase() },
            { techId: clean.toUpperCase() },
            { email: clean.toLowerCase() }
          ]
        },
        {
          $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
        }
      ]
    }).select("+password");

    if (!user) return res.status(400).json({ message: "Invalid account" });

    if (!user.isActive)
      return res.status(403).json({ message: "Account disabled" });

    const match = await user.comparePassword(password);
    if (!match)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        regNo: user.regNo || null,
        techId: user.techId || null,
        roomNumber: user.roomNumber || null,
        department: user.department || null
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      role: user.role,
      name: user.name,
      regNo: user.regNo || null,
      techId: user.techId || null,
      roomNumber: user.roomNumber || null,
      department: user.department || null
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// =======================================================
// ================= FORGOT PASSWORD ======================
// =======================================================
exports.forgotPassword = async (req, res) => {
  try {
    const { identifier } = req.body;
    const clean = identifier.trim();

    const user = await User.findOne({
      $and: [
        {
          $or: [
            { email: clean.toLowerCase() },
            { regNo: clean.toUpperCase() },
            { techId: clean.toUpperCase() }
          ]
        },
        {
          $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
        }
      ]
    });

    if (!user) return res.status(400).json({ message: "User not found" });

    const otp = generateOTP();

    await OTP.deleteMany({
      identifier: clean,
      role: user.role,
      purpose: "forgot_password"
    });

    await OTP.create({
      identifier: clean,
      email: user.email.toLowerCase(),
      role: user.role,
      otp,
      purpose: "forgot_password",
      verified: false,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    await sendOTPEmail(user.email, otp, user.role);

    return res.json({ message: "OTP sent" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// =======================================================
// ================= RESET PASSWORD =======================
// =======================================================
exports.resetPassword = async (req, res) => {
  try {
    const { identifier, otp, newPassword, role } = req.body;
    if (!role)
      return res.status(400).json({ message: "Role is required" });

    const clean = identifier.trim();

    const record = await OTP.findOne({
      identifier: clean,
      otp,
      role,
      purpose: "forgot_password",
      verified: false,
      expiresAt: { $gt: new Date() }
    });

    if (!record)
      return res.status(400).json({ message: "Invalid or expired OTP" });

    const user = await User.findOne({
      email: record.email.toLowerCase(),
      role
    });

    if (!user) return res.status(400).json({ message: "User not found" });

    user.password = newPassword; // FIXED
    await user.save();

    record.verified = true;
    await record.save();

    return res.json({ message: "Password reset successful" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
