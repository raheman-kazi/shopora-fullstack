const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// =====================================================
// EMAIL TRANSPORTER
// =====================================================

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


// =====================================================
// REGISTER USER
// =====================================================

const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
    } = req.body;

    // =========================
    // REQUIRED FIELDS
    // =========================

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please fill all required fields",
      });
    }

    // =========================
    // CLEAN DATA
    // =========================

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone?.trim() || undefined;

    // =========================
    // VALIDATE PHONE
    // =========================

    if (
      cleanPhone &&
      !/^[0-9]{10}$/.test(cleanPhone)
    ) {
      return res.status(400).json({
        message: "Please enter a valid 10-digit phone number",
      });
    }

    // =========================
    // CHECK EMAIL
    // =========================

    const existingEmail = await User.findOne({
      email: cleanEmail,
    });

    if (existingEmail) {
      return res.status(400).json({
        message: "Email is already registered",
      });
    }

    // =========================
    // CHECK PHONE
    // =========================

    if (cleanPhone) {
      const existingPhone = await User.findOne({
        phone: cleanPhone,
      });

      if (existingPhone) {
        return res.status(400).json({
          message: "Phone number is already registered",
        });
      }
    }

    // =========================
    // HASH PASSWORD
    // =========================

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // =========================
    // CREATE USER
    // =========================

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,

      ...(cleanPhone && {
        phone: cleanPhone,
      }),

      address: "",
    });

    // =========================
    // RESPONSE
    // =========================

    res.status(201).json({
      message: "User registered successfully",

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        address: user.address || "",
        role: user.role || "user",
      },
    });

  } catch (error) {

    if (error.code === 11000) {

      if (error.keyPattern?.email) {
        return res.status(400).json({
          message: "Email is already registered",
        });
      }

      if (error.keyPattern?.phone) {
        return res.status(400).json({
          message: "Phone number is already registered",
        });
      }
    }

    console.error(
      "Register error:",
      error
    );

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// =====================================================
// LOGIN USER
// =====================================================

const loginUser = async (req, res) => {
  try {

    const {
      emailOrPhone,
      password,
    } = req.body;

    // =========================
    // REQUIRED FIELDS
    // =========================

    if (!emailOrPhone || !password) {
      return res.status(400).json({
        message:
          "Please enter email or phone number and password",
      });
    }

    // =========================
    // CLEAN LOGIN INPUT
    // =========================

    const loginValue =
      emailOrPhone.trim();

    // =========================
    // CHECK EMAIL OR PHONE
    // =========================

    const isEmail =
      loginValue.includes("@");

    let user;

    if (isEmail) {

      user = await User.findOne({
        email: loginValue.toLowerCase(),
      });

    } else {

      user = await User.findOne({
        phone: loginValue,
      });

    }

    // =========================
    // USER NOT FOUND
    // =========================

    if (!user) {
      return res.status(401).json({
        message:
          "Invalid email/phone or password",
      });
    }

    // =========================
    // CHECK PASSWORD
    // =========================

    const isPasswordCorrect =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message:
          "Invalid email/phone or password",
      });
    }

    // =========================
    // CREATE JWT
    // =========================

    const token = jwt.sign(
      {
        userId: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // =========================
    // RESPONSE
    // =========================

    res.status(200).json({

      message: "Login successful",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        address: user.address || "",
        role: user.role || "user",
      },
    });

  } catch (error) {

    console.error(
      "Login error:",
      error
    );

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// =====================================================
// FORGOT PASSWORD - SEND OTP
// =====================================================

const forgotPassword = async (req, res) => {
  try {

    const {
      emailOrPhone,
    } = req.body;

    // =========================
    // REQUIRED
    // =========================

    if (!emailOrPhone) {
      return res.status(400).json({
        message: "Please enter your email or phone number",
      });
    }

    const value =
      emailOrPhone.trim();

    // =========================
    // FIND USER
    // =========================

    let user;

    if (value.includes("@")) {

      user = await User.findOne({
        email: value.toLowerCase(),
      });

    } else {

      if (!/^[0-9]{10}$/.test(value)) {
        return res.status(400).json({
          message: "Please enter a valid 10-digit phone number",
        });
      }

      user = await User.findOne({
        phone: value,
      });
    }

    // =========================
    // USER NOT FOUND
    // =========================

    if (!user) {
      return res.status(404).json({
        message:
          "No account found with this email or phone number",
      });
    }

    // =========================
    // GENERATE 6 DIGIT OTP
    // =========================

    const otp =
      Math.floor(
        100000 + Math.random() * 900000
      ).toString();

    // =========================
    // HASH OTP
    // =========================

    const hashedOtp =
      crypto
        .createHash("sha256")
        .update(otp)
        .digest("hex");

    // =========================
    // OTP EXPIRES IN 10 MINUTES
    // =========================

    user.resetOtp = hashedOtp;

    user.resetOtpExpires =
      new Date(
        Date.now() + 10 * 60 * 1000
      );

    // Clear old reset token
    user.resetToken = null;
    user.resetTokenExpires = null;

    await user.save();

    // =========================
    // SEND OTP EMAIL
    // =========================

    await transporter.sendMail({

      from: process.env.EMAIL_USER,

      to: user.email,

      subject: "Shopora Password Reset OTP",

      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 500px;
          margin: auto;
          padding: 30px;
          border: 1px solid #eee;
          border-radius: 10px;
        ">

          <h2 style="margin-bottom: 10px;">
            Shopora Password Reset
          </h2>

          <p>
            We received a request to reset your Shopora password.
          </p>

          <p>
            Your OTP is:
          </p>

          <div style="
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            padding: 15px;
            background: #f5f5f5;
            text-align: center;
            border-radius: 8px;
            margin: 20px 0;
          ">
            ${otp}
          </div>

          <p>
            This OTP will expire in <strong>10 minutes</strong>.
          </p>

          <p style="color: #777;">
            If you did not request a password reset,
            you can safely ignore this email.
          </p>

          <p>
            — Shopora Team
          </p>

        </div>
      `,
    });

    // =========================
    // RESPONSE
    // =========================

    res.status(200).json({
      message:
        "OTP sent successfully to your registered email",
    });

  } catch (error) {

    console.error(
      "Forgot password error:",
      error
    );

    res.status(500).json({
      message:
        "Unable to send OTP. Please try again later.",
    });
  }
};


// =====================================================
// VERIFY OTP
// =====================================================

const verifyResetOtp = async (req, res) => {
  try {

    const {
      emailOrPhone,
      otp,
    } = req.body;

    // =========================
    // REQUIRED
    // =========================

    if (!emailOrPhone || !otp) {
      return res.status(400).json({
        message:
          "Email/phone and OTP are required",
      });
    }

    // =========================
    // FIND USER
    // =========================

    const value =
      emailOrPhone.trim();

    let user;

    if (value.includes("@")) {

      user = await User.findOne({
        email: value.toLowerCase(),
      });

    } else {

      user = await User.findOne({
        phone: value,
      });
    }

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // =========================
    // CHECK OTP EXISTS
    // =========================

    if (
      !user.resetOtp ||
      !user.resetOtpExpires
    ) {
      return res.status(400).json({
        message:
          "OTP is invalid or has expired",
      });
    }

    // =========================
    // CHECK EXPIRY
    // =========================

    if (
      user.resetOtpExpires < new Date()
    ) {

      user.resetOtp = null;
      user.resetOtpExpires = null;

      await user.save();

      return res.status(400).json({
        message:
          "OTP has expired. Please request a new OTP.",
      });
    }

    // =========================
    // HASH ENTERED OTP
    // =========================

    const hashedOtp =
      crypto
        .createHash("sha256")
        .update(otp.toString())
        .digest("hex");

    // =========================
    // COMPARE OTP
    // =========================

    if (
      hashedOtp !== user.resetOtp
    ) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    // =========================
    // CREATE RESET TOKEN
    // =========================

    const resetToken =
      crypto.randomBytes(32).toString("hex");

    const hashedResetToken =
      crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    // =========================
    // RESET TOKEN EXPIRES
    // 10 MINUTES
    // =========================

    user.resetToken =
      hashedResetToken;

    user.resetTokenExpires =
      new Date(
        Date.now() + 10 * 60 * 1000
      );

    // OTP can no longer be reused
    user.resetOtp = null;
    user.resetOtpExpires = null;

    await user.save();

    // =========================
    // RESPONSE
    // =========================

    res.status(200).json({

      message:
        "OTP verified successfully",

      resetToken,

    });

  } catch (error) {

    console.error(
      "Verify OTP error:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


// =====================================================
// RESET PASSWORD
// =====================================================

const resetPassword = async (req, res) => {
  try {

    const {
      resetToken,
      newPassword,
    } = req.body;

    // =========================
    // REQUIRED
    // =========================

    if (
      !resetToken ||
      !newPassword
    ) {
      return res.status(400).json({
        message:
          "Reset token and new password are required",
      });
    }

    // =========================
    // PASSWORD LENGTH
    // =========================

    if (newPassword.length < 6) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters",
      });
    }

    // =========================
    // HASH RESET TOKEN
    // =========================

    const hashedResetToken =
      crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    // =========================
    // FIND USER
    // =========================

    const user =
      await User.findOne({
        resetToken: hashedResetToken,

        resetTokenExpires: {
          $gt: new Date(),
        },
      });

    if (!user) {
      return res.status(400).json({
        message:
          "Reset session is invalid or expired. Please start again.",
      });
    }

    // =========================
    // HASH NEW PASSWORD
    // =========================

    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        10
      );

    // =========================
    // UPDATE PASSWORD
    // =========================

    user.password =
      hashedPassword;

    // =========================
    // CLEAR RESET DATA
    // =========================

    user.resetToken = null;
    user.resetTokenExpires = null;

    user.resetOtp = null;
    user.resetOtpExpires = null;

    await user.save();

    // =========================
    // RESPONSE
    // =========================

    res.status(200).json({
      message:
        "Password reset successfully. You can now log in.",
    });

  } catch (error) {

    console.error(
      "Reset password error:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


// =====================================================
// GET PROFILE
// =====================================================

const getProfile = async (req, res) => {
  try {

    const user =
      await User.findById(
        req.userId
      ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        address: user.address || "",
        role: user.role || "user",
      },

    });

  } catch (error) {

    console.error(
      "Get profile error:",
      error
    );

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};



// =====================================================
// GOOGLE AUTH CALLBACK
// =====================================================

const googleAuthCallback = async (req, res) => {
  try {
    // =========================================
    // GOOGLE USER MIL GAYA
    // =========================================

    const user = req.user;

    if (!user) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=google_auth_failed`
      );
    }

    // =========================================
    // CREATE JWT
    // =========================================

    const token = jwt.sign(
      {
        userId: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // =========================================
    // SEND TOKEN TO FRONTEND
    // =========================================

    const userData = encodeURIComponent(
      JSON.stringify({
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        address: user.address || "",
        role: user.role || "user",
      })
    );

    // =========================================
    // REDIRECT TO FRONTEND
    // =========================================

    res.redirect(
      `${process.env.FRONTEND_URL}/auth/google/success?token=${token}&user=${userData}`
    );

  } catch (error) {
    console.error(
      "Google callback error:",
      error
    );

    res.redirect(
      `${process.env.FRONTEND_URL}/login?error=google_auth_failed`
    );
  }
};


// =====================================================
// UPDATE PROFILE
// =====================================================

const updateProfile = async (req, res) => {
  try {

    const {
      name,
      phone,
      address,
    } = req.body;

    // =========================
    // NAME REQUIRED
    // =========================

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Name is required",
      });
    }

    // =========================
    // FIND USER
    // =========================

    const user =
      await User.findById(
        req.userId
      );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // =========================
    // CLEAN PHONE
    // =========================

    const cleanPhone =
      phone?.trim() || "";

    // =========================
    // VALIDATE PHONE
    // =========================

    if (
      cleanPhone &&
      !/^[0-9]{10}$/.test(cleanPhone)
    ) {
      return res.status(400).json({
        message:
          "Please enter a valid 10-digit phone number",
      });
    }

    // =========================
    // CHECK PHONE DUPLICATE
    // =========================

    if (cleanPhone) {

      const existingPhone =
        await User.findOne({
          phone: cleanPhone,
          _id: {
            $ne: user._id,
          },
        });

      if (existingPhone) {
        return res.status(400).json({
          message:
            "Phone number is already registered to another user",
        });
      }
    }

    // =========================
    // UPDATE PROFILE
    // =========================

    user.name =
      name.trim();

    user.phone =
      cleanPhone || undefined;

    user.address =
      address?.trim() || "";

    await user.save();

    // =========================
    // RESPONSE
    // =========================

    res.status(200).json({

      message:
        "Profile updated successfully",

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        address: user.address || "",
        role: user.role || "user",
      },

    });

  } catch (error) {

    if (error.code === 11000) {

      if (error.keyPattern?.phone) {
        return res.status(400).json({
          message:
            "Phone number is already registered to another user",
        });
      }

      if (error.keyPattern?.email) {
        return res.status(400).json({
          message:
            "Email is already registered",
        });
      }
    }

    console.error(
      "Update profile error:",
      error
    );

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {
  registerUser,
  loginUser,

  forgotPassword,
  verifyResetOtp,
  resetPassword,

  getProfile,
  updateProfile,
   googleAuthCallback,
};