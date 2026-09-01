
import React from 'react';
import { Link } from 'react-router-dom';
import './WishlistPage.css';
import { API_BASE } from '../config';

const WishlistPage = ({
  wishlistItems,
  dispatchWishlist,
  cartItems,
  dispatch,
}) => {

  // =====================================================
  // MOVE TO CART
  // =====================================================

  const handleAddToCart = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem('token');

    // Login required
    if (!token) {
      return;
    }

    // ===================================================
    // CURRENT CART QUANTITY
    // ===================================================

    const currentQty =
      cartItems.find(
        item => item.id === product.id
      )?.quantity || 0;


    // ===================================================
    // STOCK CHECK
    // ===================================================

    const stock = Number(product.stock ?? 0);


    if (currentQty >= stock) {
      alert(`Only ${stock} items available in stock.`);
      return;
    }


    try {

      // =================================================
      // ADD TO CART BACKEND
      // =================================================

      const response = await fetch(
        `${API_BASE}/api/cart`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            productId: product.id,
            quantity: 1,
          }),
        }
      );


      const data = await response.json();


      // =================================================
      // BACKEND ERROR
      // =================================================

      if (!response.ok) {

        alert(
          data.message ||
          'Failed to add product to cart'
        );

        return;
      }


      // =================================================
      // CONVERT MONGODB CART -> REACT CART
      // =================================================

      const mongoCartItems =
        data.cart?.items || [];


      const formattedCartItems =
        mongoCartItems
          .filter(item => item.product)
          .map(item => ({
            ...item.product,

            // MongoDB _id -> frontend id
            id: item.product._id,

            // Cart quantity
            quantity: item.quantity,
          }));


      // =================================================
      // UPDATE REACT CART STATE
      // =================================================

      dispatch({
        type: 'LOAD_CART',
        payload: formattedCartItems,
      });


    } catch (error) {

      console.error(
        'Move to cart error:',
        error
      );

      alert(
        'Something went wrong while adding product to cart.'
      );
    }
  };


  // =====================================================
  // REMOVE FROM WISHLIST
  // =====================================================

  const handleRemoveFromWishlist = (
    e,
    product
  ) => {

    e.preventDefault();
    e.stopPropagation();

    dispatchWishlist({
      type: 'TOGGLE_WISHLIST',
      payload: product,
    });
  };


  return (
    <div className="wishlist-wrapper">

      <div className="wishlist-container">

        <h1>
          My Wishlist ({wishlistItems.length})
        </h1>


        {wishlistItems.length > 0 ? (

          <div className="wishlist-grid">

            {wishlistItems.map((product) => {

              // =================================================
              // CURRENT CART QUANTITY
              // =================================================

              const currentQty =
                cartItems.find(
                  item =>
                    item.id === product.id
                )?.quantity || 0;


              // =================================================
              // PRODUCT STOCK
              // =================================================

              const stock =
                Number(product.stock ?? 0);


              // =================================================
              // STOCK LIMIT REACHED
              // =================================================

              const stockLimitReached =
                currentQty >= stock;


              return (

                <Link
                  to={`/product/${product.id}`}
                  className="wishlist-card"
                  key={product.id}
                >

                  {/* =========================================
                      IMAGE
                  ========================================= */}

                  <div className="wishlist-image-wrapper">

                    <img
                      src={product.image}
                      alt={product.name}
                    />

                  </div>


                  {/* =========================================
                      PRODUCT INFO
                  ========================================= */}

                  <div className="wishlist-info">

                    <span className="wishlist-cat">
                      {product.category}
                    </span>


                    <h3>
                      {product.name}
                    </h3>


                    <div className="wishlist-pricing">

                      <span className="wishlist-price">
                        ₹{Number(product.price).toFixed(2)}
                      </span>


                      {product.originalPrice && (

                        <span className="wishlist-original">
                          ₹{Number(product.originalPrice).toFixed(2)}
                        </span>

                      )}

                    </div>


                    {/* =====================================
                        ACTIONS
                    ===================================== */}

                    <div className="wishlist-actions">

                      <button
                        onClick={(e) =>
                          handleAddToCart(
                            e,
                            product
                          )
                        }
                        className="wish-cart-btn"
                        disabled={stockLimitReached}
                      >

                        {stockLimitReached
                          ? `In Cart (${currentQty}) - Max Stock`
                          : currentQty > 0
                            ? `In Cart (${currentQty})`
                            : 'Move to Cart'
                        }

                      </button>


                      <button
                        onClick={(e) =>
                          handleRemoveFromWishlist(
                            e,
                            product
                          )
                        }
                        className="wish-remove-btn"
                      >
                        ✕
                      </button>

                    </div>

                  </div>

                </Link>

              );

            })}

          </div>

        ) : (

          <div className="wishlist-empty">

            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ddd"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >

              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>

            </svg>


            <h2>
              Your wishlist is empty
            </h2>


            <p>
              Looks like you haven't added anything
              to your wishlist yet.
            </p>


            <Link
              to="/products"
              className="wish-shop-btn"
            >
              Continue Shopping
            </Link>

          </div>

        )}

      </div>

    </div>
  );
};


export default WishlistPage;

