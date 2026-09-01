import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
  return (
    <div className="notfound-wrapper">
      <div className="notfound-container">
        {/* Decorative Blobs matching the Hero section */}
        <div className="notfound-bg">
          <div className="notfound-blob blob-1"></div>
          <div className="notfound-blob blob-2"></div>
        </div>

        <div className="notfound-content">
          <h1 className="notfound-code">404</h1>
          <h2 className="notfound-title">Page Not Found</h2>
          <p className="notfound-text">
            Oops! The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>

          <div className="notfound-actions">
            <Link to="/" className="notfound-btn primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11"></path>
              </svg>
              Go Home
            </Link>
            <Link to="/products" className="notfound-btn secondary">
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;