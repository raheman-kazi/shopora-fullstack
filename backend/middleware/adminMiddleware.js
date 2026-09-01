const User = require("../models/User");

// =====================================================
// ADMIN ONLY
// Ye middleware hamesha `protect` ke BAAD lagana hai,
// kyunki `protect` req.userId set karta hai.
// =====================================================

const adminOnly = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select(
      "name email role"
    );

    if (!user) {
      return res.status(401).json({
        message: "Not authorized. Please login.",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admins only.",
      });
    }

    // Controller me kaam aa sakta hai
    req.admin = user;

    next();
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = adminOnly;
