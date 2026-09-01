
const Product = require("../models/Product");

// GET all products
const getProducts = async (req, res) => {
  try {
    const products = await Product.find();

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};


// GET single product
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};



const createProduct = async (req, res) => {
  try {
    const data = req.body;

    // ==========================================
    // MULTIPLE PRODUCTS
    // ==========================================

    if (Array.isArray(data)) {
      if (data.length === 0) {
        return res.status(400).json({
          message: "Please provide at least one product",
        });
      }

      const products = await Product.insertMany(data);

      return res.status(201).json({
        message: "Products created successfully",
        count: products.length,
        products,
      });
    }

    // ==========================================
    // SINGLE PRODUCT
    // ==========================================

    const {
      name,
      price,
      originalPrice,
      category,
      image,
      rating,
      description,
      stock,
    } = data;

    // Required fields
    if (
      !name ||
      price === undefined ||
      !category ||
      !image ||
      !description
    ) {
      return res.status(400).json({
        message: "Please provide all required fields",
      });
    }

    const product = await Product.create({
      name,
      price,
      originalPrice: originalPrice ?? null,
      category,
      image,
      rating: rating ?? 0,
      description,
      stock: stock ?? 0,
    });

    return res.status(201).json({
      message: "Product created successfully",
      product,
    });

  } catch (error) {
    console.error("Create product error:", error);

    res.status(500).json({
      message: "Failed to create product",
      error: error.message,
    });
  }
};





module.exports = {
  getProducts,
  getProductById,
  createProduct,
};

