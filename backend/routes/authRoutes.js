const express = require("express");
const passport = require("../config/passport");
const {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  googleAuthCallback,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================================
// REGISTER
// =====================================================

router.post(
  "/register",
  registerUser
);


// =====================================================
// LOGIN
// =====================================================

router.post(
  "/login",
  loginUser
);


// =====================================================
// GOOGLE AUTHENTICATION
// =====================================================

// Start Google Login / Signup
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);


// Google Callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/api/auth/google/failure",
  }),
  googleAuthCallback
);


// Google Authentication Failure
router.get(
  "/google/failure",
  (req, res) => {
    res.redirect(
      `${process.env.FRONTEND_URL}/login?error=google_auth_failed`
    );
  }
);


// =====================================================
// FORGOT PASSWORD
// =====================================================

// Email OR Phone → Send OTP
router.post(
  "/forgot-password",
  forgotPassword
);


// OTP Verification
router.post(
  "/verify-reset-otp",
  verifyResetOtp
);


// New Password
router.post(
  "/reset-password",
  resetPassword
);


// =====================================================
// PROFILE
// =====================================================

router.get(
  "/profile",
  protect,
  getProfile
);


router.put(
  "/profile",
  protect,
  updateProfile
);


module.exports = router;