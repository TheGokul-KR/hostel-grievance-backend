const StudentMaster = require("../models/StudentMaster");
const TechnicianMaster = require("../models/TechnicianMaster");
const User = require("../models/User");

// ================= STUDENTS =================

// ADD STUDENT
exports.addStudent = async (req, res) => {
  try {
    const { regNo, name, email, roomNumber } = req.body;

    if (!regNo || !name || !email || !roomNumber) {
      return res.status(400).json({ message: "All fields required" });
    }

    const upperReg = regNo.toUpperCase();

    const existing = await StudentMaster.findOne({
      regNo: upperReg,
      isDeleted: false
    });

    if (existing) {
      return res.status(400).json({ message: "Student already exists" });
    }

    const student = await StudentMaster.create({
      regNo: upperReg,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      roomNumber: roomNumber.trim(),
      activated: false,
      importedByAdmin: true,
      lastModifiedBy: req.user.userId
    });

    return res.status(201).json(student);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// GET ALL STUDENTS (MERGED WITH USER)
exports.getStudents = async (req, res) => {
  try {
    const masters = await StudentMaster.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .lean();

    const regs = masters.map(s => s.regNo);

    const users = await User.find({
      regNo: { $in: regs },
      role: "Student",
      isDeleted: false
    }).lean();

    const map = {};
    users.forEach(u => {
      map[u.regNo] = u;
    });

    const merged = masters.map(s => {
      const u = map[s.regNo];
      return {
        ...s,
        userExists: !!u,
        userActive: u ? u.isActive : false,
        lastLogin: u ? u.lastLogin : null
      };
    });

    return res.json(merged);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// DEACTIVATE STUDENT
exports.deactivateStudent = async (req, res) => {
  try {
    const student = await StudentMaster.findById(req.params.id);
    if (!student)
      return res.status(404).json({ message: "Student not found" });

    student.activated = false;
    student.deactivatedAt = new Date();
    student.lastModifiedBy = req.user.userId;
    await student.save();

    await User.updateOne(
      { regNo: student.regNo, role: "Student" },
      { isActive: false }
    );

    return res.json({ message: "Student deactivated" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// REACTIVATE STUDENT
exports.reactivateStudent = async (req, res) => {
  try {
    const student = await StudentMaster.findById(req.params.id);
    if (!student)
      return res.status(404).json({ message: "Student not found" });

    student.activated = true;
    student.deactivatedAt = null;
    student.lastModifiedBy = req.user.userId;
    await student.save();

    return res.json({ message: "Student reactivated" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ================= TECHNICIANS =================

// ADD TECHNICIAN
exports.addTechnician = async (req, res) => {
  try {
    const { techId, name, email, department, block } = req.body;

    if (!techId || !name || !email || !department) {
      return res.status(400).json({ message: "All fields required" });
    }

    const upperTech = techId.toUpperCase();

    const existing = await TechnicianMaster.findOne({
      techId: upperTech,
      isDeleted: false
    });

    if (existing) {
      return res.status(400).json({ message: "Technician already exists" });
    }

    const tech = await TechnicianMaster.create({
      techId: upperTech,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      department: department.trim(),
      block: block || "",
      activated: false,
      importedByAdmin: true,
      lastModifiedBy: req.user.userId
    });

    return res.status(201).json(tech);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// GET ALL TECHNICIANS (MERGED WITH USER)
exports.getTechnicians = async (req, res) => {
  try {
    const masters = await TechnicianMaster.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .lean();

    const ids = masters.map(t => t.techId);

    const users = await User.find({
      techId: { $in: ids },
      role: "Technician",
      isDeleted: false
    }).lean();

    const map = {};
    users.forEach(u => {
      map[u.techId] = u;
    });

    const merged = masters.map(t => {
      const u = map[t.techId];
      return {
        ...t,
        userExists: !!u,
        userActive: u ? u.isActive : false,
        lastLogin: u ? u.lastLogin : null
      };
    });

    return res.json(merged);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// DEACTIVATE TECHNICIAN
exports.deactivateTechnician = async (req, res) => {
  try {
    const tech = await TechnicianMaster.findById(req.params.id);
    if (!tech)
      return res.status(404).json({ message: "Technician not found" });

    tech.activated = false;
    tech.deactivatedAt = new Date();
    tech.lastModifiedBy = req.user.userId;
    await tech.save();

    await User.updateOne(
      { techId: tech.techId, role: "Technician" },
      { isActive: false }
    );

    return res.json({ message: "Technician deactivated" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// REACTIVATE TECHNICIAN
exports.reactivateTechnician = async (req, res) => {
  try {
    const tech = await TechnicianMaster.findById(req.params.id);
    if (!tech)
      return res.status(404).json({ message: "Technician not found" });

    tech.activated = true;
    tech.deactivatedAt = null;
    tech.lastModifiedBy = req.user.userId;
    await tech.save();

    return res.json({ message: "Technician reactivated" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
