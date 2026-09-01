import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import './ProfilePage.css';
import { useOutletContext } from "react-router-dom";
import { API_BASE } from '../config';

const ProfilePage = ({ user, onLogout, wishlistItems, cartItems, onUserUpdate }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Logout handler
  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  // Active link logic for sidebar
  const isActive = (path) => location.pathname === path;

  return (
    <div className="profile-wrapper">
      <div className="profile-container">

        {/* Sidebar */}
        <aside className="profile-sidebar">
          <div className="profile-header">
            <div className="profile-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <h2>{user?.name || 'User'}</h2>
            <p>{user?.email || 'user@example.com'}</p>
          </div>

          <nav className="profile-menu">
            <Link
              to="/profile"
              className={`profile-menu-link ${isActive('/profile') ? 'active' : ''}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
              </svg>
              Personal Information
            </Link>

            <Link
              to="/profile/orders"
              className={`profile-menu-link ${isActive('/profile/orders') ? 'active' : ''}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              My Orders
            </Link>

            <Link
              to="/wishlist"
              className={`profile-menu-link ${isActive('/wishlist') ? 'active' : ''}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              Wishlist
              {wishlistItems.length > 0 && <span className="profile-badge">{wishlistItems.length}</span>}
            </Link>

            <Link
              to="/cart"
              className={`profile-menu-link ${isActive('/cart') ? 'active' : ''}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              Cart
              {cartItems.length > 0 && <span className="profile-badge">{cartItems.length}</span>}
            </Link>

            <div className="profile-menu-divider"></div>

            <button onClick={handleLogout} className="profile-menu-link logout-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Logout
            </button>
          </nav>
        </aside>

        {/* Main Content Area (Renders child routes) */}
        <main className="profile-content">
          <Outlet
            context={{
              user,
              onUserUpdate,
            }}
          />
        </main>

      </div>
    </div>
  );
};

// --- Sub-Components for the Content Area ---

export const PersonalInfo = () => {
  const { user, onUserUpdate } = useOutletContext();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Load user data into form
  useEffect(() => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
    });
  }, [user]);

  // Handle input
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Save profile
  const handleSave = async (e) => {
    e.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please login first.");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/auth/profile`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            name: formData.name,
            phone: formData.phone,
            address: formData.address,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to update profile.");
        return;
      }

      // Update App.jsx auth user
      if (onUserUpdate) {
        onUserUpdate(data.user);
      }

      setMessage("Profile updated successfully!");

      setTimeout(() => {
        setMessage("");
      }, 5000);

    } catch (error) {
      console.error("Profile update error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="content-card">

      <h3>Personal Information</h3>

      <p className="content-subtitle">
        Manage your account details and settings.
      </p>

      <form onSubmit={handleSave}>

        <div className="info-grid">

          {/* Name */}
          <div className="info-group">
            <label>Full Name</label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>


          {/* Email */}
          <div className="info-group">
            <label>Email Address</label>

            <input
              type="email"
              name="email"
              value={formData.email}
              readOnly
            />
          </div>


          {/* Phone */}
          <div className="info-group">
            <label>Phone Number</label>

            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Add your phone number"
            />
          </div>


          {/* Address */}
          <div className="info-group">
            <label>Address</label>

            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Add your home address"
            />
          </div>

        </div>


        {/* Success message */}
        {message && (
          <p className="profile-success-message">
            {message}
          </p>
        )}




        {/* Error message */}
        {error && (
          <p className="profile-error-message">
            {error}
          </p>
        )}


        <button
          type="submit"
          className="save-info-btn"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>

      </form>

    </div>
  );
};

export const MyOrders = () => (
  <div className="content-card empty-state-card">
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line>
    </svg>
    <h3>No orders yet</h3>
    <p>When you place your first order, it will appear here.</p>
    <Link to="/products" className="content-action-btn">Start Shopping</Link>
  </div>
);

export default ProfilePage;