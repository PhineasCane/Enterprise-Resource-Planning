/**
 * Restrict access by user role.
 * Usage: .use(protect).use(restrictTo('Admin','Manager'))
 */
exports.restrictTo =
  (...allowed) =>
  (req, res, next) => {
    if (!req.user || !allowed.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
