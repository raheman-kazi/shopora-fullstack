import React from 'react';
import './CategoryCards.css';
import { Link } from 'react-router-dom';
const categories = [
    {
        name: 'Men',
        // Clean menswear aesthetic
        image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=500&q=80',
        itemCount: '2.5k+ Items',
    },
    {
        name: 'Women',
        // Elegant, modern women's fashion
        image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&q=80',
        itemCount: '3.2k+ Items',
    },
    {
        name: 'Electronics',
        // Sleek, modern tech gadgets
        image: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=500&q=80',
        itemCount: '1.8k+ Items',
    },
    {
        name: 'Beauty',
        // Aesthetic, premium skincare/makeup vibes
        image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80',
        itemCount: '1.4k+ Items',
    },
];

const Categories = () => {
    return (
        <section className="categories-section">
            <div className="categories-container">
                {/* Section Header */}
                <div className="categories-header">
                    <span className="categories-tag">Browse by</span>
                    <h2 className="categories-title">Categories</h2>
                    <p className="categories-subtitle">
                        Find exactly what you're looking for in our curated collections
                    </p>
                </div>

                {/* Category Grid */}
                <div className="categories-grid">
                    {categories.map((cat, index) => (
                        <Link to={`/products?category=${cat.name.toLowerCase()}`} className="category-card" key={index}>
                            <div className="category-image-wrapper">
                                <img src={cat.image} alt={cat.name} className="category-image" />
                                <div className="category-overlay"></div>
                            </div>

                            <div className="category-info">
                                <span className="category-count">{cat.itemCount}</span>
                                <h3 className="category-name">{cat.name}</h3>
                                <span className="category-cta">
                                    Shop
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M5 12h14" />
                                        <path d="m12 5 7 7-7 7" />
                                    </svg>
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Categories;