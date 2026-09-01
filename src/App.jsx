
import React, {
  useReducer,
  useEffect,
  useState,
  useCallback,
} from 'react';

import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from 'react-router-dom';

import Navbar from './components/Navbar';
import HeroSection from './components/Hero';
import Categories from './components/CategoryCards';
import FeaturedProducts from './components/FeaturedProducts';
import ProductListPage from './pages/ProductListPage';
import Footer from './components/Footer';
import ProductDetailsPage from './components/ProductDetailsPage';
import ScrollToTop from './components/ScrollToTop';
import WishlistPage from './components/WishlistPage';
import CartPage from './components/CartPage';
import AuthPage from './components/AuthPage';
import ProfilePage, { PersonalInfo } from './components/ProfilePage';
import MyOrders from './components/MyOrders';
import CheckoutPage from './components/CheckoutPage';
import OrderSuccessPage from './components/OrderSuccessPage';
import NotFound from './components/NotFound';
import GoogleAuthSuccess from './components/GoogleAuthSuccess';

import AdminRoute from './admin/AdminRoute';
import AdminLayout from './admin/AdminLayout';
import AdminDashboard from './admin/AdminDashboard';
import AdminProducts from './admin/AdminProducts';
import AdminOrders from './admin/AdminOrders';
import AdminUsers from './admin/AdminUsers';
import { API_BASE } from './config';


// =====================================================
// CART REDUCER
// =====================================================

const cartReducer = (state, action) => {
  switch (action.type) {

    case 'ADD_TO_CART': {
      const existingItem = state.items.find(
        item => item.id === action.payload.id
      );

      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                }
              : item
          ),
        };
      }

      return {
        ...state,
        items: [
          ...state.items,
          {
            ...action.payload,
            quantity: 1,
          },
        ],
      };
    }

    case 'REMOVE_FROM_CART':
      return {
        ...state,
        items: state.items.filter(
          item => item.id !== action.payload.id
        ),
      };

    case 'CHANGE_CART_QTY': {
      const { id, type } = action.payload;

      return {
        ...state,
        items: state.items
          .map(item => {

            if (item.id !== id) {
              return item;
            }

            if (type === 'increase') {
              return {
                ...item,
                quantity: item.quantity + 1,
              };
            }

            if (type === 'decrease') {
              return {
                ...item,
                quantity: item.quantity - 1,
              };
            }

            return item;
          })
          .filter(item => item.quantity > 0),
      };
    }

    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
      };

    case 'LOAD_CART':
      return {
        ...state,
        items: action.payload,
      };

    default:
      return state;
  }
};


// =====================================================
// WISHLIST REDUCER
// =====================================================

const wishlistReducer = (state, action) => {
  switch (action.type) {

    case 'LOAD_WISHLIST':
      return {
        ...state,
        items: action.payload,
      };

    case 'TOGGLE_WISHLIST': {
      const product = action.payload;

      const exists = state.items.some(
        item => item.id === product.id
      );

      if (exists) {
        return {
          ...state,
          items: state.items.filter(
            item => item.id !== product.id
          ),
        };
      }

      return {
        ...state,
        items: [...state.items, product],
      };
    }

    case 'CLEAR_WISHLIST':
      return {
        ...state,
        items: [],
      };

    default:
      return state;
  }
};


// =====================================================
// AUTH REDUCER
// =====================================================

const authReducer = (state, action) => {
  switch (action.type) {

    case 'LOGIN':
      return {
        ...state,
        user: action.payload,
      };

    case 'LOGOUT':
      return {
        ...state,
        user: null,
      };

    default:
      return state;
  }
};


// =====================================================
// APP CONTENT
// =====================================================

