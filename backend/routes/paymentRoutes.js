const express = require("express");

const {
  createPaymentOrder,
  verifyPayment,
  markPaymentFailed,
} = require("../controllers/paymentController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Sab payment routes login-only hain
router.post("/create-order", protect, createPaymentOrder);
router.post("/verify", protect, verifyPayment);
router.post("/failed", protect, markPaymentFailed);

module.exports = router;
