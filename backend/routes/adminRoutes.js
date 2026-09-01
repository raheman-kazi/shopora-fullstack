const express = require("express");

const {
  getDashboardStats,

  getAdminProducts,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,

  getAdminOrders,
  getAdminOrderById,
  updateOrderStatus,

  getAdminUsers,
  updateUserRole,
  deleteUser,
} = require("../controllers/adminController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();

// =====================================================
// Poore admin router par login + admin check
// =====================================================

router.use(protect, adminOnly);

// Frontend guard ke liye quick check
router.get("/verify", (req, res) => {
  res.status(200).json({
    message: "Admin verified",
    admin: {
      id: req.admin._id,
      name: req.admin.name,
      email: req.admin.email,
      role: req.admin.role,
    },
  });
});

// =====================================================
// DASHBOARD
// =====================================================

router.get("/stats", getDashboardStats);

// =====================================================
// PRODUCTS
// =====================================================

router.get("/products", getAdminProducts);
router.post("/products", adminCreateProduct);
router.put("/products/:id", adminUpdateProduct);
router.delete("/products/:id", adminDeleteProduct);

// =====================================================
// ORDERS
// =====================================================

router.get("/orders", getAdminOrders);
router.get("/orders/:id", getAdminOrderById);
router.put("/orders/:id/status", updateOrderStatus);

// =====================================================
// USERS
// =====================================================

router.get("/users", getAdminUsers);
router.put("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

module.exports = router;