function AppContent() {

  const navigate = useNavigate();
  const location = useLocation();


  // ===================================================
  // CART STATE
  // ===================================================

  const [cart, dispatch] = useReducer(
    cartReducer,
    {
      items: [],
    }
  );


  // ===================================================
  // WISHLIST STATE
  // ===================================================

  const [wishlist, wishlistDispatch] = useReducer(
    wishlistReducer,
    {
      items: [],
    }
  );


  // ===================================================
  // AUTH STATE
  // ===================================================

  const [auth, authDispatch] = useReducer(
    authReducer,
    {
      user: null,
    }
  );


  // ===================================================
  // AUTH LOADING
  // ===================================================

  const [authLoading, setAuthLoading] = useState(true);


  // ===================================================
  // ADMIN ROUTES PAR STORE NAVBAR/FOOTER HIDE
  // ===================================================

  const isAdminRoute =
    location.pathname.startsWith('/admin');


  // ===================================================
  // CHECK CURRENT USER
  // ===================================================

  useEffect(() => {

    const token = localStorage.getItem('token');

    if (!token) {
      setAuthLoading(false);
      return;
    }

    const getCurrentUser = async () => {

      try {

        const response = await fetch(
          `${API_BASE}/api/auth/profile`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {

          localStorage.removeItem('token');
          return;

        }

        authDispatch({
          type: 'LOGIN',
          payload: data.user,
        });

      } catch (error) {

        console.error(
          'Authentication error:',
          error
        );

        localStorage.removeItem('token');

      } finally {

        setAuthLoading(false);

      }
    };

    getCurrentUser();

  }, []);


  // ===================================================
  // LOAD CART FROM MONGODB
  // ===================================================

  useEffect(() => {

    const token = localStorage.getItem('token');

    if (!token) {
      return;
    }

    const loadCart = async () => {

      try {

        const response = await fetch(
          `${API_BASE}/api/cart`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {

          console.error(
            'Failed to load cart:',
            data.message
          );

          return;
        }

        const mongoCartItems =
          data.cart?.items || [];

        const formattedCartItems =
          mongoCartItems
            .filter(item => item.product)
            .map(item => ({
              ...item.product,
              id: item.product._id,
              quantity: item.quantity,
            }));

        dispatch({
          type: 'LOAD_CART',
          payload: formattedCartItems,
        });

      } catch (error) {

        console.error(
          'Load cart error:',
          error
        );

      }
    };

    loadCart();

  }, []);


  // ===================================================
  // LOAD WISHLIST FROM MONGODB
  // ===================================================

  useEffect(() => {

    const token = localStorage.getItem('token');

    if (!token) {
      return;
    }

    const loadWishlist = async () => {

      try {

        const response = await fetch(
          `${API_BASE}/api/wishlist`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {

          console.error(
            'Failed to load wishlist:',
            data.message
          );

          return;
        }

        const mongoWishlistItems =
          data.wishlist?.items || [];

        const formattedWishlistItems =
          mongoWishlistItems
            .filter(item => item.product)
            .map(item => ({
              ...item.product,
              id: item.product._id,
            }));

        wishlistDispatch({
          type: 'LOAD_WISHLIST',
          payload: formattedWishlistItems,
        });

      } catch (error) {

        console.error(
          'Load wishlist error:',
          error
        );

      }
    };

    loadWishlist();

  }, []);


  // ===================================================
  // WISHLIST BACKEND DISPATCH
  // ===================================================

  const handleWishlistDispatch = async action => {

    const token = localStorage.getItem('token');

    if (!token) {

      navigate('/login');
      return;

    }

    if (action.type === 'TOGGLE_WISHLIST') {

      try {

        const response = await fetch(
          `${API_BASE}/api/wishlist/toggle`,
          {
            method: 'POST',

            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },

            body: JSON.stringify({
              productId: action.payload.id,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {

          console.error(
            'Wishlist update failed:',
            data.message
          );

          return;
        }

        const mongoWishlistItems =
          data.wishlist?.items || [];

        const formattedWishlistItems =
          mongoWishlistItems
            .filter(item => item.product)
            .map(item => ({
              ...item.product,
              id: item.product._id,
            }));

        wishlistDispatch({
          type: 'LOAD_WISHLIST',
          payload: formattedWishlistItems,
        });

      } catch (error) {

        console.error(
          'Wishlist update error:',
          error
        );

      }

      return;
    }

    wishlistDispatch(action);
  };


  // ===================================================
  // CART & WISHLIST COUNTS
  // ===================================================

  const totalCartItems =
    cart.items.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );

  const totalWishlistItems =
    wishlist.items.length;


  // ===================================================
  // LOGIN
  // IMPORTANT:
  // useCallback prevents GoogleAuthSuccess infinite loop
  // ===================================================

  const handleLogin = useCallback(async (userData) => {

    // Update logged-in user
    authDispatch({
      type: 'LOGIN',
      payload: userData,
    });


    const token =
      localStorage.getItem('token');


    if (!token) {
      return;
    }


    // =================================================
    // LOAD CART AFTER LOGIN
    // =================================================

    try {

      const response = await fetch(
        `${API_BASE}/api/cart`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();


      if (response.ok) {

        const mongoCartItems =
          data.cart?.items || [];

        const formattedCartItems =
          mongoCartItems
            .filter(item => item.product)
            .map(item => ({
              ...item.product,
              id: item.product._id,
              quantity: item.quantity,
            }));

        dispatch({
          type: 'LOAD_CART',
          payload: formattedCartItems,
        });

      }

    } catch (error) {

      console.error(
        'Cart loading after login error:',
        error
      );

    }


    // =================================================
    // LOAD WISHLIST AFTER LOGIN
    // =================================================

    try {

      const response = await fetch(
        `${API_BASE}/api/wishlist`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();


      if (response.ok) {

        const mongoWishlistItems =
          data.wishlist?.items || [];

        const formattedWishlistItems =
          mongoWishlistItems
            .filter(item => item.product)
            .map(item => ({
              ...item.product,
              id: item.product._id,
            }));

        wishlistDispatch({
          type: 'LOAD_WISHLIST',
          payload: formattedWishlistItems,
        });

      }

    } catch (error) {

      console.error(
        'Wishlist loading after login error:',
        error
      );

    }

  }, []);


  // ===================================================
  // LOGOUT
  // ===================================================

  const handleLogout = () => {

    localStorage.removeItem('token');

    authDispatch({
      type: 'LOGOUT',
    });

    dispatch({
      type: 'CLEAR_CART',
    });

    wishlistDispatch({
      type: 'CLEAR_WISHLIST',
    });

    navigate('/login');

  };


  // ===================================================
  // PLACE ORDER
  // ===================================================

  const handlePlaceOrder = newOrder => {

    const existingOrders =
      JSON.parse(
        localStorage.getItem(
          'shopora_orders'
        ) || '[]'
      );

    const updatedOrders = [
      newOrder,
      ...existingOrders,
    ];

    localStorage.setItem(
      'shopora_orders',
      JSON.stringify(updatedOrders)
    );

    dispatch({
      type: 'CLEAR_CART',
    });

    navigate(
      '/order-success',
      {
        state: {
          orderId: newOrder.id,
        },
      }
    );

  };


  // ===================================================
  // APP UI
  // ===================================================

  return (
    <>

      <ScrollToTop />


      {!authLoading && !isAdminRoute && (

        <Navbar

          cartCount={
            totalCartItems
          }

          wishlistCount={
            totalWishlistItems
          }

          user={
            auth.user
          }

          onLogout={
            handleLogout
          }

        />

      )}


      <Routes>

        {/* =============================================
            HOME
        ============================================= */}

        <Route
          path="/"
          element={
            <>

              <HeroSection />

              <Categories />

              <FeaturedProducts
                cartItems={cart.items}
                dispatch={dispatch}
                wishlistItems={wishlist.items}
                dispatchWishlist={handleWishlistDispatch}
              />

            </>
          }
        />


        {/* =============================================
            PRODUCTS
        ============================================= */}

        <Route
          path="/products"
          element={
            <ProductListPage
              cartItems={cart.items}
              dispatch={dispatch}
              wishlistItems={wishlist.items}
              dispatchWishlist={handleWishlistDispatch}
            />
          }
        />


        {/* =============================================
            PRODUCT DETAILS
        ============================================= */}

        <Route
          path="/product/:id"
          element={
            <ProductDetailsPage
              cartItems={cart.items}
              dispatch={dispatch}
              wishlistItems={wishlist.items}
              dispatchWishlist={handleWishlistDispatch}
            />
          }
        />


        {/* =============================================
            WISHLIST
        ============================================= */}

        <Route
          path="/wishlist"
          element={
            <WishlistPage
              wishlistItems={wishlist.items}
              dispatchWishlist={handleWishlistDispatch}
              cartItems={cart.items}
              dispatch={dispatch}
            />
          }
        />


        {/* =============================================
            CART
        ============================================= */}

        <Route
          path="/cart"
          element={
            <CartPage
              cartItems={cart.items}
              dispatch={dispatch}
            />
          }
        />


        {/* =============================================
            LOGIN
        ============================================= */}

        <Route
          path="/login"
          element={
            <AuthPage
              onLogin={handleLogin}
            />
          }
        />


        {/* =============================================
            REGISTER
        ============================================= */}

        <Route
          path="/register"
          element={
            <AuthPage
              onLogin={handleLogin}
            />
          }
        />


        {/* =============================================
            PROFILE
        ============================================= */}

        <Route
          path="/profile"
          element={
            <ProfilePage
              user={auth.user}
              onLogout={handleLogout}
              wishlistItems={wishlist.items}
              cartItems={cart.items}
              dispatch={dispatch}
              onUserUpdate={(updatedUser) => {
                authDispatch({
                  type: 'LOGIN',
                  payload: updatedUser,
                });
              }}
            />
          }
        >

          <Route
            index
            element={
              <PersonalInfo
                user={auth.user}
              />
            }
          />

          <Route
            path="orders"
            element={
              <MyOrders />
            }
          />

        </Route>


        {/* =============================================
            CHECKOUT
        ============================================= */}

        <Route
          path="/checkout"
          element={
            <CheckoutPage
              cartItems={cart.items}
              dispatch={dispatch}
            />
          }
        />


        {/* =============================================
            ORDER SUCCESS
        ============================================= */}

        <Route
          path="/order-success"
          element={
            <OrderSuccessPage />
          }
        />


        {/* =============================================
            GOOGLE AUTH SUCCESS
        ============================================= */}

        <Route
          path="/auth/google/success"
          element={
            <GoogleAuthSuccess
              onLogin={handleLogin}
            />
          }
        />


        {/* =============================================
            ADMIN PANEL
        ============================================= */}

        <Route
          path="/admin"
          element={
            <AdminRoute
              user={auth.user}
              authLoading={authLoading}
            >
              <AdminLayout
                user={auth.user}
                onLogout={handleLogout}
              />
            </AdminRoute>
          }
        >

          <Route
            index
            element={<AdminDashboard />}
          />

          <Route
            path="products"
            element={<AdminProducts />}
          />

          <Route
            path="orders"
            element={<AdminOrders />}
          />

          <Route
            path="users"
            element={
              <AdminUsers currentUser={auth.user} />
            }
          />

        </Route>


        {/* =============================================
            404
        ============================================= */}

        <Route
          path="*"
          element={
            <NotFound />
          }
        />

      </Routes>


      {!isAdminRoute && <Footer />}

    </>
  );
}


// =====================================================
// MAIN APP
// =====================================================

function App() {

  return (

    <Router>

      <AppContent />

    </Router>

  );
}


export default App;

