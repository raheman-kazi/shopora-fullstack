
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './CartPage.css';
import { API_BASE } from '../config';

const CartPage = ({ cartItems, dispatch }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // ==========================================
  // GET CART FROM BACKEND
  // ==========================================
  useEffect(() => {
    const fetchCart = async () => {
      try {
        setLoading(true);
        setError('');

        const token = localStorage.getItem('token');

        if (!token) {
          setError('Please login to view your cart.');
          setItems([]);
          return;
        }

        const response = await fetch(
          `${API_BASE}/api/cart`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || 'Failed to fetch cart.'
          );
        }

        const backendItems = data.cart?.items || [];

        const formattedItems = backendItems
          .filter((item) => item.product)
          .map((item) => ({
            id: item.product._id,
            name: item.product.name,
            price: Number(item.product.price) || 0,
            quantity: item.quantity,
            category: item.product.category,
            image:
              item.product.image ||
              item.product.images?.[0] ||
              '',
            images: item.product.images || [],
          }));

        setItems(formattedItems);

      } catch (error) {
        console.error('Fetch cart error:', error);
        setError(
          error.message || 'Unable to load cart.'
        );
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, []);

  // ==========================================
  // UPDATE QUANTITY IN MONGODB
  // ==========================================
  const updateQuantity = async (id, newQuantity) => {
    if (newQuantity < 1) {
      return;
    }

    try {
      setUpdatingId(id);

      const token = localStorage.getItem('token');

      if (!token) {
        alert('Please login first.');
        return;
      }

      const response = await fetch(
        `${API_BASE}/api/cart/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            quantity: newQuantity,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          'Failed to update cart quantity.'
        );
      }

      console.log(
        'Cart quantity updated:',
        data
      );

      // Update React UI after backend success
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: newQuantity,
              }
            : item
        )
      );

      // Existing reducer update
      dispatch({
        type: 'CHANGE_CART_QTY',
        payload: {
          id,
          type:
            newQuantity >
            (items.find((item) => item.id === id)?.quantity || 0)
              ? 'increase'
              : 'decrease',
        },
      });

    } catch (error) {
      console.error(
        'Update quantity error:',
        error
      );

      alert(
        error.message ||
        'Unable to update quantity.'
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // ==========================================
  // INCREASE / DECREASE
  // ==========================================
  const handleQuantityChange = (id, type) => {
    const item = items.find(
      (item) => item.id === id
    );

    if (!item) {
      return;
    }

    let newQuantity = item.quantity;

    if (type === 'increase') {
      const stock = item.stock ?? 0;

      // Stock se aage nahi badhne dena
      if (item.quantity >= stock) {
        alert(
          stock <= 0
            ? `${item.name} is out of stock`
            : `Only ${stock} left in stock`
        );
        return;
      }

      newQuantity = item.quantity + 1;
    }

    if (
      type === 'decrease' &&
      item.quantity > 1
    ) {
      newQuantity = item.quantity - 1;
    }

    if (newQuantity === item.quantity) {
      return;
    }

    updateQuantity(id, newQuantity);
  };

  // ==========================================
  // REMOVE ITEM
  // ==========================================

// ==========================================
// REMOVE ITEM FROM MONGODB
// ==========================================
const handleRemoveItem = async (id) => {
  try {
    const token = localStorage.getItem('token');

    if (!token) {
      alert('Please login first.');
      return;
    }

    const response = await fetch(
      `${API_BASE}/api/cart/${id}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
        'Failed to remove product from cart.'
      );
    }

    console.log(
      'Product removed from cart:',
      data
    );

    // React UI update
    setItems((prevItems) =>
      prevItems.filter(
        (item) => item.id !== id
      )
    );

    // Existing reducer update
    dispatch({
      type: 'REMOVE_FROM_CART',
      payload: { id },
    });

  } catch (error) {
    console.error(
      'Remove from cart error:',
      error
    );

    alert(
      error.message ||
      'Unable to remove product from cart.'
    );
  }
};



  // ==========================================
  // LOADING
  // ==========================================
  if (loading) {
    return (
      <div className="cart-wrapper">
        <div className="cart-container">
          <h1>Shopping Cart</h1>

          <div className="cart-empty">
            <h2>Loading cart...</h2>
            <p>
              Please wait while we load your cart.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================
  if (error) {
    return (
      <div className="cart-wrapper">
        <div className="cart-container">
          <h1>Shopping Cart</h1>

          <div className="cart-empty">
            <h2>Unable to load cart</h2>

            <p>{error}</p>

            <Link
              to="/"
              className="shop-now-btn"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // CALCULATIONS
  // ==========================================
  const subtotal = items.reduce(
    (acc, item) =>
      acc +
      item.price *
        item.quantity,
    0
  );

  const shipping =
    subtotal > 999
      ? 0
      : 49;

  // ==========================================
  // STOCK PROBLEM CHECK
  // Koi bhi item stock se zyada ya out of stock
  // ho to checkout rok dete hain
  // ==========================================
  const stockProblemItems = items.filter(
    (item) => item.quantity > (item.stock ?? 0)
  );

  const hasStockProblem = stockProblemItems.length > 0;

  const total =
    subtotal + shipping;

  // ==========================================
  // UI
  // ==========================================
  return (
    <div className="cart-wrapper">
      <div className="cart-container">

        <h1>
          Shopping Cart ({items.length} items)
        </h1>

        {items.length > 0 ? (

          <div className="cart-layout">

            {/* LEFT: CART ITEMS */}
            <div className="cart-items-list">

              {items.map((item) => (

                <div
                  className="cart-item-card"
                  key={item.id}
                >

                  {/* IMAGE */}
                  <Link
                    to={`/product/${item.id}`}
                    className="cart-item-image"
                  >
                    <img
                      src={
                        item.image ||
                        item.images?.[0]
                      }
                      alt={item.name}
                      onError={(e) => {
                        e.target.src =
                          'https://placehold.co/100x100/f3f4f6/999999?text=No+Image';
                      }}
                    />
                  </Link>

                  {/* DETAILS */}
                  <div className="cart-item-details">

                    <Link
                      to={`/product/${item.id}`}
                      className="cart-item-name"
                    >
                      {item.name}
                    </Link>

                    <span className="cart-item-category">
                      {item.category}
                    </span>

                    {(item.stock ?? 0) <= 0 && (
                      <span className="cart-stock-warning out">
                        Out of stock — remove to continue
                      </span>
                    )}

                    {(item.stock ?? 0) > 0 &&
                      item.quantity > item.stock && (
                        <span className="cart-stock-warning out">
                          Only {item.stock} left — reduce the quantity
                        </span>
                      )}

                    {(item.stock ?? 0) > 0 &&
                      item.quantity === item.stock && (
                        <span className="cart-stock-warning low">
                          You have all {item.stock} available
                        </span>
                      )}

                    {/* QUANTITY */}
                    <div className="cart-qty-controls">

                      <button
                        onClick={() =>
                          handleQuantityChange(
                            item.id,
                            'decrease'
                          )
                        }
                        disabled={
                          item.quantity <= 1 ||
                          updatingId === item.id
                        }
                      >
                        -
                      </button>

                      <span>
                        {updatingId === item.id
                          ? '...'
                          : item.quantity}
                      </span>

                      <button
                        onClick={() =>
                          handleQuantityChange(
                            item.id,
                            'increase'
                          )
                        }
                        disabled={
                          updatingId === item.id ||
                          item.quantity >= (item.stock ?? 0)
                        }
                      >
                        +
                      </button>

                    </div>

                  </div>

                  {/* PRICE */}
                  <div className="cart-item-right">

                    <span className="cart-item-total-price">
                      ₹
                      {(
                        item.price *
                        item.quantity
                      ).toFixed(2)}
                    </span>

                    {item.quantity > 1 && (
                      <span className="cart-item-unit-price">
                        ₹
                        {item.price.toFixed(2)}
                        {' '}each
                      </span>
                    )}

                    <button
                      className="cart-remove-btn"
                      onClick={() =>
                        handleRemoveItem(
                          item.id
                        )
                      }
                    >
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
                        <polyline points="3 6 5 6 21 6" />

                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>

                  </div>

                </div>
              ))}

            </div>

            {/* ORDER SUMMARY */}
            <div className="cart-summary">

              <h2>Order Summary</h2>

              <div className="summary-row">
                <span>Subtotal</span>

                <span>
                  ₹{subtotal.toFixed(2)}
                </span>
              </div>

              <div className="summary-row">

                <span>Shipping</span>

                <span
                  style={{
                    color:
                      shipping === 0
                        ? '#10B981'
                        : '#111',
                    fontWeight: 600,
                  }}
                >
                  {shipping === 0
                    ? 'FREE'
                    : `₹${shipping.toFixed(2)}`}
                </span>

              </div>

              {shipping > 0 && (
                <p className="shipping-note">
                  Add ₹
                  {(999 - subtotal).toFixed(2)}
                  {' '}more for free shipping!
                </p>
              )}

              <div className="summary-divider"></div>

              <div className="summary-row total">

                <span>Total</span>

                <span>
                  ₹{total.toFixed(2)}
                </span>

              </div>

              {hasStockProblem && (
                <p className="cart-stock-blocker">
                  Fix the stock issues above to continue
                </p>
              )}

              {hasStockProblem ? (
                <button
                  className="checkout-btn"
                  disabled
                >
                  Proceed to Checkout
                </button>
              ) : (
                <Link
                  to="/checkout"
                  className="checkout-btn"
                >
                  Proceed to Checkout
                </Link>
              )}

              <Link
                to="/products"
                className="continue-shopping-btn"
              >
                Continue Shopping
              </Link>

            </div>

          </div>

        ) : (

          /* EMPTY CART */
          <div className="cart-empty">

            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#e0e0e0"
              strokeWidth="1.5"
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

            <h2>
              Your cart is empty
            </h2>

            <p>
              Looks like you haven't added
              anything to your cart yet.
            </p>

            <Link
              to="/products"
              className="shop-now-btn"
            >
              Start Shopping
            </Link>

          </div>
        )}

      </div>
    </div>
  );
};

export default CartPage;

