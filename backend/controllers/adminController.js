const mongoose = require("mongoose");

const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");

// =====================================================
// HELPERS
// =====================================================

const toInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

// Search text ko safe regex banata hai
const safeRegex = (text) => {
  const escaped = String(text).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
  return new RegExp(escaped, "i");
};

const isValidId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

// =====================================================
// DASHBOARD STATS
// GET /api/admin/stats
// =====================================================

const getDashboardStats = async (req, res) => {
  try {
    // ---------------------------------------------
    // BASIC COUNTS
    // ---------------------------------------------

    const [
      totalUsers,
      totalProducts,
      totalOrders,
      outOfStock,
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Product.countDocuments({ stock: { $lte: 0 } }),
    ]);

    // ---------------------------------------------
    // REVENUE
    // Cancelled orders ko revenue me nahi ginte
    // ---------------------------------------------

    const revenueAgg = await Order.aggregate([
      {
        $match: {
          orderStatus: { $ne: "Cancelled" },
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalRevenue = revenueAgg[0]?.revenue || 0;
    const paidOrderCount = revenueAgg[0]?.count || 0;

    const averageOrderValue =
      paidOrderCount > 0
        ? totalRevenue / paidOrderCount
        : 0;

    // ---------------------------------------------
    // ORDER STATUS BREAKDOWN
    // ---------------------------------------------

    const statusAgg = await Order.aggregate([
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    const statusCounts = {
      Processing: 0,
      Confirmed: 0,
      Shipped: 0,
      Delivered: 0,
      Cancelled: 0,
    };

    statusAgg.forEach((row) => {
      statusCounts[row._id] = row.count;
    });

    // ---------------------------------------------
    // LAST 7 DAYS SALES
    // ---------------------------------------------

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setHours(0, 0, 0, 0);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const salesAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          orderStatus: { $ne: "Cancelled" },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Missing days ko 0 se fill karte hain
    const salesMap = {};
    salesAgg.forEach((row) => {
      salesMap[row._id] = row;
    });

    const dailySales = [];

    for (let i = 0; i < 7; i += 1) {
      const day = new Date(sevenDaysAgo);
      day.setDate(sevenDaysAgo.getDate() + i);

      const key = day.toISOString().slice(0, 10);

      dailySales.push({
        date: key,
        revenue: salesMap[key]?.revenue || 0,
        orders: salesMap[key]?.orders || 0,
      });
    }

    // ---------------------------------------------
    // TOP SELLING PRODUCTS
    // ---------------------------------------------

    const topProducts = await Order.aggregate([
      {
        $match: {
          orderStatus: { $ne: "Cancelled" },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          image: { $first: "$items.image" },
          unitsSold: { $sum: "$items.quantity" },
          revenue: {
            $sum: {
              $multiply: [
                "$items.price",
                "$items.quantity",
              ],
            },
          },
        },
      },
      { $sort: { unitsSold: -1 } },
      { $limit: 5 },
    ]);

    // ---------------------------------------------
    // LOW STOCK PRODUCTS
    // ---------------------------------------------

    const lowStockProducts = await Product.find({
      stock: { $lte: 5 },
    })
      .select("name image stock price category")
      .sort({ stock: 1 })
      .limit(5);

    // ---------------------------------------------
    // RECENT ORDERS
    // ---------------------------------------------

    const recentOrders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(8)
      .select(
        "orderNumber total orderStatus paymentStatus paymentMethod createdAt user"
      );

    res.status(200).json({
      message: "Stats fetched successfully",

      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue,
        averageOrderValue,
        outOfStock,
        statusCounts,
      },

      dailySales,
      topProducts,
      lowStockProducts,
      recentOrders,
    });
  } catch (error) {
    console.error("Admin stats error:", error);

    res.status(500).json({
      message: "Failed to fetch dashboard stats",
      error: error.message,
    });
  }
};

// =====================================================
// PRODUCTS
// =====================================================

// GET /api/admin/products?search=&category=&page=&limit=
const getAdminProducts = async (req, res) => {
  try {
    const page = Math.max(toInt(req.query.page, 1), 1);
    const limit = Math.min(
      Math.max(toInt(req.query.limit, 12), 1),
      100
    );

    const filter = {};

    if (req.query.search) {
      filter.name = safeRegex(req.query.search.trim());
    }

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.stock === "out") {
      filter.stock = { $lte: 0 };
    }

    if (req.query.stock === "low") {
      filter.stock = { $gt: 0, $lte: 5 };
    }

    const [products, total, categories] =
      await Promise.all([
        Product.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),

        Product.countDocuments(filter),

        Product.distinct("category"),
      ]);

    res.status(200).json({
      message: "Products fetched successfully",
      products,
      categories,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    console.error("Admin get products error:", error);

    res.status(500).json({
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

// POST /api/admin/products
const adminCreateProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      originalPrice,
      category,
      image,
      rating,
      description,
      stock,
      featured,
    } = req.body;

    if (
      !name ||
      price === undefined ||
      price === "" ||
      !category ||
      !image ||
      !description
    ) {
      return res.status(400).json({
        message:
          "Name, price, category, image and description are required",
      });
    }

    if (Number(price) < 0) {
      return res.status(400).json({
        message: "Price cannot be negative",
      });
    }

    const product = await Product.create({
      name: String(name).trim(),
      price: Number(price),
      originalPrice:
        originalPrice === "" ||
        originalPrice === undefined ||
        originalPrice === null
          ? null
          : Number(originalPrice),
      category: String(category).trim(),
      image: String(image).trim(),
      rating: rating === undefined ? 0 : Number(rating),
      description: String(description).trim(),
      stock: stock === undefined ? 0 : Number(stock),
      featured: Boolean(featured),
    });

    res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Admin create product error:", error);

    res.status(500).json({
      message: "Failed to create product",
      error: error.message,
    });
  }
};

// PUT /api/admin/products/:id
const adminUpdateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        message: "Invalid product id",
      });
    }

    const allowedFields = [
      "name",
      "price",
      "originalPrice",
      "category",
      "image",
      "rating",
      "description",
      "stock",
      "featured",
    ];

    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "Nothing to update",
      });
    }

    // Number fields ko cast karte hain
    ["price", "originalPrice", "rating", "stock"].forEach(
      (field) => {
        if (updates[field] !== undefined) {
          updates[field] =
            updates[field] === "" ||
            updates[field] === null
              ? field === "originalPrice"
                ? null
                : 0
              : Number(updates[field]);
        }
      }
    );

    if (updates.price !== undefined && updates.price < 0) {
      return res.status(400).json({
        message: "Price cannot be negative",
      });
    }

    if (updates.stock !== undefined && updates.stock < 0) {
      return res.status(400).json({
        message: "Stock cannot be negative",
      });
    }

    const product = await Product.findByIdAndUpdate(
      id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.status(200).json({
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Admin update product error:", error);

    res.status(500).json({
      message: "Failed to update product",
      error: error.message,
    });
  }
};

// DELETE /api/admin/products/:id
const adminDeleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        message: "Invalid product id",
      });
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.status(200).json({
      message: "Product deleted successfully",
      productId: id,
    });
  } catch (error) {
    console.error("Admin delete product error:", error);

    res.status(500).json({
      message: "Failed to delete product",
      error: error.message,
    });
  }
};

