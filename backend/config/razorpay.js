const Razorpay = require("razorpay");

// =====================================================
// RAZORPAY INSTANCE (lazy)
//
// Instance tabhi banta hai jab pehli baar payment
// request aati hai. Faayda: keys na hone par pura
// server crash nahi hota — sirf payment endpoint
// ek saaf error deta hai.
// =====================================================

let instance = null;

const getRazorpay = () => {
  if (instance) {
    return instance;
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    const error = new Error(
      "Razorpay keys missing. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend/.env"
    );
    error.isConfigError = true;
    throw error;
  }

  instance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  return instance;
};

module.exports = getRazorpay;
