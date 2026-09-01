import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AuthPage.css';
import { API_BASE } from '../config';

const AuthPage = ({ onLogin }) => {
  const [authMode, setAuthMode] = useState('login');
  const [forgotStep, setForgotStep] = useState(0);
  const [resetToken, setResetToken] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    otp: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      otp: '',
    });
    setError('');
    setSuccess('');
    setResetToken('');
    setForgotStep(0);
  };

  const goToLogin = () => {
    resetForm();
    setAuthMode('login');
  };

  const goToRegister = () => {
    resetForm();
    setAuthMode('register');
  };

  const openForgotPassword = () => {
    resetForm();
    setAuthMode('forgot');
    setForgotStep(0);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
    setSuccess('');
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/api/auth/google`;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const emailOrPhone = formData.email.trim();

    if (!emailOrPhone) {
      return setError('Please enter your email or phone number.');
    }

    if (emailOrPhone.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailOrPhone)) {
        return setError('Please enter a valid email address.');
      }
    }

    if (!emailOrPhone.includes('@') && !/^[0-9]{10}$/.test(emailOrPhone)) {
      return setError('Please enter a valid 10-digit phone number.');
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone }),
      });

      const data = await response.json();

      if (!response.ok) {
        return setError(data.message || 'Unable to send OTP.');
      }

      setSuccess(data.message || 'OTP sent successfully to your registered email.');
      setForgotStep(1);
    } catch (error) {
      console.error('Send OTP error:', error);
      setError('Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const emailOrPhone = formData.email.trim();
    const otp = formData.otp.trim();

    if (!otp) {
      return setError('Please enter the OTP.');
    }

    if (!/^[0-9]{6}$/.test(otp)) {
      return setError('OTP must be exactly 6 digits.');
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/api/auth/verify-reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        return setError(data.message || 'Invalid OTP.');
      }

      setResetToken(data.resetToken);
      setSuccess('OTP verified successfully.');
      setForgotStep(2);
    } catch (error) {
      console.error('Verify OTP error:', error);
      setError('Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const newPassword = formData.password.trim();
    const confirmPassword = formData.confirmPassword.trim();

    if (!newPassword || !confirmPassword) {
      return setError('Please fill in both password fields.');
    }

    if (newPassword.length < 6) {
      return setError('Password must be at least 6 characters.');
    }

    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    if (!resetToken) {
      return setError('Reset session expired. Please start again.');
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        return setError(data.message || 'Unable to reset password.');
      }

      setSuccess('Password changed successfully! Redirecting to login...');
      setResetToken('');

      setTimeout(() => {
        setAuthMode('login');
        setForgotStep(0);
        setFormData({
          name: '',
          email: formData.email,
          phone: '',
          password: '',
          confirmPassword: '',
          otp: '',
        });
        setSuccess('');
        setError('');
      }, 1500);
    } catch (error) {
      console.error('Reset password error:', error);
      setError('Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (authMode === 'login') {
      if (!formData.email || !formData.password) {
        return setError('Please enter your email/phone and password.');
      }

      try {
        setLoading(true);

        const response = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            emailOrPhone: formData.email.trim(),
            password: formData.password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          return setError(data.message || 'Login failed.');
        }

        localStorage.setItem('token', data.token);
        onLogin(data.user);
        navigate('/');
      } catch (error) {
        console.error('Login error:', error);
        setError('Unable to connect to server.');
      } finally {
        setLoading(false);
      }

      return;
    }

    if (authMode === 'register') {
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
        return setError('Please fill in all required fields.');
      }

      if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) {
        return setError('Please enter a valid 10-digit phone number.');
      }

      if (formData.password.length < 6) {
        return setError('Password must be at least 6 characters.');
      }

      if (formData.password !== formData.confirmPassword) {
        return setError('Passwords do not match.');
      }

      try {
        setLoading(true);

        const response = await fetch(`${API_BASE}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim().toLowerCase(),
            phone: formData.phone ? formData.phone.trim() : undefined,
            password: formData.password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          return setError(data.message || 'Registration failed.');
        }

        alert('Account created successfully!');

        setAuthMode('login');
        setFormData({
          name: '',
          email: formData.email,
          phone: '',
          password: '',
          confirmPassword: '',
          otp: '',
        });
      } catch (error) {
        console.error('Registration error:', error);
        setError('Unable to connect to server.');
      } finally {
        setLoading(false);
      }
    }
  };

  const getVisualTitle = () => {
    if (authMode === 'login') return 'Welcome back!';
    if (authMode === 'register') return 'Join Shopora today';
    if (forgotStep === 0) return 'Reset your password';
    if (forgotStep === 1) return 'Check your email';
    return 'Create a new password';
  };

  const getVisualDescription = () => {
    if (authMode === 'login') return 'Log in to access your wishlist, cart, and exclusive deals.';
    if (authMode === 'register') return 'Create an account to start your premium shopping experience.';
    if (forgotStep === 0) return 'Enter your registered email or phone number to receive a verification code.';
    if (forgotStep === 1) return 'Enter the 6-digit verification code sent to your registered email.';
    return 'Choose a strong new password for your Shopora account.';
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">

        {/* LEFT SIDE */}
        <div className="auth-visual">
          <div className="auth-visual-content">
            <Link to="/" className="auth-logo">
              <span className="logo-dot">●</span>
              shopora
            </Link>
            <h2>{getVisualTitle()}</h2>
            <p>{getVisualDescription()}</p>
            <div className="auth-visual-stats">
              <div className="auth-stat">
                <span className="auth-stat-num">10k+</span>
                <span className="auth-stat-label">Products</span>
              </div>
              <div className="auth-stat">
                <span className="auth-stat-num">50k+</span>
                <span className="auth-stat-label">Happy Customers</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="auth-forms-area">

          <Link to="/" className="auth-mobile-logo">
            <span className="logo-dot">●</span>
            shopora
          </Link>

          {/* ====== LOGIN ====== */}
          {authMode === 'login' && (
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <h1>Log In</h1>
              <p className="auth-subtitle">Enter your credentials to continue</p>

              {error && <div className="auth-error">{error}</div>}

              <div className="input-group">
                <label>Email or Phone Number</label>
                <input
                  type="text"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email or phone number"
                  required
                />
              </div>

              <div className="input-group">
                <div className="label-row">
                  <label>Password</label>
                  <button type="button" className="forgot-link" onClick={openForgotPassword}>
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? 'Logging in...' : 'Log In'}
              </button>

              {/* ── or ── divider */}
              <div className="auth-divider">
                <span className="auth-divider-line"></span>
                <span className="auth-divider-text">or</span>
                <span className="auth-divider-line"></span>
              </div>

              {/* Continue with Google */}
              <button
                type="button"
                className="auth-google-btn"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <svg className="auth-google-icon" viewBox="0 0 24 24" width="20" height="20">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>

              <p className="auth-switch-text">
                Don't have an account?{' '}
                <button type="button" onClick={goToRegister} className="switch-btn">
                  Sign Up
                </button>
              </p>
            </form>
          )}

          {/* ====== REGISTER ====== */}
          {authMode === 'register' && (
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <h1>Create Account</h1>
              <p className="auth-subtitle">Fill in the details to get started</p>

              {error && <div className="auth-error">{error}</div>}

              <div className="input-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="input-group">
                <label>Phone Number (Optional)</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  maxLength="10"
                  inputMode="numeric"
                />
              </div>

              <div className="input-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  required
                />
              </div>

              <div className="input-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>

              {/* ── or ── divider */}
              <div className="auth-divider">
                <span className="auth-divider-line"></span>
                <span className="auth-divider-text">or</span>
                <span className="auth-divider-line"></span>
              </div>

              {/* Continue with Google */}
              <button
                type="button"
                className="auth-google-btn"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <svg className="auth-google-icon" viewBox="0 0 24 24" width="20" height="20">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>

              <p className="auth-switch-text">
                Already have an account?{' '}
                <button type="button" onClick={goToLogin} className="switch-btn">
                  Log In
                </button>
              </p>
            </form>
          )}

          {/* ====== FORGOT PASSWORD — STEP 1 ====== */}
          {authMode === 'forgot' && forgotStep === 0 && (
            <form className="auth-form" onSubmit={handleSendOtp} noValidate>
              <h1>Forgot Password?</h1>
              <p className="auth-subtitle">Enter your registered email or phone number.</p>

              {error && <div className="auth-error">{error}</div>}
              {success && <div className="auth-success">{success}</div>}

              <div className="input-group">
                <label>Email or Phone Number</label>
                <input
                  type="text"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email or phone number"
                  autoComplete="email"
                  required
                />
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>

              <p className="auth-switch-text">
                Remember your password?{' '}
                <button type="button" onClick={goToLogin} className="switch-btn">
                  Log In
                </button>
              </p>
            </form>
          )}

          {/* ====== FORGOT PASSWORD — STEP 2 ====== */}
          {authMode === 'forgot' && forgotStep === 1 && (
            <form className="auth-form" onSubmit={handleVerifyOtp} noValidate>
              <h1>Verify OTP</h1>
              <p className="auth-subtitle">Enter the 6-digit code sent to your registered email.</p>

              {error && <div className="auth-error">{error}</div>}
              {success && <div className="auth-success">{success}</div>}

              <div className="input-group">
                <label>Verification Code</label>
                <input
                  type="text"
                  name="otp"
                  value={formData.otp}
                  onChange={handleChange}
                  placeholder="Enter 6-digit OTP"
                  maxLength="6"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                />
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <p className="auth-switch-text">
                Wrong email/phone?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setForgotStep(0);
                    setFormData((prev) => ({ ...prev, otp: '' }));
                    setError('');
                    setSuccess('');
                  }}
                  className="switch-btn"
                >
                  Change
                </button>
              </p>
            </form>
          )}

          {/* ====== FORGOT PASSWORD — STEP 3 ====== */}
          {authMode === 'forgot' && forgotStep === 2 && (
            <form className="auth-form" onSubmit={handleResetPassword} noValidate>
              <h1>Create New Password</h1>
              <p className="auth-subtitle">Enter your new password below.</p>

              {error && <div className="auth-error">{error}</div>}
              {success && <div className="auth-success">{success}</div>}

              <div className="input-group">
                <label>New Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="input-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default AuthPage;