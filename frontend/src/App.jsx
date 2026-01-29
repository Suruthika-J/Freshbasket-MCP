// File: frontend/src/App.jsx
// Path: frontend/src/App.jsx

import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { CartProvider } from './CartContext';
import { ThemeProvider } from './ThemeContext';
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
import Cart from './page/Cart';
import CheckoutPage from './components/Checkout';
import MyOrders from './components/OrderPage';
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

  console.log('🔐 ProtectedRoute Check:', {
    hasToken: !!token,
    userRole: userRole,
    requiredRole: requiredRole,
    requiresApproval: requiresApproval,
    userApprovalStatus: user?.isApproved
  });

  // Check if user is authenticated
  if (!token) {
    console.log('❌ No token found, redirecting to login');
    return <Navigate replace to="/login" />;
  }

  // Check if user data exists
  if (!user) {
    console.log('❌ No user data found, redirecting to login');
    localStorage.clear(); // Clear invalid session
    return <Navigate replace to="/login" />;
  }

  // Check if specific role is required
  if (requiredRole && userRole !== requiredRole) {
    console.log('❌ Role mismatch:', { expected: requiredRole, actual: userRole });
    return <Navigate replace to="/" />;
  }

  // ============================================
  // CRITICAL: Farmer approval check
  // ============================================
  if (requiredRole === 'farmer' && requiresApproval) {
    console.log('🌾 Checking farmer approval status:', user.isApproved);
    
    if (user.isApproved !== true) {
      console.log('❌ Farmer not approved, redirecting to pending approval page');
      return <Navigate replace to="/farmer-pending-approval" />;
    }
  }

  console.log('✅ Protected route access granted');
  return children;
};

const App = () => {
  const location = useLocation();
  
  // Track authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(localStorage.getItem('authToken'))
  );
  
  // Track user role
  const [userRole, setUserRole] = useState(
    localStorage.getItem('userRole') || 'user'
  );
  
  // Debug: Check if Google Client ID is loaded
  useEffect(() => {
    console.log('Google Client ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID ? '✅ Loaded' : '❌ Missing');
    console.log('API URL:', import.meta.env.VITE_API_URL);
  }, []);
  
  // Listen for auth state changes
  useEffect(() => {
    const handler = () => {
      const newAuthStatus = Boolean(localStorage.getItem('authToken'));
      const newRole = localStorage.getItem('userRole') || 'user';
      
      console.log('🔄 Auth state changed:', {
        authenticated: newAuthStatus,
        role: newRole
      });
      
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
  
  // Don't show navbar, chatbot for admin routes and order success page
  const showNavbar = !isAdminRoute && 
                     !isOrderSuccessRoute &&
                     !isFarmerPendingRoute &&
                     (userRole !== 'agent' || location.pathname !== '/delivery-dashboard');
  
  const showChatbotIcon = !isAdminRoute && 
                          !isOrderSuccessRoute &&
                          !isFarmerPendingRoute &&
                          !['/recipe-chatbot', '/delivery-dashboard'].includes(location.pathname);

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <CartProvider>
          <ScrollToTop />

          {/* Only show Navbar for non-admin and non-delivery-agent routes */}
          {showNavbar && <Navbar isAuthenticated={isAuthenticated} />}

          <Routes>
            {/* ==================== PUBLIC ROUTES ==================== */}
            
            {/* Home & Shopping */}
            <Route path="/" element={<Home />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/items" element={<Items />} />
            
            {/* Recipe Chatbot */}
            <Route path="/recipe-chatbot" element={<RecipeChatbot />} />
            
            {/* ==================== AUTHENTICATION ROUTES ==================== */}
            
            {/* Signup Flow with OTP Verification */}
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-otp" element={<OtpVerification />} />
            
            {/* Login */}
            <Route path="/login" element={<Login />} />
            
            {/* Forgot Password Flow with OTP Verification */}
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-forgot-otp" element={<ForgotOtpVerification />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Logout */}
            <Route path="/logout" element={<Logout />} />
            
            {/* ==================== FARMER PENDING APPROVAL ==================== */}
            <Route path="/farmer-pending-approval" element={<FarmerPendingApproval />} />
            
            {/* ==================== PROTECTED ROUTES (Regular Users) ==================== */}
            
            {/* Cart - Requires Authentication */}
            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <Cart />
                </ProtectedRoute>
              }
            />
            
            {/* Checkout - Requires Authentication */}
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />
            
            {/* My Orders - Requires Authentication */}
            <Route
              path="/myorders"
              element={
                <ProtectedRoute>
                  <MyOrders />
                </ProtectedRoute>
              }
            />
            
            {/* Payment Verification - Requires Authentication */}
            <Route
              path="/myorders/verify"
              element={
                <ProtectedRoute>
                  <VerifyPaymentPage />
                </ProtectedRoute>
              }
            />
            
            {/* Order Success Page - Requires Authentication */}
            <Route
              path="/order-success/:orderId"
              element={
                <ProtectedRoute>
                  <OrderSuccessPage />
                </ProtectedRoute>
              }
            />
            
            {/* Meal Planner - Requires Authentication */}
            <Route
              path="/meal-planner"
              element={
                <ProtectedRoute>
                  <MealPlanner />
                </ProtectedRoute>
              }
            />
            
            {/* Profile Settings - Requires Authentication */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfileSettings />
                </ProtectedRoute>
              }
            />
            
            {/* ==================== DELIVERY AGENT ROUTES ==================== */}

            {/* Delivery Dashboard - Requires 'agent' role */}
            <Route
              path="/delivery-dashboard"
              element={
                <ProtectedRoute requiredRole="agent">
                  <DeliveryDashboard />
                </ProtectedRoute>
              }
            />

            {/* ==================== FARMER ROUTES ==================== */}

            {/* Farmer Dashboard - Requires 'farmer' role AND approval */}
            <Route
              path="/farmer-dashboard"
              element={
                <ProtectedRoute requiredRole="farmer" requiresApproval={true}>
                  <FarmerDashboard />
                </ProtectedRoute>
              }
            />

            {/* Add Product - Requires 'farmer' role AND approval */}
            <Route
              path="/farmer/add-product"
              element={
                <ProtectedRoute requiredRole="farmer" requiresApproval={true}>
                  <AddProductFarmer />
                </ProtectedRoute>
              }
            />

            {/* Edit Product - Requires 'farmer' role AND approval */}
            <Route
              path="/farmer/edit-product/:productId"
              element={
                <ProtectedRoute requiredRole="farmer" requiresApproval={true}>
                  <EditProductFarmer />
                </ProtectedRoute>
              }
            />

            <Route
              path="/farmer/edit-product/:id"
              element={
                <ProtectedRoute requiredRole="farmer" requiresApproval={true}>
                  <EditProductFarmer />
                </ProtectedRoute>
              }
            />  

            {/* ==================== ADMIN ROUTES ==================== */}
            
            {/* Admin Panel - All admin routes handled by AdminApp */}
            <Route path="/admin/*" element={<AdminApp />} />
            
            {/* ==================== FALLBACK ROUTE ==================== */}
            
            {/* 404 - Redirect to home */}
            <Route path="*" element={<Navigate replace to="/" />} />
          </Routes>
          
          {/* Floating Chatbot Icon (shown on appropriate pages) */}
          {showChatbotIcon && <ChatbotIcon />}
          
          {/* Toast Container for notifications */}
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
            theme="light"
          />
        </CartProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
};

export default App;