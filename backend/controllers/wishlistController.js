const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");


// ==========================================
// GET MY WISHLIST
// ==========================================

const getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({
      user: req.userId,
    }).populate("items.product");

    // Agar wishlist exist nahi karti
    if (!wishlist) {
      return res.status(200).json({
        message: "Wishlist is empty",
        wishlist: {
          user: req.userId,
          items: [],
        },
      });
    }

    res.status(200).json({
      message: "Wishlist fetched successfully",
      wishlist,
    });

  } catch (error) {
    console.error("Get wishlist error:", error);

    res.status(500).json({
      message: "Failed to fetch wishlist",
      error: error.message,
    });
  }
};


// ==========================================
// TOGGLE WISHLIST
// ADD IF NOT EXISTS
// REMOVE IF EXISTS
// ==========================================

const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    // Product ID check
    if (!productId) {
      return res.status(400).json({
        message: "Product ID is required",
      });
    }

    // Check product exists
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // Find user's wishlist
    let wishlist = await Wishlist.findOne({
      user: req.userId,
    });

    // ======================================
    // WISHLIST DOES NOT EXIST
    // ======================================

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.userId,
        items: [
          {
            product: productId,
          },
        ],
      });

      await wishlist.populate("items.product");

      return res.status(201).json({
        message: "Product added to wishlist",
        action: "added",
        wishlist,
      });
    }


    // ======================================
    // CHECK PRODUCT ALREADY EXISTS
    // ======================================

    const existingItem = wishlist.items.find(
      item =>
        item.product.toString() === productId.toString()
    );


    // ======================================
    // REMOVE FROM WISHLIST
    // ======================================

    if (existingItem) {
      wishlist.items = wishlist.items.filter(
        item =>
          item.product.toString() !== productId.toString()
      );

      await wishlist.save();

      await wishlist.populate("items.product");

      return res.status(200).json({
        message: "Product removed from wishlist",
        action: "removed",
        wishlist,
      });
    }


    // ======================================
    // ADD TO WISHLIST
    // ======================================

    wishlist.items.push({
      product: productId,
    });

    await wishlist.save();

    await wishlist.populate("items.product");

    res.status(200).json({
      message: "Product added to wishlist",
      action: "added",
      wishlist,
    });

  } catch (error) {
    console.error("Toggle wishlist error:", error);

    res.status(500).json({
      message: "Failed to update wishlist",
      error: error.message,
    });
  }
};


// ==========================================
// REMOVE PRODUCT FROM WISHLIST
// ==========================================

const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({
      user: req.userId,
    });

    if (!wishlist) {
      return res.status(404).json({
        message: "Wishlist not found",
      });
    }

    const itemExists = wishlist.items.some(
      item =>
        item.product.toString() === productId.toString()
    );

    if (!itemExists) {
      return res.status(404).json({
        message: "Product not found in wishlist",
      });
    }

    wishlist.items = wishlist.items.filter(
      item =>
        item.product.toString() !== productId.toString()
    );

    await wishlist.save();

    await wishlist.populate("items.product");

    res.status(200).json({
      message: "Product removed from wishlist successfully",
      wishlist,
    });

  } catch (error) {
    console.error("Remove wishlist error:", error);

    res.status(500).json({
      message: "Failed to remove product from wishlist",
      error: error.message,
    });
  }
};


module.exports = {
  getWishlist,
  toggleWishlist,
  removeFromWishlist,
};