
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

// ==========================================
// GENERATE ORDER NUMBER
// ==========================================
const generateOrderNumber = () => {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  const randomNumber = Math.floor(
    100000 + Math.random() * 900000
  );

  return `ORD-${year}${month}${day}-${randomNumber}`;
};


// ==========================================
// CREATE ORDER
// ==========================================
const createOrder = async (req, res) => {
  try {
    const {
      shippingAddress,
      paymentMethod = "COD",
    } = req.body;


    // ------------------------------------------
    // Validate shipping address
    // ------------------------------------------

    if (
      !shippingAddress ||
      !shippingAddress.firstName ||
      !shippingAddress.email ||
      !shippingAddress.address ||
      !shippingAddress.city
    ) {
      return res.status(400).json({
        message:
          "Please provide all required shipping information",
      });
    }


    // ------------------------------------------
    // Find logged-in user's cart
    // ------------------------------------------

    const cart = await Cart.findOne({
      user: req.userId,
    }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        message: "Your cart is empty",
      });
    }


    // ------------------------------------------
    // Validate payment method
    // ------------------------------------------

    if (!["COD", "ONLINE"].includes(paymentMethod)) {
      return res.status(400).json({
        message: "Invalid payment method",
      });
    }


    // ------------------------------------------
    // CREATE ORDER ITEMS
    // ------------------------------------------

    const orderItems = [];


    // ------------------------------------------
    // CHECK STOCK + REDUCE STOCK
    // ------------------------------------------

    for (const item of cart.items) {
      const product = item.product;

      if (!product) {
        return res.status(400).json({
          message:
            "One of the products in your cart no longer exists",
        });
      }


      // Quantity validation
      if (!item.quantity || item.quantity < 1) {
        return res.status(400).json({
          message:
            `Invalid quantity for product ${product.name}`,
        });
      }


      // ------------------------------------------
      // IMPORTANT:
      // Reduce stock ONLY when order is placed
      // ------------------------------------------

      const updatedProduct =
        await Product.findOneAndUpdate(
          {
            _id: product._id,

            // Make sure enough stock exists
            stock: {
              $gte: item.quantity,
            },
          },
          {
            // Reduce stock
            $inc: {
              stock: -item.quantity,
            },
          },
          {
            new: true,
          }
        );


      // ------------------------------------------
      // NOT ENOUGH STOCK
      // ------------------------------------------

      if (!updatedProduct) {
        return res.status(400).json({
          message:
            `Not enough stock available for ${product.name}. ` +
            `Only ${product.stock} item(s) available.`,
        });
      }


      // ------------------------------------------
      // ADD ITEM TO ORDER
      // ------------------------------------------

      orderItems.push({
        product: product._id,

        name: product.name,

        price: product.price,

        quantity: item.quantity,

        image:
          product.image ||
          product.images?.[0] ||
          "",
      });
    }


    // ------------------------------------------
    // CALCULATE SUBTOTAL
    // ------------------------------------------

    const subtotal = orderItems.reduce(
      (total, item) => {
        return total + item.price * item.quantity;
      },
      0
    );


    // ------------------------------------------
    // CALCULATE SHIPPING
    // ------------------------------------------

    const shipping =
      subtotal > 999 ? 0 : 49;


    // ------------------------------------------
    // CALCULATE TOTAL
    // ------------------------------------------

    const total =
      subtotal + shipping;


    // ------------------------------------------
    // CREATE ORDER
    // ------------------------------------------

    const order = await Order.create({
      orderNumber: generateOrderNumber(),

      user: req.userId,

      items: orderItems,

      shippingAddress,

      subtotal,

      shipping,

      total,

      paymentMethod,

      paymentStatus: "Pending",

      orderStatus: "Processing",

      // IMPORTANT:
      // This tells us that stock was deducted
      stockDeducted: true,
    });


    // ------------------------------------------
    // CLEAR CART
    // ------------------------------------------

    cart.items = [];

    await cart.save();


    // ------------------------------------------
    // RESPONSE
    // ------------------------------------------

    res.status(201).json({
      message:
        "Order placed successfully",

      order,
    });


  } catch (error) {
    console.error(
      "Create order error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to create order",

      error: error.message,
    });
  }
};


// ==========================================
// GET MY ORDERS
// ==========================================
const getMyOrders = async (req, res) => {
  try {

    const orders =
      await Order.find({
        user: req.userId,
      })
        .populate("items.product")
        .sort({
          createdAt: -1,
        });


    res.status(200).json({
      message:
        "Orders fetched successfully",

      orders,
    });

  } catch (error) {

    console.error(
      "Get my orders error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to fetch orders",

      error: error.message,
    });
  }
};


// ==========================================
// GET SINGLE ORDER
// ==========================================
const getOrderById = async (req, res) => {
  try {

    const { id } = req.params;


    const order =
      await Order.findOne({
        _id: id,

        user: req.userId,
      })
        .populate("items.product");


    if (!order) {
      return res.status(404).json({
        message:
          "Order not found",
      });
    }


    res.status(200).json({
      message:
        "Order fetched successfully",

      order,
    });

  } catch (error) {

    console.error(
      "Get order error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to fetch order",

      error: error.message,
    });
  }
};


// ==========================================
// CANCEL ORDER
// ==========================================
const cancelOrder = async (req, res) => {
  try {

    const { id } = req.params;


    // ------------------------------------------
    // FIND ORDER
    // ------------------------------------------

    const order =
      await Order.findOne({
        _id: id,

        user: req.userId,
      });


    if (!order) {
      return res.status(404).json({
        message:
          "Order not found",
      });
    }


    // ------------------------------------------
    // CHECK CANCELLATION STATUS
    // ------------------------------------------

    if (
      order.orderStatus !== "Processing" &&
      order.orderStatus !== "Confirmed"
    ) {
      return res.status(400).json({
        message:
          `Order cannot be cancelled because it is already ${order.orderStatus}`,
      });
    }


    // ------------------------------------------
    // RESTORE STOCK
    // ------------------------------------------

    // Stock tabhi restore hoga jab
    // order place karte waqt stock deduct hua tha.

    if (order.stockDeducted === true) {

      for (const item of order.items) {

        await Product.findByIdAndUpdate(
          item.product,

          {
            $inc: {
              stock: item.quantity,
            },
          }
        );
      }


      // ------------------------------------------
      // VERY IMPORTANT
      // ------------------------------------------
      // Isko false kar rahe hain taaki
      // same order dobara cancel hone par
      // stock dobara increase na ho.

      order.stockDeducted = false;
    }


    // ------------------------------------------
    // CHANGE ORDER STATUS
    // ------------------------------------------

    order.orderStatus =
      "Cancelled";


    // ------------------------------------------
    // SAVE ORDER
    // ------------------------------------------

    await order.save();


    // ------------------------------------------
    // RESPONSE
    // ------------------------------------------

    res.status(200).json({
      message:
        "Order cancelled successfully",

      order,
    });


  } catch (error) {

    console.error(
      "Cancel order error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to cancel order",

      error: error.message,
    });
  }
};


// ==========================================
// EXPORT
// ==========================================

module.exports = {
  createOrder,

  getMyOrders,

  getOrderById,

  cancelOrder,
};
