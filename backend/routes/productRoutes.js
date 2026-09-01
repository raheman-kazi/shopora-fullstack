
const express = require("express");

const {
  getProducts,
  getProductById,
  createProduct
} = require("../controllers/productController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();


// GET all products
router.get("/", getProducts);

// CREATE product (admin only)
router.post("/", protect, adminOnly, createProduct);

// GET single product
router.get("/:id", getProductById);



module.exports = router;

