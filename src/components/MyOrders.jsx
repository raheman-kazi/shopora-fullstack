import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './MyOrders.css';
import { API_BASE } from '../config';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // GET MY ORDERS FROM DATABASE
  // ==========================================

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        console.log('No token found');
        setOrders([]);
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${API_BASE}/api/orders/my-orders`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data.message);
        setOrders([]);
        return;
      }

      setOrders(data.orders || []);

    } catch (error) {
      console.error('Fetch orders error:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Load orders when page opens
  useEffect(() => {
    fetchOrders();
  }, []);


  // ==========================================
  // CANCEL ORDER
  // ==========================================

  const handleCancelOrder = async (orderId) => {
    const isConfirmed = window.confirm(
      'Are you sure you want to cancel this order? This action cannot be undone.'
    );

    if (!isConfirmed) {
      return;
    }

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        alert('Please login first.');
        return;
      }

      const response = await fetch(
        `${API_BASE}/api/orders/${orderId}/cancel`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || 'Failed to cancel order.');
        return;
      }

      alert('Order cancelled successfully.');

      // Refresh orders from MongoDB
      fetchOrders();

    } catch (error) {
      console.error('Cancel order error:', error);

      alert('Something went wrong while cancelling the order.');
    }
  };


  // ==========================================
  // CALCULATE ORDER TOTAL
  // ==========================================

  const getOrderTotal = (items) => {
    return items.reduce(
      (acc, item) =>
        acc + item.price * item.quantity,
      0
    );
  };


  // ==========================================
  // STATUS CLASS
  // ==========================================

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'status-delivered';

      case 'shipped':
        return 'status-shipped';

      case 'processing':
        return 'status-processing';

      case 'cancelled':
        return 'status-cancelled';

      default:
        return 'status-processing';
    }
  };


  // ==========================================
  // STATUS ICON
  // ==========================================

  const StatusIcon = ({ status }) => {
    const lowerStatus = status.toLowerCase();

    if (lowerStatus === 'shipped') {
      return (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="1" y="3" width="15" height="13"></rect>
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
        </svg>
      );
    }

    if (lowerStatus === 'delivered') {
      return (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      );
    }

    if (lowerStatus === 'cancelled') {
      return (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      );
    }

    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
    );
  };


  // ==========================================
  // CHECK IF ORDER CAN BE CANCELLED
  // ==========================================

  const canCancel = (status) => {
    const lower = status.toLowerCase();

    return (
      lower === 'processing' ||
      lower === 'confirmed'
    );
  };


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="orders-wrapper">
        <div className="orders-header">
          <h3>My Orders</h3>
          <p className="orders-subtitle">
            Track, return, or buy things again
          </p>
        </div>

        <div className="orders-empty">
          <h3>Loading orders...</h3>
        </div>
      </div>
    );
  }


  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="orders-wrapper">

      <div className="orders-header">
        <h3>My Orders</h3>

        <p className="orders-subtitle">
          Track, return, or buy things again
        </p>
      </div>


      {orders.length > 0 ? (

        <div className="orders-list">

          {orders.map((order) => (

            <div
              className={`order-card ${order.orderStatus?.toLowerCase() === 'cancelled'
                  ? 'order-cancelled-card'
                  : ''
                }`}
              key={order._id}
            >

              {/* ==============================
                  ORDER TOP ROW
              ============================== */}

              <div className="order-top-row">

                <div className="order-meta">

                  <span className="order-id">
                    ORDER <strong>{order.orderNumber}</strong>
                  </span>

                  <span className="order-date">
                    Placed on{' '}
                    {new Date(order.createdAt).toLocaleDateString(
                      'en-US',
                      {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      }
                    )}
                  </span>

                </div>


                <div className="order-top-actions">

                  <span
                    className={`order-status ${getStatusClass(
                      order.orderStatus
                    )}`}
                  >

                    <StatusIcon
                      status={order.orderStatus}
                    />

                    {order.orderStatus}

                  </span>


                  {/* CANCEL BUTTON */}

                  {canCancel(order.orderStatus) && (

                    <button
                      className="cancel-order-btn"
                      onClick={() =>
                        handleCancelOrder(order._id)
                      }
                    >
                      Cancel Order
                    </button>

                  )}

                </div>

              </div>


              {/* ==============================
                  ORDER ITEMS
              ============================== */}

              <div className="order-items-row">

                {order.items.map((item, index) => (

                  <div
                    className="order-product"
                    key={index}
                  >

                    {/* PRODUCT IMAGE */}

                    <Link
                      to={`/product/${item.product._id}`}
                      className="order-product-img"
                    >

                      <img
                        src={item.image}
                        alt={item.name}
                        onError={(e) => {
                          e.target.src =
                            'https://placehold.co/100x100/f3f4f6/999999?text=No+Image';
                        }}
                      />

                    </Link>


                    {/* PRODUCT DETAILS */}

                    <div className="order-product-details">

                      <Link
                        to={`/product/${item.product._id}`}
                        className="order-product-name"
                      >
                        {item.name}
                      </Link>
                     

                    <span className="order-product-qty">
                      Qty: {item.quantity}
                    </span>

                  </div>


                    {/* PRICE */ }

                  < span className = "order-product-price" >
                  ₹
                      {(
                    item.price * item.quantity
                  ).toFixed(2)}
              </span>

            </div>

          ))}


          {/* TOTAL */}

          <div className="order-total-wrapper">

            <span className="order-total-label">
              Total
            </span>

            <span className="order-total-amount">
              ₹
              {Number(
                order.total ||
                getOrderTotal(order.items)
              ).toFixed(2)}
            </span>

          </div>

        </div>

            </div>

  ))
}

        </div >

      ) : (

  /* ==============================
     EMPTY ORDERS
  ============================== */

  <div className="orders-empty">

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
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>

      <polyline points="14 2 14 8 20 8"></polyline>

    </svg>

    <h3>No orders yet</h3>

    <p>
      Looks like you haven't placed any orders.
    </p>

    <Link
      to="/products"
      className="orders-shop-btn"
    >
      Start Shopping
    </Link>

  </div>

)}

    </div >
  );
};

export default MyOrders;