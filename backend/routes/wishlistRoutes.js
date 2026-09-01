const express = require("express");

const {
  getWishlist,
  toggleWishlist,
  removeFromWishlist,
} = require("../controllers/wishlistController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();


// Get logged-in user's wishlist
router.get("/", protect, getWishlist);


// Add / Remove wishlist product
router.post("/toggle", protect, toggleWishlist);


// Remove specific product
router.delete("/:productId", protect, removeFromWishlist);


module.exports = router;