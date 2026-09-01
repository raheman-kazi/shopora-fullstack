
import React, { useState, useMemo, useEffect } from 'react';
import './ProductListPage.css';
import {
  Link,
  useSearchParams,
  useNavigationType
} from 'react-router-dom';
import Spinner from '../components/Spinner';
import { API_BASE } from '../config';

const SCROLL_STORAGE_KEY = 'productListScrollPosition';

const StarRating = ({ rating = 0 }) => (
  <div className="star-rating">
    {[1, 2, 3, 4, 5].map((star) => (
      <svg
        key={star}
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill={
          star <= Math.floor(rating)
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

const ProductListPage = ({
  cartItems,
  dispatch,
  wishlistItems,
  dispatchWishlist
}) => {

  const [searchParams, setSearchParams] =
    useSearchParams();

  // Browser navigation type
  // POP = Browser Back / Forward
  const navigationType = useNavigationType();

  const categoryFromURL =
    searchParams.get('category');

  // =====================================================
  // STATE
  // =====================================================

  const [activeCategory, setActiveCategory] =
    useState(
      categoryFromURL
        ? categoryFromURL.charAt(0).toUpperCase() +
          categoryFromURL.slice(1)
        : 'All'
    );

  const [maxPrice, setMaxPrice] =
    useState(100000);

  const [minRating, setMinRating] =
    useState(0);

  const [sortBy, setSortBy] =
    useState('default');

  const [searchTerm, setSearchTerm] =
    useState('');

  const [justAddedId, setJustAddedId] =
    useState(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [products, setProducts] =
    useState([]);

  // =====================================================
  // ADD TO CART
  // =====================================================

 
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



  // =====================================================
  // CART QUANTITY
  // =====================================================

  const getCartItemQty = (id) => {

    const item = cartItems.find(
      item => (item.id || item._id) === id
    );

    return item
      ? item.quantity
      : 0;
  };

  // =====================================================
  // FILTERED PRODUCTS
  // =====================================================

  const filteredProducts = useMemo(() => {

    let result = [...products];

    // SEARCH
    if (searchTerm.trim() !== '') {

      const lowerCaseTerm =
        searchTerm.toLowerCase();

      result = result.filter(
        p =>
          p.name
            .toLowerCase()
            .includes(lowerCaseTerm) ||

          p.category
            .toLowerCase()
            .includes(lowerCaseTerm)
      );
    }

    // CATEGORY
    if (activeCategory !== 'All') {

      result = result.filter(
        p =>
          p.category === activeCategory
      );
    }

    // PRICE
    result = result.filter(
      p =>
        Number(p.price) <= maxPrice
    );

    // RATING
    if (minRating > 0) {

      result = result.filter(
        p =>
          Number(p.rating) >= minRating
      );
    }

    // SORT
    if (sortBy === 'price-low') {

      result.sort(
        (a, b) =>
          Number(a.price) -
          Number(b.price)
      );
    }

    if (sortBy === 'price-high') {

      result.sort(
        (a, b) =>
          Number(b.price) -
          Number(a.price)
      );
    }

    if (sortBy === 'rating') {

      result.sort(
        (a, b) =>
          Number(b.rating) -
          Number(a.rating)
      );
    }

    if (sortBy === 'name') {

      result.sort(
        (a, b) =>
          a.name.localeCompare(b.name)
      );
    }

    return result;

  }, [
    products,
    searchTerm,
    activeCategory,
    maxPrice,
    minRating,
    sortBy
  ]);

  // =====================================================
  // FETCH PRODUCTS
  // =====================================================

  useEffect(() => {

    const fetchProducts = async () => {

      try {

        setIsLoading(true);

        const response =
          await fetch(
            `${API_BASE}/api/products`
          );

        const data =
          await response.json();

        if (!response.ok) {

          throw new Error(
            data.message ||
            'Failed to fetch products'
          );
        }

        setProducts(
          data.map(product => ({
            ...product,

            // MongoDB _id
            // frontend id
            id: product._id
          }))
        );

      } catch (error) {

        console.error(
          'Products fetch error:',
          error
        );

        setProducts([]);

      } finally {

        setIsLoading(false);
      }
    };

    fetchProducts();

  }, []);

  // =====================================================
  // RESTORE SCROLL AFTER BROWSER BACK
  // =====================================================

  useEffect(() => {

    // POP means browser Back / Forward
    if (navigationType !== 'POP') {
      return;
    }

    // Products abhi load nahi hue
    if (
      isLoading ||
      products.length === 0
    ) {
      return;
    }

    const savedPosition =
      sessionStorage.getItem(
        SCROLL_STORAGE_KEY
      );

    if (!savedPosition) {
      return;
    }

    const scrollPosition =
      Number(savedPosition);

    let attempts = 0;

    const maxAttempts = 20;

    let animationFrameId;

    const restoreScroll = () => {

      attempts++;

      window.scrollTo({
        top: scrollPosition,
        left: 0,
        behavior: 'auto'
      });

      /*
        Images/grid render hone ke baad
        page ki height change ho sakti hai.

        Isliye multiple frames tak
        scroll position check karenge.
      */

      const currentPosition =
        window.scrollY;

      if (
        Math.abs(
          currentPosition -
          scrollPosition
        ) > 10 &&
        attempts < maxAttempts
      ) {

        animationFrameId =
          requestAnimationFrame(
            restoreScroll
          );

      } else {

        sessionStorage.removeItem(
          SCROLL_STORAGE_KEY
        );
      }
    };

    // Browser ko page render karne do
    animationFrameId =
      requestAnimationFrame(
        restoreScroll
      );

    return () => {

      cancelAnimationFrame(
        animationFrameId
      );
    };

  }, [
    navigationType,
    isLoading,
    products.length
  ]);

  // =====================================================
  // CATEGORY CHANGE
  // =====================================================

  const handleCategoryChange = (cat) => {

    setActiveCategory(cat);

    // Purani scroll position remove
    sessionStorage.removeItem(
      SCROLL_STORAGE_KEY
    );

    if (cat === 'All') {

      setSearchParams({});

    } else {

      setSearchParams({
        category: cat.toLowerCase()
      });
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto'
    });
  };

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters = () => {

    setActiveCategory('All');

    setMaxPrice(250);

    setMinRating(0);

    setSearchTerm('');

    setSortBy('default');

    setSearchParams({});

    sessionStorage.removeItem(
      SCROLL_STORAGE_KEY
    );

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto'
    });
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="plp-wrapper">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="plp-header">

        <div className="plp-header-content">

          <h1>
            All Products
          </h1>

          <p>
            Discover our complete collection
            of premium items
          </p>

        </div>

      </div>

      <div className="plp-container">

        {/* =================================================
            SIDEBAR
        ================================================= */}

        <aside className="plp-sidebar">

          {/* CATEGORY */}

          <div className="filter-group">

            <h3 className="filter-title">
              Categories
            </h3>

            <div className="filter-options">

              {[
                'All',
                'Men',
                'Women',
                'Electronics',
                'Beauty'
              ].map((cat) => (

                <button
                  key={cat}
                  className={`filter-btn ${
                    activeCategory === cat
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    handleCategoryChange(cat)
                  }
                >
                  {cat}
                </button>

              ))}

            </div>

          </div>

          {/* PRICE */}

          <div className="filter-group">

            <h3 className="filter-title">
              Max Price: ${maxPrice}
            </h3>

            <input
              type="range"
              min="0"
              max="100000"
              value={maxPrice}
              onChange={(e) => {

                setMaxPrice(
                  Number(e.target.value)
                );

                sessionStorage.removeItem(
                  SCROLL_STORAGE_KEY
                );

              }}
              className="price-slider"
            />

            <div className="price-range-labels">

              <span>
                ₹0
              </span>

              <span>
                ₹1,00,000
              </span>

            </div>

          </div>

          {/* RATING */}

          <div className="filter-group">

            <h3 className="filter-title">
              Minimum Rating
            </h3>

            <div className="filter-options">

              {[0, 4, 4.5].map(
                (rating) => (

                  <button
                    key={rating}
                    className={`filter-btn ${
                      minRating === rating
                        ? 'active'
                        : ''
                    }`}
                    onClick={() => {

                      setMinRating(
                        rating
                      );

                      sessionStorage.removeItem(
                        SCROLL_STORAGE_KEY
                      );

                    }}
                  >

                    {rating === 0
                      ? 'All Ratings'
                      : `${rating}+ ★`}

                  </button>

                )
              )}

            </div>

          </div>

          {/* CLEAR */}

          <button
            className="clear-filters-btn"
            onClick={clearFilters}
          >
            Clear All Filters
          </button>

        </aside>

        {/* =================================================
            MAIN
        ================================================= */}

        <main className="plp-main">

          {/* TOOLBAR */}

          <div className="plp-toolbar">

            <span className="product-count">

              Showing{' '}

              <strong>
                {filteredProducts.length}
              </strong>{' '}

              products

              {searchTerm && (

                <span>
                  {' '}for "
                  <strong>
                    {searchTerm}
                  </strong>
                  "
                </span>

              )}

            </span>

            <div className="toolbar-right">

              {/* SEARCH */}

              <div className="search-wrapper">

                <svg
                  className="search-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >

                  <circle
                    cx="11"
                    cy="11"
                    r="8"
                  />

                  <line
                    x1="21"
                    y1="21"
                    x2="16.65"
                    y2="16.65"
                  />

                </svg>

                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => {

                    setSearchTerm(
                      e.target.value
                    );

                    sessionStorage.removeItem(
                      SCROLL_STORAGE_KEY
                    );

                  }}
                  className="search-input"
                />

                {searchTerm && (

                  <button
                    className="search-clear"
                    onClick={() => {

                      setSearchTerm('');

                      sessionStorage.removeItem(
                        SCROLL_STORAGE_KEY
                      );

                    }}
                  >
                    ✕
                  </button>

                )}

              </div>

              {/* SORT */}

              <div className="sort-wrapper">

                <label>
                  Sort by:
                </label>

                <select
                  value={sortBy}
                  onChange={(e) => {

                    setSortBy(
                      e.target.value
                    );

                    sessionStorage.removeItem(
                      SCROLL_STORAGE_KEY
                    );

                  }}
                  className="sort-select"
                >

                  <option value="default">
                    Featured
                  </option>

                  <option value="price-low">
                    Price: Low to High
                  </option>

                  <option value="price-high">
                    Price: High to Low
                  </option>

                  <option value="rating">
                    Highest Rated
                  </option>

                  <option value="name">
                    Name: A-Z
                  </option>

                </select>

              </div>

            </div>

          </div>

          {/* =================================================
              LOADING
          ================================================= */}

          {isLoading ? (

            <Spinner
              text="Finding the best products for you..."
            />

          ) : (

            <>

              {/* =================================================
                  PRODUCT GRID
              ================================================= */}

              {filteredProducts.length > 0 ? (

                <div className="plp-grid">

                  {filteredProducts.map(
                    (product) => {

                      const isJustAdded =
                        justAddedId ===
                        product.id;

                      const currentQty =
                        getCartItemQty(
                          product.id
                        );

                      // Stock state
                      const stock = product.stock ?? 0;
                      const isOutOfStock = stock <= 0;
                      const isMaxedOut =
                        !isOutOfStock &&
                        currentQty >= stock;

                      const isWishlisted =
                        wishlistItems.some(
                          item =>
                            (
                              item.id ||
                              item._id
                            ) ===
                            product.id
                        );

                      return (

                        <Link
                          to={`/product/${product.id}`}
                          className="product-card"
                          key={product.id}

                          // =================================================
                          // IMPORTANT:
                          // Browser Back ke liye scroll save
                          // =================================================

                          onClick={() => {

                            sessionStorage.setItem(
                              SCROLL_STORAGE_KEY,
                              window.scrollY.toString()
                            );

                          }}
                        >

                          <div className="product-image-wrapper">

                            {isOutOfStock && (
                              <span className="stock-flag out">
                                Out of stock
                              </span>
                            )}

                            {!isOutOfStock && stock <= 5 && (
                              <span className="stock-flag low">
                                Only {stock} left
                              </span>
                            )}

                            <img
                              src={product.image}
                              alt={product.name}
                              className="product-image"

                              onError={(e) => {

                                e.target.src =
                                  'https://placehold.co/500x500/f3f4f6/999999?text=Image+Unavailable';

                              }}
                            />

                            {/* WISHLIST */}

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
                                  type:
                                    'TOGGLE_WISHLIST',
                                  payload:
                                    product
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

                            {/* ADD TO CART */}

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
                                    : 'Add to Cart'}

                                </>

                              )}

                            </button>

                          </div>

                          {/* PRODUCT INFO */}

                          <div className="product-info">

                            <span className="product-category-tag">
                              {product.category}
                            </span>

                            <h3 className="product-name">
                              {product.name}
                            </h3>

                            <div className="product-meta">

                              <StarRating
                                rating={
                                  product.rating
                                }
                              />

                              <span className="product-reviews">
                                ({product.rating})
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
                    }
                  )}

                </div>

              ) : (

                /* =================================================
                   NO RESULTS
                ================================================= */

                <div className="no-results">

                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ccc"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >

                    <circle
                      cx="11"
                      cy="11"
                      r="8"
                    />

                    <line
                      x1="21"
                      y1="21"
                      x2="16.65"
                      y2="16.65"
                    />

                  </svg>

                  <h3>
                    No products found
                  </h3>

                  <p>
                    Try adjusting your search
                    or filters to find what
                    you're looking for.
                  </p>

                  <button
                    onClick={clearFilters}
                  >
                    Clear All
                  </button>

                </div>

              )}

            </>
          )}

        </main>

      </div>

    </div>
  );
};

export default ProductListPage;

