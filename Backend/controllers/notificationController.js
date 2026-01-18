const Notification = require("../models/Notification");

// ================= GET MY NOTIFICATIONS =================
exports.getMyNotifications = async (req, res) => {
  try {
    const userId = String(req.user.userId);
    const role = req.user.role;

    const notifications = await Notification.find({
      isDeleted: false,
      role: role,
      $or: [
        { userId: userId },
        { userId: null } // broadcast to role
      ]
    })
      .sort({ isRead: 1, createdAt: -1 })
      .limit(200); // safety cap

    return res.json(notifications);

  } catch (err) {
    console.error("NOTIFICATION FETCH ERROR:", err.message);
    return res.status(500).json({ message: err.message });
  }
};

// ================= MARK AS READ =================
exports.markAsRead = async (req, res) => {
  try {
    const userId = String(req.user.userId);
    const role = req.user.role;

    const notif = await Notification.findOne({
      _id: req.params.id,
      role: role,
      isDeleted: false,
      $or: [
        { userId: userId },
        { userId: null }
      ]
    });

    if (!notif) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notif.isRead) {
      return res.json({ message: "Already marked as read" });
    }

    notif.isRead = true;
    await notif.save();

    return res.json({ message: "Marked as read" });

  } catch (err) {
    console.error("NOTIFICATION READ ERROR:", err.message);
    return res.status(500).json({ message: err.message });
  }
};
