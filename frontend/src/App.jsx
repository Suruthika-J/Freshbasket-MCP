// File: frontend/src/App.jsx
// Path: frontend/src/App.jsx

import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { CartProvider } from './CartContext';
import { ThemeProvider, useTheme } from './ThemeContext';
import { ChatProvider } from './ChatContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Navigation & Layout
import Navbar from './components/Navbar';
import ChatbotIcon from './components/ChatbotIcon';
import EditProductFarmer from "./page/EditProductFarmer";

// Public Pages
import Home from './page/Home';
import Contact from './page/Contact';
import Items from './page/Items';
import About from './page/About';
import Cart from './page/Cart';
import CheckoutPage from './components/Checkout';
import MyOrdersPage from './page/MyOrdersPage';
import VerifyPaymentPage from './page/VerifyPaymentPage';
import OrderSuccessPage from './page/OrderSuccessPage';
import RecipeChatbot from './page/RecipeChatbot';
import MealPlanner from './page/MealPlanner';

// Authentication Components
import Login from './components/Login';
import Signup from './components/Signup';
import Logout from './components/Logout';

// OTP Verification Components
import OtpVerification from './components/OtpVerification';
import ForgotPassword from './components/ForgotPassword';
import ForgotOtpVerification from './components/ForgotOtpVerification';
import ResetPassword from './components/ResetPassword';

// Profile & Settings
import ProfileSettings from './components/ProfileSettings';

// Delivery Agent Dashboard
import DeliveryDashboard from './page/DeliveryDashboard';

// Farmer Components
import FarmerDashboard from './page/FarmerDashboard';
import AddProductFarmer from './page/AddProductFarmer';
import FarmerPendingApproval from './page/FarmerPendingApproval';
import FarmerChatbot from './page/FarmerChatbot';

import FarmerChatPage from './page/FarmerChatPage';

// Admin Components
import AdminApp from './admin/AdminApp';

// ScrollToTop component
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// ============================================
// Protected Route Component
// ============================================
const ProtectedRoute = ({ children, requiredRole, requiresApproval = false }) => {
  // Get auth data from localStorage
  const token = localStorage.getItem('authToken');
  const userData = localStorage.getItem('userData');
  const userRole = localStorage.getItem('userRole');

  // Parse user data
  let user = null;
  try {
    user = userData ? JSON.parse(userData) : null;
  } catch (e) {
    console.error('Failed to parse user data:', e);
  }

  // Check if user is authenticated
  if (!token) {
    return <Navigate replace to="/login" />;
  }

  // Check if user data exists
  if (!user) {
    localStorage.clear(); // Clear invalid session
    return <Navigate replace to="/login" />;
  }

  // Check if specific role is required
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate replace to="/" />;
  }

  // Farmer approval check
  if (requiredRole === 'farmer' && requiresApproval) {
    if (user.isApproved !== true) {
      return <Navigate replace to="/farmer-pending-approval" />;
    }
  }

  return children;
};

