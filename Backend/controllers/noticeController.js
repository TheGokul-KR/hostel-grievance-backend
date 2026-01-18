const Notice = require("../models/Notice");

// ================= ADMIN =================

// Create Notice
exports.createNotice = async (req, res) => {
  try {
    const { title, content, priority, visibleTo, expiresAt, pinned, category } = req.body;

    if (!title || !content)
      return res.status(400).json({ message: "Title and content required" });

    const notice = await Notice.create({
      title: title.trim(),
      content: content.trim(),
      priority: priority || "Normal",
      visibleTo: visibleTo || "All",
      expiresAt: expiresAt || null,
      pinned: pinned || false,
      category: category || "Hostel",
      createdBy: req.user.userId,
      isActive: true
    });

    return res.status(201).json(notice);

  } catch (err) {
    console.error("CREATE NOTICE ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

// Update Notice
exports.updateNotice = async (req, res) => {
  try {
    const { title, content, priority, visibleTo, expiresAt, isActive, pinned, category } = req.body;

    const notice = await Notice.findById(req.params.id);

    if (!notice)
      return res.status(404).json({ message: "Notice not found" });

    if (title !== undefined) notice.title = title.trim();
    if (content !== undefined) notice.content = content.trim();
    if (priority !== undefined) notice.priority = priority;
    if (visibleTo !== undefined) notice.visibleTo = visibleTo;
    if (expiresAt !== undefined) notice.expiresAt = expiresAt;
    if (isActive !== undefined) notice.isActive = isActive;
    if (pinned !== undefined) notice.pinned = pinned;
    if (category !== undefined) notice.category = category;

    await notice.save();

    return res.json(notice);

  } catch (err) {
    console.error("UPDATE NOTICE ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

// Delete Notice
exports.deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);

    if (!notice)
      return res.status(404).json({ message: "Notice not found" });

    await notice.deleteOne();

    return res.json({ message: "Notice deleted" });

  } catch (err) {
    console.error("DELETE NOTICE ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

// ================= ADMIN VIEW ALL =================
exports.getAllNoticesForAdmin = async (req, res) => {
  try {
    const notices = await Notice.find()
      .sort({ pinned: -1, priority: -1, createdAt: -1 });

    return res.json(notices);

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ================= PUBLIC =================

// Get Notices (role based)
exports.getNotices = async (req, res) => {
  try {
    const role = req.user.role;

    const now = new Date();

    const query = {
      isActive: true,
      $or: [
        { visibleTo: "All" },
        { visibleTo: role === "Student" ? "Students" : "Technicians" }
      ],
      $or: [
        { expiresAt: null },
        { expiresAt: { $gte: now } }
      ]
    };

    const notices = await Notice.find(query)
      .sort({ pinned: -1, priority: -1, createdAt: -1 });

    return res.json(notices);

  } catch (err) {
    console.error("FETCH NOTICE ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};