// =====================================================
// ORDERS
// =====================================================

// GET /api/admin/orders?status=&search=&page=&limit=
const getAdminOrders = async (req, res) => {
  try {
    const page = Math.max(toInt(req.query.page, 1), 1);
    const limit = Math.min(
      Math.max(toInt(req.query.limit, 15), 1),
      100
    );

    const filter = {};

    if (
      req.query.status &&
      req.query.status !== "All"
    ) {
      filter.orderStatus = req.query.status;
    }

    if (req.query.search) {
      const regex = safeRegex(req.query.search.trim());

      filter.$or = [
        { orderNumber: regex },
        { "shippingAddress.email": regex },
        { "shippingAddress.firstName": regex },
        { "shippingAddress.phone": regex },
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),

      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      message: "Orders fetched successfully",
      orders,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    console.error("Admin get orders error:", error);

    res.status(500).json({
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

// GET /api/admin/orders/:id
const getAdminOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        message: "Invalid order id",
      });
    }

    const order = await Order.findById(id)
      .populate("user", "name email phone")
      .populate("items.product", "name image category");

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    res.status(200).json({
      message: "Order fetched successfully",
      order,
    });
  } catch (error) {
    console.error("Admin get order error:", error);

    res.status(500).json({
      message: "Failed to fetch order",
      error: error.message,
    });
  }
};

