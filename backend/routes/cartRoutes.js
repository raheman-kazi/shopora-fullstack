const express = require("express");

const {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart,
} = require("../controllers/cartController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();


// Add product to logged-in user's cart
router.post("/", protect, addToCart);

// Get logged-in user's cart 
router.get("/", protect, getCart);
router.put("/:productId", protect, updateCartQuantity);

router.delete(
  "/:productId",
  protect,
  removeFromCart
);

module.exports = router;

