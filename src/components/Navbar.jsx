import React, {useState,useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ cartCount, wishlistCount, user, onLogout }) => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [animateBadge, setAnimateBadge] = useState(false);
  const [animateWish, setAnimateWish] = useState(false);

  useEffect(() => {
    if (cartCount > 0) {
      setAnimateBadge(true);
      const timer = setTimeout(() => setAnimateBadge(false), 300);
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  useEffect(() => {
    if (wishlistCount > 0) {
      setAnimateWish(true);
      const timer = setTimeout(() => setAnimateWish(false), 300);
      return () => clearTimeout(timer);
    }
  }, [wishlistCount]);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <span className="logo-dot">●</span>
          shopora
        </Link>

        {/* Nav Links (Includes Mobile Login at the bottom) */}
        <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <li>
            <Link
              to="/"
              className={`nav-link ${isActive('/') ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/products"
              className={`nav-link ${isActive('/products') ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              Products
            </Link>
          </li>

          {user?.role === 'admin' && (
            <li>
              <Link
                to="/admin"
                className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                Admin
              </Link>
            </li>
          )}

          {/* REAL Mobile Login Button */}
          <li className="mobile-login-li">
             {user ? (
                <div className="mobile-user-info">
                  <Link to="/profile" onClick={() => setMenuOpen(false)} style={{textDecoration: 'none', color: '#111', fontWeight: 600, fontSize: '14px'}}>
                    Hi, {user.name}
                  </Link>
                  <button onClick={() => { onLogout(); setMenuOpen(false); }} className="mobile-logout-btn">Logout</button>
                </div>
              ) : (
                <Link to="/login" className="mobile-login-btn" onClick={() => setMenuOpen(false)}>
                  Login →
                </Link>
              )}
          </li>
        </ul>

        {/* Desktop Actions */}
       <div className="nav-actions-desktop">
          {/* Admin panel (admins only) */}
          {user?.role === 'admin' && (
            <Link to="/admin" className="nav-admin-btn">
              Admin
            </Link>
          )}

          {/* Wishlist */}
          <Link to="/wishlist" className="nav-icon-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            {wishlistCount > 0 && (
              <span className={`icon-badge ${animateWish ? 'badge-bounce' : ''}`}>{wishlistCount}</span>
            )}
          </Link>

 {/* Cart */}
          <Link to="/cart" className="nav-icon-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {cartCount > 0 && (
              <span className={`icon-badge ${animateBadge ? 'badge-bounce' : ''}`}>{cartCount}</span>
            )}
          </Link>

          {/* AUTH AREA: Login Button OR Profile Icon */}
          {user ? (
            <Link to="/profile" className="nav-profile-btn">
              <div className="nav-avatar">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="nav-profile-name">Hi, {user.name}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </Link>
          ) : (
            <Link to="/login" className="nav-login-btn">Login</Link>
          )}
        </div>

       {/* Mobile Right Side (Icons + Hamburger) */}
        <div className="nav-mobile-right">
          {/* If logged in, show Profile Icon on mobile, else hidden */}
          {user && (
            <Link to="/profile" className="nav-icon-btn mobile-profile-icon" onClick={() => setMenuOpen(false)}>
              <div className="mobile-avatar">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </Link>
          )}

          <Link to="/wishlist" className="nav-icon-btn mobile-icon" onClick={() => setMenuOpen(false)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            {wishlistCount > 0 && <span className="icon-badge mobile-badge">{wishlistCount}</span>}
          </Link>

          <Link to="/cart" className="nav-icon-btn mobile-icon" onClick={() => setMenuOpen(false)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {cartCount > 0 && <span className="icon-badge mobile-badge">{cartCount}</span>}
          </Link>

          <button className={`hamburger ${menuOpen ? 'active' : ''}`} onClick={toggleMenu} aria-label="Toggle menu">
            <span></span><span></span><span></span>
          </button>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;