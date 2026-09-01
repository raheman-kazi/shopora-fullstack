import React, { useState } from 'react';
import './Footer.css';
import { Link } from 'react-router-dom';

const Footer = () => {
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);

    const handleSubscribe = (e) => {
        e.preventDefault();
        if (email) {
            setSubscribed(true);
            setEmail('');
            setTimeout(() => setSubscribed(false), 3000);
        }
    };

    return (
        <footer className="footer">
            {/* Main Footer Content */}
            <div className="footer-container">
                {/* Brand & Newsletter */}
                <div className="footer-brand-section">
                    <Link to="/" className="footer-logo">
                        <span className="footer-logo-dot">●</span>
                        shopora
                    </Link>
                    <p className="footer-brand-text">
                        Curated collections of premium products, handpicked for people who appreciate quality and style.
                    </p>

                    {/* Newsletter */}
                    <form className="footer-newsletter" onSubmit={handleSubscribe}>
                        <label className="newsletter-label">Subscribe to our newsletter</label>
                        <div className="newsletter-wrapper">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="newsletter-input"
                                required
                            />
                            <button type="submit" className={`newsletter-btn ${subscribed ? 'subscribed' : ''}`}>
                                {subscribed ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 2L11 13" />
                                        <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Links Grid */}
                <div className="footer-links-grid">
                    {/* Quick Links */}
                    <div className="footer-links-col">
                        <h4 className="footer-col-title">Quick Links</h4>
                        <ul className="footer-links">
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/products">Products</Link></li>
                            <li><Link to="/categories">Categories</Link></li>
                            <li><Link to="/cart">Cart</Link></li>
                        </ul>
                    </div>

                    {/* Customer Service */}
                    <div className="footer-links-col">
                        <h4 className="footer-col-title">Customer Service</h4>
                        <ul className="footer-links">
                            <li><Link to="/contact">Contact Us</Link></li>
                            <li><Link to="/faq">FAQs</Link></li>
                            <li><Link to="/shipping">Shipping & Returns</Link></li>
                            <li><Link to="/track-order">Track Order</Link></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div className="footer-links-col">
                        <h4 className="footer-col-title">Company</h4>
                        <ul className="footer-links">
                            <li><Link to="/about">About Us</Link></li>
                            <li><Link to="/careers">Careers</Link></li>
                            <li><Link to="/privacy">Privacy Policy</Link></li>
                            <li><Link to="/terms">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="footer-bottom">
                <div className="footer-bottom-container">
                    <p className="footer-copyright">
                        © {new Date().getFullYear()} Shopora. All rights reserved.
                    </p>

                    <div className="footer-bottom-right">
                        {/* Social Icons */}
                        <div className="footer-socials">
                            <a href="#" className="social-link" aria-label="Instagram">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                                </svg>
                            </a>
                            <a href="#" className="social-link" aria-label="Twitter">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                                </svg>
                            </a>
                            <a href="#" className="social-link" aria-label="Facebook">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                                </svg>
                            </a>
                        </div>

                        {/* Payment Methods */}
                        <div className="footer-payments">
                            <span className="payment-icon visa">VISA</span>
                            <span className="payment-icon mc">MC</span>
                            <span className="payment-icon amex">AMEX</span>
                            <span className="payment-icon paypal">PayPal</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;