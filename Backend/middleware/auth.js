const jwt = require("jsonwebtoken");

module.exports = function auth(allowedRoles = []) {
  return function (req, res, next) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
      }

      const token = authHeader.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!decoded || !decoded.userId) {
        return res.status(401).json({ message: "Invalid token" });
      }

      req.user = {
        userId: decoded.userId,
        role: decoded.role,
        regNo: decoded.regNo || null,
        techId: decoded.techId || null,
        roomNumber: decoded.roomNumber || null,
        department: decoded.department || null
      };

      if (
        Array.isArray(allowedRoles) &&
        allowedRoles.length > 0 &&
        !allowedRoles
          .map(r => r.toLowerCase())
          .includes(decoded.role.toLowerCase())
      ) {
        return res.status(403).json({ message: "Access denied" });
      }

      next();
    } catch (err) {
      console.error("AUTH ERROR:", err.message);
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  };
};
