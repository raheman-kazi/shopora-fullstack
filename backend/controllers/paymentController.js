const crypto = require("crypto");

const getRazorpay = require("../config/razorpay");
const Order = require("../models/Order");
const Product = require("../models/Product");

// =====================================================
// CREATE RAZORPAY ORDER
// POST /api/payment/create-order
// body: { orderId }
//
// Yahan DB order pehle se bana hota hai (Pending).
// Ye sirf Razorpay ke paas ek payment order kholta hai.
// =====================================================

const createPaymentOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        message: "orderId is required",
      });
    }

    // Order dhoondo — aur confirm karo ki isi user ka hai
    const order = await Order.findOne({
      _id: orderId,
      user: req.userId,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (order.paymentStatus === "Paid") {
      return res.status(400).json({
        message: "This order is already paid",
      });
    }

    if (order.orderStatus === "Cancelled") {
      return res.status(400).json({
        message: "This order is cancelled",
      });
    }

    // -------------------------------------------------
    // IMPORTANT
    // Amount frontend se NAHI lete.
    // DB ka total hi use karte hain, warna user
    // browser me amount badal ke kam paise de sakta hai.
    //
    // Razorpay paise me leta hai: ₹1 = 100 paise
    // -------------------------------------------------

    const amountInPaise = Math.round(order.total * 100);

    if (amountInPaise < 100) {
      return res.status(400).json({
        message: "Minimum order amount is ₹1",
      });
    }

    const razorpayOrder = await getRazorpay().orders.create({
      amount: amountInPaise,
      currency: "INR",

      // Apne order number se link kar dete hain
      receipt: order.orderNumber,

      notes: {
        orderNumber: order.orderNumber,
        userId: String(req.userId),
      },
    });

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    res.status(200).json({
      message: "Payment order created",

      // Key ID public hai, frontend ko chahiye
      key: process.env.RAZORPAY_KEY_ID,

      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,

      orderNumber: order.orderNumber,
    });
  } catch (error) {
    console.error("Create payment order error:", error);

    res.status(500).json({
      message: "Failed to start payment",
      error:
        error?.error?.description || error.message,
    });
  }
};

// =====================================================
// VERIFY PAYMENT
// POST /api/payment/verify
// body: { orderId, razorpay_order_id,
//         razorpay_payment_id, razorpay_signature }
//
// Ye sabse zaroori endpoint hai.
// Frontend ka "payment ho gaya" kehna kaafi nahi.
// Razorpay signature ko apni secret key se khud
// dobara banate hain aur match karte hain.
// =====================================================

const verifyPayment = async (req, res) => {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !orderId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        message: "Incomplete payment details",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: req.userId,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // Jo razorpay order humne banaya tha, wahi aana chahiye
    if (order.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({
        message: "Payment does not match this order",
      });
    }

    // -------------------------------------------------
    // SIGNATURE CHECK
    // HMAC-SHA256 of "<razorpay_order_id>|<payment_id>"
    // key = tumhari RAZORPAY_KEY_SECRET
    // -------------------------------------------------

    const expectedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(
        `${razorpay_order_id}|${razorpay_payment_id}`
      )
      .digest("hex");

    const signatureValid =
      expectedSignature.length ===
        razorpay_signature.length &&
      crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(razorpay_signature)
      );

    if (!signatureValid) {
      order.paymentStatus = "Failed";
      await order.save();

      return res.status(400).json({
        message: "Payment verification failed",
      });
    }

    // -------------------------------------------------
    // PAYMENT CONFIRMED
    // -------------------------------------------------

    order.paymentStatus = "Paid";
    order.razorpayPaymentId = razorpay_payment_id;

    // Paid order ko seedha Confirmed kar dete hain
    if (order.orderStatus === "Processing") {
      order.orderStatus = "Confirmed";
    }

    await order.save();

    res.status(200).json({
      message: "Payment verified successfully",
      order,
    });
  } catch (error) {
    console.error("Verify payment error:", error);

    res.status(500).json({
      message: "Payment verification failed",
      error: error.message,
    });
  }
};

// =====================================================
// PAYMENT FAILED / POPUP BAND
// POST /api/payment/failed
// body: { orderId }
//
// Order cancel karke stock waapas kar dete hain,
// taaki adhoore orders inventory na roke.
// =====================================================

const markPaymentFailed = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      user: req.userId,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (order.paymentStatus === "Paid") {
      return res.status(400).json({
        message: "This order is already paid",
      });
    }

    // Stock waapas
    if (order.stockDeducted === true) {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }

      order.stockDeducted = false;
    }

    order.paymentStatus = "Failed";
    order.orderStatus = "Cancelled";

    await order.save();

    res.status(200).json({
      message: "Order cancelled, stock restored",
    });
  } catch (error) {
    console.error("Mark payment failed error:", error);

    res.status(500).json({
      message: "Failed to update order",
      error: error.message,
    });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  markPaymentFailed,
};
