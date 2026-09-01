import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './OrderSuccessPage.css';

const OrderSuccessPage = () => {
  const location = useLocation();
  // Get the order ID passed via state from the Checkout page
  const orderId = location.state?.orderId || 'ORD-000000';

  return (
    <div className="success-wrapper">
      <div className="success-container">
        {/* Animated Checkmark Circle */}
        <div className="success-icon-wrapper">
          <div className="success-icon-circle">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        </div>

        <h1>Order Placed Successfully!</h1>
        <p className="success-subtitle">
          Thank you for your purchase. We've received your order and will begin processing it shortly.
        </p>

        {/* Order Details Card */}
        <div className="success-details-card">
          <div className="success-detail-row">
            <span className="detail-label">Order Number</span>
            <span className="detail-value">{orderId}</span>
          </div>
          <div className="success-detail-row">
            <span className="detail-label">Status</span>
            <span className="detail-value status-processing-badge">
              <span className="detail-dot"></span>
              Processing
            </span>
          </div>
          <div className="success-detail-row">
            <span className="detail-label">Estimated Delivery</span>
            <span className="detail-value">3 - 5 Business Days</span>
          </div>
        </div>

        <p className="success-confirmation-text">
          A confirmation email has been sent to your registered email address. You can also track your order status in your account dashboard.
        </p>

        {/* Action Buttons */}
        <div className="success-actions">
          <Link to="/profile/orders" className="success-btn primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            View My Orders
          </Link>
          <Link to="/products" className="success-btn secondary">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;