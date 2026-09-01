const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // =========================================
    // BASIC USER INFO
    // =========================================

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // =========================================
    // PASSWORD
    // Normal signup users ke liye
    // Google users ke liye optional
    // =========================================

    password: {
      type: String,
      minlength: 6,
      default: null,
    },

    // =========================================
    // GOOGLE AUTH
    // =========================================

    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    // =========================================
    // PHONE
    // Unique per user
    // =========================================

    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    // =========================================
    // ADDRESS
    // =========================================

    address: {
      type: String,
      trim: true,
      default: "",
    },

    // =========================================
    // ROLE
    // "user"  = normal customer
    // "admin" = admin panel access
    // =========================================

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // =========================================
    // PASSWORD RESET OTP
    // =========================================

    resetOtp: {
      type: String,
      default: null,
    },

    resetOtpExpires: {
      type: Date,
      default: null,
    },

    // =========================================
    // PASSWORD RESET TOKEN
    // =========================================

    resetToken: {
      type: String,
      default: null,
    },

    resetTokenExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;