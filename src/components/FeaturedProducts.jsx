
import React, { useEffect, useState } from 'react';
import './FeaturedProducts.css';
import { Link } from 'react-router-dom';
import { API_BASE } from '../config';

const StarRating = ({ rating = 0 }) => (
    <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
            <svg
                key={star}
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill={
                    star <= Math.floor(Number(rating))
                        ? '#FBBF24'
                        : '#E5E7EB'
                }
                stroke="none"
            >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
        ))}
    </div>
);

const FeaturedProducts = ({
    cartItems = [],
    dispatch,
    wishlistItems = [],
    dispatchWishlist
}) => {

    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [justAddedId, setJustAddedId] = useState(null);

    // ==========================================
    // FETCH PRODUCTS FROM MONGODB
    // ==========================================
    useEffect(() => {

        const fetchFeaturedProducts = async () => {

            try {
                setIsLoading(true);
                setError('');

                const response = await fetch(
                    `${API_BASE}/api/products`
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch products');
                }

                const data = await response.json();

               

                // ==========================================
                // NORMALIZE + FILTER FEATURED PRODUCTS
                // ==========================================

                const featuredProducts = data
                    .filter(product => product.featured === true)
                    .slice(0, 4)
                    .map(product => ({
                        ...product,

                        // MongoDB _id → frontend id
                        id: product._id
                    }));

               

                setProducts(featuredProducts);

            } catch (error) {

                console.error(
                    'Error fetching featured products:',
                    error
                );

                setError(
                    'Unable to load featured products.'
                );

            } finally {

                setIsLoading(false);

            }
        };

        fetchFeaturedProducts();

    }, []);



// ==========================================
// ADD TO CART
// ==========================================
const handleAddToCart = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();

    try {
        const token = localStorage.getItem('token');

        // User login nahi hai
        if (!token) {
            alert('Please login to add products to cart.');
            return;
        }

        // Button ko immediately clicked state me mat dalo
        // jab tak backend successfully response na de
        const response = await fetch(
            `${API_BASE}/api/cart`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    productId: product._id,
                    quantity: 1,
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || 'Failed to add product to cart.'
            );
        }

        console.log('Cart updated:', data);

        // Existing frontend cart state bhi update karo
        dispatch({
            type: 'ADD_TO_CART',
            payload: product,
        });

        // Show "Added!"
        setJustAddedId(product.id);

        setTimeout(() => {
            setJustAddedId(null);
        }, 1500);

    } catch (error) {
        console.error('Add to cart error:', error);
        alert(error.message || 'Unable to add product to cart.');
    }
};



    // ==========================================
    // GET CART QUANTITY
    // ==========================================
    const getCartItemQty = (id) => {

        const item = cartItems.find(
            item => item.id === id
        );

        return item ? item.quantity : 0;
    };

    // ==========================================
    // LOADING
    // ==========================================
    if (isLoading) {

        return (
            <section className="products-section">

                <div className="products-container">

                    <div className="products-header">

                        <span className="products-tag">
                            Handpicked for you
                        </span>

                        <h2 className="products-title">
                            Featured Products
                        </h2>

                        <p className="products-subtitle">
                            Our most popular picks based on
                            customer ratings and trends
                        </p>

                    </div>

                    <div className="products-grid">
                        <p>Loading featured products...</p>
                    </div>

                </div>

            </section>
        );
    }

    // ==========================================
    // ERROR
    // ==========================================
    if (error) {

        return (
            <section className="products-section">

                <div className="products-container">

                    <div className="products-header">

                        <span className="products-tag">
                            Handpicked for you
                        </span>

                        <h2 className="products-title">
                            Featured Products
                        </h2>

                    </div>

                    <p>{error}</p>

                </div>

            </section>
        );
    }

    return (
        <section className="products-section">

            <div className="products-container">

                {/* ==========================================
                    HEADER
                ========================================== */}

                <div className="products-header">

                    <span className="products-tag">
                        Handpicked for you
                    </span>

                    <h2 className="products-title">
                        Featured Products
                    </h2>

                    <p className="products-subtitle">
                        Our most popular picks based on
                        customer ratings and trends
                    </p>

                </div>


                {/* ==========================================
                    PRODUCTS
                ========================================== */}

                <div className="products-grid">

                    {products.length > 0 ? (

                        products.map((product) => {

                            const productId = product.id;

                            const isJustAdded =
                                justAddedId === productId;

                            const currentQty =
                                getCartItemQty(productId);

                            // Stock state
                            const stock = product.stock ?? 0;
                            const isOutOfStock = stock <= 0;
                            const isMaxedOut =
                                !isOutOfStock &&
                                currentQty >= stock;

                            const isWishlisted =
                                wishlistItems.some(
                                    item => item.id === productId
                                );

                            return (

                                <Link
                                    to={`/product/${productId}`}
                                    className="product-card"
                                    key={productId}
                                >

                                    {/* ==========================================
                                        IMAGE
                                    ========================================== */}

                                    <div className="product-image-wrapper">

                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="product-image"
                                            onError={(e) => {
                                                e.target.src =
                                                    'https://placehold.co/500x500/f3f4f6/999999?text=Image+Unavailable';
                                            }}
                                        />


                                        {/* ==========================================
                                            WISHLIST
                                        ========================================== */}

                                        <button
                                            className={`wishlist-btn ${
                                                isWishlisted
                                                    ? 'active'
                                                    : ''
                                            }`}
                                            onClick={(e) => {

                                                e.preventDefault();
                                                e.stopPropagation();

                                                dispatchWishlist({
                                                    type: 'TOGGLE_WISHLIST',

                                                    payload: {
                                                        ...product,
                                                        id: productId,
                                                        image: product.image
                                                    }
                                                });

                                            }}
                                        >

                                            <svg
                                                width="18"
                                                height="18"
                                                viewBox="0 0 24 24"
                                                fill={
                                                    isWishlisted
                                                        ? '#e63946'
                                                        : 'none'
                                                }
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >

                                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />

                                            </svg>

                                        </button>


                                        {/* ==========================================
                                            ADD TO CART
                                        ========================================== */}

                                        <button
                                            className={`add-to-cart-btn ${
                                                isJustAdded
                                                    ? 'clicked'
                                                    : ''
                                            } ${
                                                currentQty > 0 &&
                                                !isJustAdded
                                                    ? 'in-cart'
                                                    : ''
                                            }`}
                                            onClick={(e) =>
                                                handleAddToCart(
                                                    e,
                                                    product
                                                )
                                            }
                                            disabled={
                                                isOutOfStock || isMaxedOut
                                            }
                                        >

                                            {isJustAdded ? (

                                                <>

                                                    <svg
                                                        width="18"
                                                        height="18"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2.5"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>

                                                    Added!

                                                </>

                                            ) : (

                                                <>

                                                    <svg
                                                        width="16"
                                                        height="16"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >

                                                        <circle
                                                            cx="9"
                                                            cy="21"
                                                            r="1"
                                                        />

                                                        <circle
                                                            cx="20"
                                                            cy="21"
                                                            r="1"
                                                        />

                                                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />

                                                    </svg>

                                                    {isOutOfStock
                                                        ? 'Out of Stock'
                                                        : isMaxedOut
                                                            ? `Max in cart (${currentQty})`
                                                            : currentQty > 0
                                                                ? `In Cart (${currentQty})`
                                                                : 'Add to Cart'
                                                    }

                                                </>

                                            )}

                                        </button>

                                    </div>


                                    {/* ==========================================
                                        PRODUCT INFO
                                    ========================================== */}

                                    <div className="product-info">

                                        <h3 className="product-name">
                                            {product.name}
                                        </h3>


                                        <div className="product-meta">

                                            <StarRating
                                                rating={product.rating}
                                            />

                                            <span className="product-reviews">
                                                ({product.rating || 0})
                                            </span>

                                        </div>


                                        <div className="product-pricing">

                                            <span className="product-price">
                                                ₹
                                                {Number(
                                                    product.price
                                                ).toFixed(2)}
                                            </span>


                                            {product.originalPrice && (

                                                <span className="product-original-price">
                                                    ₹
                                                    {Number(
                                                        product.originalPrice
                                                    ).toFixed(2)}
                                                </span>

                                            )}

                                        </div>

                                    </div>

                                </Link>

                            );

                        })

                    ) : (

                        <p>
                            No featured products available.
                        </p>

                    )}

                </div>


                {/* ==========================================
                    VIEW ALL PRODUCTS
                ========================================== */}

                <div className="products-view-all">

                    <Link
                        to="/products"
                        className="view-all-btn"
                    >

                        View All Products

                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >

                            <path d="M5 12h14" />

                            <path d="m12 5 7 7" />

                        </svg>

                    </Link>

                </div>

            </div>

        </section>
    );
};

export default FeaturedProducts;

