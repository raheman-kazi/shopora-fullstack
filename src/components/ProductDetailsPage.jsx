
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './ProductDetailsPage.css';
import Spinner from './Spinner';
import { API_BASE } from '../config';

const StarRating = ({ rating = 0 }) => (
  <div className="star-rating">
    {[1, 2, 3, 4, 5].map((star) => (
      <svg
        key={star}
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={star <= Math.floor(rating) ? '#FBBF24' : '#E5E7EB'}
        stroke="none"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ))}
  </div>
);

const ProductDetailsPage = ({
  cartItems,
  dispatch,
  wishlistItems,
  wishlistDispatch
}) => {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [isAdded, setIsAdded] = useState(false);

  // =========================
  // FETCH SINGLE PRODUCT
  // =========================
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        setError('');

        const response = await fetch(
          `${API_BASE}/api/products/${id}`
        );

        if (!response.ok) {
          throw new Error('Product not found');
        }

        const data = await response.json();

        setProduct(data);
        setQuantity(1);

      } catch (error) {
        console.error('Error fetching product:', error);
        setError('Unable to load product.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // =========================
  // LOADING
  // =========================
  if (isLoading) {
    return (
      <div className="pdp-wrapper">
        <div className="pdp-container">
          <div className="pdp-loading-wrapper">
            <Spinner
              size="large"
              text="Loading product details..."
            />
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // ERROR
  // =========================
  if (error || !product) {
    return (
      <div className="pdp-wrapper">
        <div className="pdp-container">
          <h2>{error || 'Product not found'}</h2>

          <Link to="/products">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  // MongoDB uses _id
  // Frontend may use id
  const productId = product.id || product._id;

  // =========================
  // CART
  // =========================
  const currentQtyInCart =
    cartItems.find(
      item => (item.id || item._id) === productId
    )?.quantity || 0;

  // =========================
  // WISHLIST
  // =========================
  const isWishlisted = wishlistItems.some(
    item => (item.id || item._id) === productId
  );

  // =========================
  // STOCK
  // Cart me jo pehle se pada hai usko
  // ghata ke bacha hua stock nikalte hain
  // =========================
  const remainingStock = Math.max(
    (product.stock ?? 0) - currentQtyInCart,
    0
  );

  const canAddMore = remainingStock > 0;

  // =========================
  // QUANTITY
  // =========================
  const handleQuantityChange = (type) => {
    if (
      type === 'decrease' &&
      quantity > 1
    ) {
      setQuantity(quantity - 1);
    }

    if (
      type === 'increase' &&
      quantity < remainingStock
    ) {
      setQuantity(quantity + 1);
    }
  };

  // =========================
  // ADD TO CART
  // =========================


// =========================
// ADD TO CART
// =========================
const handleAddToCart = async () => {
  try {
    const token = localStorage.getItem('token');

    // User login nahi hai
    if (!token) {
      alert('Please login to add products to cart.');
      return;
    }

    // Product ID check
    if (!productId) {
      console.error('Product ID is missing:', product);
      alert('Product ID not found.');
      return;
    }

    // Quantity validation
    if (quantity < 1) {
      alert('Please select a valid quantity.');
      return;
    }

    // Stock validation
    if (quantity > product.stock) {
      alert(`Only ${product.stock} items are available.`);
      return;
    }

    const response = await fetch(
      `${API_BASE}/api/cart`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: productId,
          quantity: quantity,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || 'Failed to add product to cart.'
      );
    }

    console.log('Product added to cart:', data);

    // Frontend cart state update
    dispatch({
      type: 'ADD_TO_CART',
      payload: {
        ...product,
        id: productId,
        quantity: quantity,
      },
    });

    // IMPORTANT:
    // Stock yahan reduce nahi karna hai.
    // Stock sirf order place hone par backend me reduce hoga.

    setIsAdded(true);

    setQuantity(1);

    setTimeout(() => {
      setIsAdded(false);
    }, 2000);

  } catch (error) {
    console.error('Add to cart error:', error);

    alert(
      error.message ||
      'Unable to add product to cart.'
    );
  }
};



  // =========================
  // WISHLIST
  // =========================
  const handleToggleWishlist = () => {
    wishlistDispatch({
      type: 'TOGGLE_WISHLIST',
      payload: {
        ...product,
        id: productId,
        image: product.image
      }
    });
  };

  // =========================
  // SALE %
  // =========================
  const discountPercentage =
    product.originalPrice
      ? Math.round(
          (1 - product.price / product.originalPrice) * 100
        )
      : 0;

  return (
    <div className="pdp-wrapper">

      {/* =========================
          BREADCRUMBS
      ========================= */}
      <div className="pdp-breadcrumbs">
        <div className="pdp-container">

          <Link to="/">Home</Link>

          <span>/</span>

          <Link to="/products">Products</Link>

          <span>/</span>

          <span className="current">
            {product.name}
          </span>

        </div>
      </div>

      <div className="pdp-container">

        {/* =========================
            TOP SECTION
        ========================= */}
        <div className="pdp-top-grid">

          {/* =========================
              PRODUCT IMAGE
          ========================= */}
          <div className="pdp-gallery">

            <div className="pdp-main-image-wrapper">

              <img
                src={product.image}
                alt={product.name}
                className="pdp-main-image"
                onError={(e) => {
                  e.target.src =
                    'https://placehold.co/800x800/f3f4f6/999999?text=Image+Unavailable';
                }}
              />

              {product.originalPrice && (
                <span className="pdp-sale-badge">
                  -{discountPercentage}% OFF
                </span>
              )}

            </div>

          </div>

          {/* =========================
              PRODUCT INFO
          ========================= */}
          <div className="pdp-info">

            <span className="pdp-category">
              {product.category}
            </span>

            <h1 className="pdp-title">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="pdp-rating-row">

              <StarRating rating={product.rating} />

              <span className="pdp-review-text">
                {product.rating} Rating
              </span>

            </div>

            {/* =========================
                PRICE
            ========================= */}
            <div className="pdp-pricing-block">

              <span className="pdp-current-price">
                ₹{Number(product.price).toFixed(2)}
              </span>

              {product.originalPrice && (
                <span className="pdp-original-price">
                  ₹{Number(product.originalPrice).toFixed(2)}
                </span>
              )}

              {product.originalPrice && (
                <span className="pdp-save-text">
                  You save ₹
                  {(
                    Number(product.originalPrice) -
                    Number(product.price)
                  ).toFixed(2)}
                </span>
              )}

            </div>

            {/* =========================
                DESCRIPTION
            ========================= */}
            <p className="pdp-short-desc">
              {product.description}
            </p>

            {/* =========================
                STOCK
            ========================= */}
            <p className="pdp-stock-status">
              {product.stock <= 0
                ? 'Out of stock'
                : currentQtyInCart > 0
                ? `${product.stock} available · ${currentQtyInCart} already in your cart`
                : `${product.stock} items available`}
            </p>

            {/* =========================
                ACTIONS
            ========================= */}
            <div className="pdp-actions">

              {/* Quantity */}
              <div className="quantity-selector">

                <button
                  onClick={() =>
                    handleQuantityChange('decrease')
                  }
                  disabled={quantity <= 1}
                >
                  -
                </button>

                <span>
                  {quantity}
                </span>

                <button
                  onClick={() =>
                    handleQuantityChange('increase')
                  }
                  disabled={quantity >= remainingStock}
                >
                  +
                </button>

              </div>

              {/* Add to Cart */}
              <button
                className={`pdp-add-btn ${
                  isAdded ? 'added' : ''
                }`}
                onClick={handleAddToCart}
                disabled={product.stock <= 0 || !canAddMore}
              >

                {isAdded ? (
                  <>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>

                    Added to Cart!
                  </>
                ) : (
                  <>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>

                    {product.stock <= 0
                      ? 'Out of Stock'
                      : !canAddMore
                      ? 'All stock in your cart'
                      : 'Add to Cart'}
                  </>
                )}

              </button>

              {/* Wishlist */}
              <button
                className={`pdp-wishlist-btn ${
                  isWishlisted ? 'active' : ''
                }`}
                onClick={handleToggleWishlist}
              >

                <svg
                  width="22"
                  height="22"
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

            </div>

            {/* Cart Status */}
            {currentQtyInCart > 0 && !isAdded && (
              <p className="pdp-cart-status">
                ✓ {currentQtyInCart} already in your cart
              </p>
            )}

            {/* =========================
                MINI FEATURES
            ========================= */}
            <div className="pdp-mini-features">

              <div className="mini-feat">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>

                Fast Delivery
              </div>

              <div className="mini-feat">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>

                Secure Payment
              </div>

              <div className="mini-feat">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>

                30-Day Returns
              </div>

            </div>

          </div>
        </div>

        {/* =========================
            BOTTOM SECTION
        ========================= */}
        <div className="pdp-bottom-section">

          <div className="pdp-tabs">

            <button
              className={`pdp-tab ${
                activeTab === 'description'
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                setActiveTab('description')
              }
            >
              Description
            </button>

            <button
              className={`pdp-tab ${
                activeTab === 'reviews'
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                setActiveTab('reviews')
              }
            >
              Reviews
            </button>

          </div>

          <div className="pdp-tab-content">

            {/* =========================
                DESCRIPTION TAB
            ========================= */}
            {activeTab === 'description' ? (

              <div className="tab-description">

                <p>
                  {product.description}
                </p>

                {product.features?.length > 0 && (
                  <>
                    <h4>Key Features:</h4>

                    <ul>
                      {product.features.map(
                        (feat, index) => (
                          <li key={index}>
                            {feat}
                          </li>
                        )
                      )}
                    </ul>
                  </>
                )}

              </div>

            ) : (

              /* =========================
                 REVIEWS TAB
              ========================= */
              <div className="tab-reviews">

                <div className="review-card">

                  <div className="review-header">

                    <strong>
                      Product Rating
                    </strong>

                    <StarRating
                      rating={product.rating}
                    />

                  </div>

                  <p>
                    This product currently has a
                    rating of {product.rating} out
                    of 5.
                  </p>

                </div>

              </div>

            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductDetailsPage;
