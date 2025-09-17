const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");

/**
 * Protect routes with JWT.
 */
exports.protect = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer "))
    return res.status(401).json({ message: "Unauthorized" });

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

/**
 * Restrict access to specific roles.
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "You must be logged in to access this resource" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: "You don't have permission to access this resource",
        requiredRoles: roles,
        userRole: req.user.role
      });
    }

    next();
  };
};
