// Require a specific role — use after `protect`

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Access denied: admins only" });
  }
  next();
};

export const requireVendor = (req, res, next) => {
  if (!["vendor", "admin"].includes(req.user?.role)) {
    return res.status(403).json({ message: "Access denied: vendors only" });
  }
  next();
};

export const requireAdminOrVendor = (req, res, next) => {
  if (!["vendor", "admin"].includes(req.user?.role)) {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};