// PUT /api/admin/orders/:id/status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, paymentStatus } = req.body;

    if (!isValidId(id)) {
      return res.status(400).json({
        message: "Invalid order id",
      });
    }

    const validOrderStatus = [
      "Processing",
      "Confirmed",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];

    const validPaymentStatus = [
      "Pending",
      "Paid",
      "Failed",
    ];

    if (
      orderStatus &&
      !validOrderStatus.includes(orderStatus)
    ) {
      return res.status(400).json({
        message: "Invalid order status",
      });
    }

    if (
      paymentStatus &&
      !validPaymentStatus.includes(paymentStatus)
    ) {
      return res.status(400).json({
        message: "Invalid payment status",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // ---------------------------------------------
    // ADMIN CANCEL -> STOCK WAAPAS
    // Wahi logic jo user cancel me hai
    // ---------------------------------------------

    if (
      orderStatus === "Cancelled" &&
      order.orderStatus !== "Cancelled" &&
      order.stockDeducted === true
    ) {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }

      order.stockDeducted = false;
    }

    // ---------------------------------------------
    // CANCELLED ORDER KO WAAPAS ACTIVE KARNA
    // Stock dobara kaatna padega
    // ---------------------------------------------

    if (
      orderStatus &&
      orderStatus !== "Cancelled" &&
      order.orderStatus === "Cancelled" &&
      order.stockDeducted === false
    ) {
      for (const item of order.items) {
        const updated = await Product.findOneAndUpdate(
          {
            _id: item.product,
            stock: { $gte: item.quantity },
          },
          {
            $inc: { stock: -item.quantity },
          },
          { new: true }
        );

        if (!updated) {
          return res.status(400).json({
            message: `Cannot reopen order. Not enough stock for ${item.name}.`,
          });
        }
      }

      order.stockDeducted = true;
    }

    if (orderStatus) {
      order.orderStatus = orderStatus;
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    // Delivered COD order = paid
    if (
      orderStatus === "Delivered" &&
      !paymentStatus &&
      order.paymentStatus === "Pending"
    ) {
      order.paymentStatus = "Paid";
    }

    await order.save();

    res.status(200).json({
      message: "Order updated successfully",
      order,
    });
  } catch (error) {
    console.error("Admin update order error:", error);

    res.status(500).json({
      message: "Failed to update order",
      error: error.message,
    });
  }
};

// =====================================================
// USERS
// =====================================================

// GET /api/admin/users?search=&role=&page=&limit=
const getAdminUsers = async (req, res) => {
  try {
    const page = Math.max(toInt(req.query.page, 1), 1);
    const limit = Math.min(
      Math.max(toInt(req.query.limit, 15), 1),
      100
    );

    const filter = {};

    if (req.query.search) {
      const regex = safeRegex(req.query.search.trim());

      filter.$or = [
        { name: regex },
        { email: regex },
        { phone: regex },
      ];
    }

    if (req.query.role && req.query.role !== "All") {
      filter.role = req.query.role;
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password -resetOtp -resetToken")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),

      User.countDocuments(filter),
    ]);

    // Har user ke orders ka summary
    const userIds = users.map((user) => user._id);

    const orderStats = await Order.aggregate([
      { $match: { user: { $in: userIds } } },
      {
        $group: {
          _id: "$user",
          orders: { $sum: 1 },
          spent: {
            $sum: {
              $cond: [
                {
                  $ne: ["$orderStatus", "Cancelled"],
                },
                "$total",
                0,
              ],
            },
          },
        },
      },
    ]);

    const statsMap = {};

    orderStats.forEach((row) => {
      statsMap[String(row._id)] = row;
    });

    const usersWithStats = users.map((user) => ({
      ...user.toObject(),
      orderCount: statsMap[String(user._id)]?.orders || 0,
      totalSpent: statsMap[String(user._id)]?.spent || 0,
    }));

    res.status(200).json({
      message: "Users fetched successfully",
      users: usersWithStats,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    console.error("Admin get users error:", error);

    res.status(500).json({
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

// PUT /api/admin/users/:id/role
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!isValidId(id)) {
      return res.status(400).json({
        message: "Invalid user id",
      });
    }

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        message: "Role must be 'user' or 'admin'",
      });
    }

    // Apna hi role demote na kar de
    if (String(req.userId) === String(id)) {
      return res.status(400).json({
        message: "You cannot change your own role",
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select("-password -resetOtp -resetToken");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: `Role updated to ${role}`,
      user,
    });
  } catch (error) {
    console.error("Admin update role error:", error);

    res.status(500).json({
      message: "Failed to update role",
      error: error.message,
    });
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        message: "Invalid user id",
      });
    }

    if (String(req.userId) === String(id)) {
      return res.status(400).json({
        message: "You cannot delete your own account",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.role === "admin") {
      return res.status(400).json({
        message:
          "Demote this admin to a normal user before deleting",
      });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      message: "User deleted successfully",
      userId: id,
    });
  } catch (error) {
    console.error("Admin delete user error:", error);

    res.status(500).json({
      message: "Failed to delete user",
      error: error.message,
    });
  }
};

module.exports = {
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
};
