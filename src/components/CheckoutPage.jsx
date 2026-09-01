import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CheckoutPage.css';
import { API_BASE } from '../config';

const API = API_BASE;

// =====================================================
// RAZORPAY SCRIPT LOADER
// Script sirf ek baar load hoti hai
// =====================================================

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      return resolve(true);
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });

const CheckoutPage = ({ cartItems, dispatch  }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', city: '', state: '', zip: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [processing, setProcessing] = useState(false);

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shipping = subtotal > 999 ? 0 : 49;
  const total = subtotal + shipping;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  if (
    !formData.firstName ||
    !formData.email ||
    !formData.address ||
    !formData.city
  ) {
    return alert('Please fill in all required fields.');
  }

  if (cartItems.length === 0) {
    return alert('Your cart is empty!');
  }

  const token = localStorage.getItem('token');

  if (!token) {
    alert('Please login before placing your order.');
    navigate('/login');
    return;
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const shippingAddress = {
    firstName: formData.firstName,
    lastName: formData.lastName,
    email: formData.email,
    phone: formData.phone,
    address: formData.address,
    city: formData.city,
    state: formData.state,
    zip: formData.zip,
  };

  setProcessing(true);

  try {
    // =================================================
    // STEP 1 — ORDER BANAO (dono methods ke liye)
    // Stock yahi deduct hota hai. Online payment ke
    // liye order Pending rehta hai jab tak pay na ho.
    // =================================================

    const orderResponse = await fetch(`${API}/api/orders`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        shippingAddress,
        paymentMethod,
      }),
    });

    const orderData = await orderResponse.json();

    if (!orderResponse.ok) {
      setProcessing(false);
      return alert(orderData.message || 'Failed to place order.');
    }

    const order = orderData.order;

    // =================================================
    // COD — yahi khatam
    // =================================================

    if (paymentMethod === 'COD') {
      dispatch({ type: 'CLEAR_CART' });
      setProcessing(false);

      return navigate('/order-success', {
        state: { orderId: order.orderNumber },
      });
    }

    // =================================================
    // ONLINE — STEP 2: RAZORPAY ORDER BANAO
    // =================================================

    const scriptLoaded = await loadRazorpayScript();

    if (!scriptLoaded) {
      setProcessing(false);
      return alert(
        'Could not load the payment window. Check your internet connection.'
      );
    }

    const payResponse = await fetch(
      `${API}/api/payment/create-order`,
      {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ orderId: order._id }),
      }
    );

    const payData = await payResponse.json();

    if (!payResponse.ok) {
      setProcessing(false);
      return alert(payData.message || 'Could not start payment.');
    }

    // =================================================
    // STEP 3 — RAZORPAY POPUP
    // =================================================

    const razorpay = new window.Razorpay({
      key: payData.key,
      amount: payData.amount,
      currency: payData.currency,
      order_id: payData.razorpayOrderId,

      name: 'Shopora',
      description: `Order ${payData.orderNumber}`,

      prefill: {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        contact: formData.phone,
      },

      theme: { color: '#e63946' },

      // ---------------------------------------------
      // PAYMENT SUCCESS — ab backend verify karega
      // ---------------------------------------------
      handler: async (response) => {
        try {
          const verifyResponse = await fetch(
            `${API}/api/payment/verify`,
            {
              method: 'POST',
              headers: authHeaders,
              body: JSON.stringify({
                orderId: order._id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            }
          );

          const verifyData = await verifyResponse.json();

          if (!verifyResponse.ok) {
            setProcessing(false);
            return alert(
              verifyData.message ||
              'Payment could not be verified. Contact support with your order number.'
            );
          }

          dispatch({ type: 'CLEAR_CART' });
          setProcessing(false);

          navigate('/order-success', {
            state: { orderId: order.orderNumber },
          });

        } catch (error) {
          console.error('Verify error:', error);
          setProcessing(false);
          alert('Payment verification failed. Please contact support.');
        }
      },

      // ---------------------------------------------
      // POPUP BAND — order cancel, stock waapas
      // ---------------------------------------------
      modal: {
        ondismiss: async () => {
          setProcessing(false);

          await fetch(`${API}/api/payment/failed`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ orderId: order._id }),
          }).catch(() => {});

          alert('Payment cancelled. Your cart is still saved.');
        },
      },
    });

    razorpay.on('payment.failed', async (response) => {
      setProcessing(false);

      await fetch(`${API}/api/payment/failed`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ orderId: order._id }),
      }).catch(() => {});

      alert(
        response.error?.description || 'Payment failed. Please try again.'
      );
    });

    razorpay.open();

  } catch (error) {
    console.error('Place order error:', error);
    setProcessing(false);
    alert('Something went wrong while placing your order.');
  }
};

  return (
    <div className="checkout-wrapper">
      <div className="checkout-container">
        <h1 className="checkout-main-title">Checkout</h1>
        
        <form className="checkout-grid" onSubmit={handleSubmit}>
          {/* Left Side: Shipping Details */}
          <div className="checkout-forms">
            <div className="checkout-card">
              <h3>Shipping Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Email Address *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group full-width">
                <label>Street Address *</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City *</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input type="text" name="state" value={formData.state} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>ZIP Code</label>
                  <input type="text" name="zip" value={formData.zip} onChange={handleChange} />
                </div>
              </div>
            </div>

            <div className="checkout-card">
              <h3>Payment Method</h3>

              <label
                className={`pay-option ${paymentMethod === 'COD' ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                />
                <span>
                  <strong>Cash on Delivery</strong>
                  <small>Pay when your order arrives</small>
                </span>
              </label>

              <label
                className={`pay-option ${paymentMethod === 'ONLINE' ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="ONLINE"
                  checked={paymentMethod === 'ONLINE'}
                  onChange={() => setPaymentMethod('ONLINE')}
                />
                <span>
                  <strong>Pay online</strong>
                  <small>UPI, cards, net banking and wallets</small>
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="place-order-btn"
              disabled={processing}
            >
              {processing
                ? 'Please wait…'
                : paymentMethod === 'COD'
                ? `Place Order - ₹${total.toFixed(2)}`
                : `Pay ₹${total.toFixed(2)}`}
            </button>
          </div>

          {/* Right Side: Order Summary */}
          <div className="checkout-summary">
            <h3>Order Summary ({cartItems.length} items)</h3>
            <div className="summary-items">
              {cartItems.map(item => (
                <div className="summary-item" key={item.id}>
                  <div className="summary-item-img">
                    <img src={item.image || item.images?.[0]} alt={item.name} />
                    <span className="summary-item-qty">{item.quantity}</span>
                  </div>
                  <div className="summary-item-info">
                    <span className="summary-item-name">{item.name}</span>
                    <span className="summary-item-price">{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="summary-totals">
              <div className="summary-row"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
              <div className="summary-row"><span>Shipping</span><span style={{ color: shipping === 0 ? '#10B981' : '#111' }}>{shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}</span></div>
              <div className="summary-divider"></div>
              <div className="summary-row total-row"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;