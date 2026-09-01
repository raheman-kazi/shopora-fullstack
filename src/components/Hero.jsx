import React from 'react';
import './Hero.css';
import { Link } from 'react-router-dom';

const HeroSection = () => {
    return (
        <section className="hero">
            {/* Decorative background elements */}
            <div className="hero-bg">
                <div className="hero-blob blob-1"></div>
                <div className="hero-blob blob-2"></div>
                <div className="hero-grid-overlay"></div>
            </div>

            <div className="hero-container">
                {/* Content */}
                <div className="hero-content">
                    <span className="hero-badge">✦ New Arrivals This Week</span>
                    <h1 className="hero-title">
                        Discover products
                        <br />
                        you'll <span className="highlight">love</span>
                    </h1>
                    <p className="hero-subtitle">
                        Curated collections of premium products, handpicked for people who appreciate quality and style.
                    </p>
                    <div className="hero-actions">
                       <Link to="/products" className="btn-shop-now">
                            Shop Now
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14" />
                                <path d="m12 5 7 7-7 7" />
                            </svg>
                        </Link>
                       <Link to="/products" className="btn-explore">
                            Explore Collection
                        </Link>
                    </div>

                    {/* Trust indicators */}
                    <div className="hero-trust">
                        <div className="trust-item">
                            <span className="trust-number">10k+</span>
                            <span className="trust-label">Products</span>
                        </div>
                        <div className="trust-divider"></div>
                        <div className="trust-item">
                            <span className="trust-number">50k+</span>
                            <span className="trust-label">Happy Customers</span>
                        </div>
                        <div className="trust-divider"></div>
                        <div className="trust-item">
                            <span className="trust-number">4.9★</span>
                            <span className="trust-label">Average Rating</span>
                        </div>
                    </div>
                </div>

                {/* Visual Side - 3D Product Stack */}
                <div className="hero-visual">
                    
                    {/* Back Card (Left) - Sneakers */}
                    <div className="visual-card stack-card stack-back-left">
                        <img
                            src="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&q=80"
                            alt="Classic White Sneakers"
                            className="card-image"
                        />
                    </div>

                    {/* Back Card (Right) - Headphones */}
                    <div className="visual-card stack-card stack-back-right">
                        <img
                            src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80"
                            alt="Wireless Headphones"
                            className="card-image"
                        />
                    </div>

                    {/* Front Card - Watch (Main Focus) */}
                    <div className="visual-card card-main">
                        <img
                            src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80"
                            alt="Minimalist Analog Watch"
                            className="card-image"
                        />
                        <div className="card-float-tag">
                            <span className="tag-dot"></span>
                            Trending Now
                        </div>
                    </div>

                    {/* Floating Info Cards */}
                    <div className="visual-card card-float card-float-1">
                        <img
                            src="https://images.unsplash.com/photo-1541643600914-78b084683601?w=150&q=80"
                            alt="Luxury Perfume"
                        />
                        <div className="float-info">
                            <span className="float-price">$120.00</span>
                            <span className="float-name">Perfume</span>
                        </div>
                    </div>

                    <div className="visual-card card-float card-float-2">
                        <img
                            src="https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=150&q=80"
                            alt="Skincare Set"
                        />
                        <div className="float-info">
                            <span className="float-price">$45.99</span>
                            <span className="float-name">Skincare</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;