// Inner component that can access ThemeContext
const AppInner = () => {
  const { theme } = useTheme();
  const location = useLocation();

  // Track authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(localStorage.getItem('authToken'))
  );

  // Track user role
  const [userRole, setUserRole] = useState(
    localStorage.getItem('userRole') || 'user'
  );

  // Listen for auth state changes
  useEffect(() => {
    const handler = () => {
      const newAuthStatus = Boolean(localStorage.getItem('authToken'));
      const newRole = localStorage.getItem('userRole') || 'user';
      setIsAuthenticated(newAuthStatus);
      setUserRole(newRole);
    };

    window.addEventListener('authStateChanged', handler);
    return () => window.removeEventListener('authStateChanged', handler);
  }, []);

  // Check if current route is admin route
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Check if current route is order success page
  const isOrderSuccessRoute = location.pathname.startsWith('/order-success');

  // Check if current route is farmer pending approval page
  const isFarmerPendingRoute = location.pathname === '/farmer-pending-approval';

  // Check if current route is farmer dashboard or related pages
  const isFarmerRoute = location.pathname.startsWith('/farmer/') || location.pathname === '/farmer-dashboard' || location.pathname === '/farmer/market-prices' || location.pathname === '/farmer/chat';

  // Don't show navbar, chatbot for admin routes and order success page
  const showNavbar = !isAdminRoute &&
    !isOrderSuccessRoute &&
    !isFarmerPendingRoute &&
    !isFarmerRoute &&
    (userRole !== 'agent' || location.pathname !== '/delivery-dashboard');

  const showChatbotIcon = !isAdminRoute &&
    !isOrderSuccessRoute &&
    !isFarmerPendingRoute &&
    !['/recipe-chatbot', '/delivery-dashboard', '/farmer/market-prices'].includes(location.pathname);

  return (
    <CartProvider>
      <ChatProvider>
        <ScrollToTop />

        {/* Only show Navbar for non-admin and non-delivery-agent routes */}
        {showNavbar && <Navbar isAuthenticated={isAuthenticated} />}

        {/* Main content — pt-20 prevents fixed navbar overlap */}
        <div className={showNavbar ? 'pt-20' : ''}>
          <Routes>
            {/* ==================== PUBLIC ROUTES ==================== */}
            <Route path="/" element={<Home />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
            <Route path="/items" element={<Items />} />
            <Route path="/recipe-chatbot" element={<RecipeChatbot />} />

            {/* ==================== AUTHENTICATION ROUTES ==================== */}
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-otp" element={<OtpVerification />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-forgot-otp" element={<ForgotOtpVerification />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/logout" element={<Logout />} />

            {/* ==================== FARMER PENDING APPROVAL ==================== */}
            <Route path="/farmer-pending-approval" element={<FarmerPendingApproval />} />

            {/* ==================== PROTECTED ROUTES (Regular Users) ==================== */}
            <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
            <Route path="/myorders" element={<ProtectedRoute><MyOrdersPage /></ProtectedRoute>} />
            <Route path="/myorders/verify" element={<ProtectedRoute><VerifyPaymentPage /></ProtectedRoute>} />
            <Route path="/order-success/:orderId" element={<ProtectedRoute><OrderSuccessPage /></ProtectedRoute>} />
            <Route path="/meal-planner" element={<ProtectedRoute><MealPlanner /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />

            {/* ==================== DELIVERY AGENT ROUTES ==================== */}
            <Route path="/delivery-dashboard" element={<ProtectedRoute requiredRole="agent"><DeliveryDashboard /></ProtectedRoute>} />

            {/* ==================== FARMER ROUTES ==================== */}
            <Route path="/farmer-dashboard" element={<ProtectedRoute requiredRole="farmer" requiresApproval={true}><FarmerDashboard /></ProtectedRoute>} />
            <Route path="/farmer/add-product" element={<ProtectedRoute requiredRole="farmer" requiresApproval={true}><AddProductFarmer /></ProtectedRoute>} />
            <Route path="/farmer/edit-product/:id" element={<ProtectedRoute requiredRole="farmer" requiresApproval={true}><EditProductFarmer /></ProtectedRoute>} />
            <Route path="/farmer/market-prices" element={<ProtectedRoute requiredRole="farmer" requiresApproval={true}><FarmerChatbot /></ProtectedRoute>} />
            <Route path="/farmer/chat" element={<ProtectedRoute requiredRole="farmer" requiresApproval={true}><FarmerChatPage /></ProtectedRoute>} />

            {/* ==================== ADMIN ROUTES ==================== */}
            <Route path="/admin/*" element={<AdminApp />} />

            <Route path="*" element={<Navigate replace to="/" />} />
          </Routes>
        </div>

        {showChatbotIcon && <ChatbotIcon />}

        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme={theme}
        />
      </ChatProvider>
    </CartProvider>
  );
};

// Outer App wraps everything in providers
const App = () => {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <AppInner />
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
};

export default App;