
const Cart = require("../models/Cart");
const Product = require("../models/Product");

// ==========================================
// ADD PRODUCT TO CART
// ==========================================

const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    // Check product ID
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

    // Check quantity
    if (quantity < 1) {
      return res.status(400).json({
        message: "Quantity must be at least 1",
      });
    }

    // ==========================================
    // STOCK CHECK
    // Product bilkul khatam
    // ==========================================

    if (product.stock <= 0) {
      return res.status(400).json({
        message: `${product.name} is out of stock`,
        stock: 0,
      });
    }

    // Find logged-in user's cart
    let cart = await Cart.findOne({
      user: req.userId,
    });

    // If cart doesn't exist, create one
    if (!cart) {
      if (quantity > product.stock) {
        return res.status(400).json({
          message: `Only ${product.stock} left in stock`,
          stock: product.stock,
        });
      }

      cart = await Cart.create({
        user: req.userId,
        items: [
          {
            product: productId,
            quantity,
          },
        ],
      });

      await cart.populate("items.product");

      return res.status(201).json({
        message: "Product added to cart",
        cart,
      });
    }

    // Check if product already exists in cart
    const existingItem = cart.items.find(
      item => item.product.toString() === productId
    );

    // ==========================================
    // Cart me pehle se jo hai + jo add ho raha hai
    // milakar stock se zyada nahi hona chahiye
    // ==========================================

    const alreadyInCart = existingItem
      ? existingItem.quantity
      : 0;

    const requestedTotal = alreadyInCart + quantity;

    if (requestedTotal > product.stock) {
      return res.status(400).json({
        message:
          alreadyInCart >= product.stock
            ? `You already have all ${product.stock} available in your cart`
            : `Only ${product.stock} left in stock`,
        stock: product.stock,
        inCart: alreadyInCart,
      });
    }

    if (existingItem) {
      existingItem.quantity = requestedTotal;
    } else {
      cart.items.push({
        product: productId,
        quantity,
      });
    }

    await cart.save();

    await cart.populate("items.product");

    res.status(200).json({
      message: "Product added to cart",
      cart,
    });

  } catch (error) {
    console.error("Add to cart error:", error);

    res.status(500).json({
      message: "Failed to add product to cart",
      error: error.message,
    });
  }
};



const getCart = async (req, res) => {
  try {
    // Logged-in user ka cart find karo
    let cart = await Cart.findOne({
      user: req.userId,
    }).populate("items.product");

    // Agar cart abhi bana hi nahi hai
    if (!cart) {
      return res.status(200).json({
        message: "Cart is empty",
        cart: {
          user: req.userId,
          items: [],
        },
      });
    }

    // Cart successfully mil gaya
    res.status(200).json({
      message: "Cart fetched successfully",
      cart,
    });

  } catch (error) {
    console.error("Get cart error:", error);

    res.status(500).json({
      message: "Failed to fetch cart",
      error: error.message,
    });
  }
};



const updateCartQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    // Quantity validate karo
    if (!quantity || quantity < 1) {
      return res.status(400).json({
        message: "Quantity must be at least 1",
      });
    }

    // User ka cart find karo
    const cart = await Cart.findOne({
      user: req.userId,
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found",
      });
    }

    // Cart me product find karo
    const item = cart.items.find(
      (item) =>
        item.product.toString() === productId.toString()
    );

    if (!item) {
      return res.status(404).json({
        message: "Product not found in cart",
      });
    }

    // ==========================================
    // STOCK CHECK
    // ==========================================

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    if (product.stock <= 0) {
      return res.status(400).json({
        message: `${product.name} is out of stock`,
        stock: 0,
      });
    }

    if (quantity > product.stock) {
      return res.status(400).json({
        message: `Only ${product.stock} left in stock`,
        stock: product.stock,
      });
    }

    // Quantity update
    item.quantity = quantity;

    await cart.save();

    // Product details populate karo
    await cart.populate("items.product");

    res.status(200).json({
      message: "Cart quantity updated successfully",
      cart,
    });

  } catch (error) {
    console.error("Update cart quantity error:", error);

    res.status(500).json({
      message: "Failed to update cart quantity",
      error: error.message,
    });
  }
};


const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    // User ka cart find karo
    const cart = await Cart.findOne({
      user: req.userId,
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found",
      });
    }

    // Check karo product cart me hai ya nahi
    const itemExists = cart.items.some(
      (item) =>
        item.product.toString() === productId.toString()
    );

    if (!itemExists) {
      return res.status(404).json({
        message: "Product not found in cart",
      });
    }

    // Product ko cart se remove karo
    cart.items = cart.items.filter(
      (item) =>
        item.product.toString() !== productId.toString()
    );

    await cart.save();

    // Product details populate karo
    await cart.populate("items.product");

    res.status(200).json({
      message: "Product removed from cart successfully",
      cart,
    });

  } catch (error) {
    console.error("Remove from cart error:", error);

    res.status(500).json({
      message: "Failed to remove product from cart",
      error: error.message,
    });
  }
};





module.exports = {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart,
};
