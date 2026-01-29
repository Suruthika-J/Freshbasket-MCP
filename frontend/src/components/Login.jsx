// File: frontend/src/components/Login.jsx
// Path: frontend/src/components/Login.jsx
// ✅ FIXED VERSION - Updated Google login route and credential field

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaArrowLeft,
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaCheck,
  FaStore,
} from "react-icons/fa";
import { GiFarmer } from "react-icons/gi";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { loginStyles } from "../assets/dummyStyles";
import Logout from "./Logout";
import { GoogleLogin } from "@react-oauth/google";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(localStorage.getItem("authToken"))
  );
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [intendedRole, setIntendedRole] = useState(
    location.state?.intendedRole || 'customer'
  );

  useEffect(() => {
    const handler = () => {
      setIsAuthenticated(Boolean(localStorage.getItem("authToken")));
    };
    window.addEventListener("authStateChanged", handler);

    if (location.state?.passwordReset) {
      setToastMessage(location.state?.message || "Password reset successful!");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } else if (location.state?.verified) {
      setToastMessage("Email verified successfully! You can now login.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }

    return () => window.removeEventListener("authStateChanged", handler);
  }, [location]);

  // If already authenticated, redirect to appropriate dashboard
  useEffect(() => {
    if (isAuthenticated) {
      const userRole = localStorage.getItem('userRole');
      const userData = localStorage.getItem('userData');

      let user = null;
      try {
        user = userData ? JSON.parse(userData) : null;
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }

      if (userRole === 'admin') {
        navigate('/admin', { replace: true });
      } else if (userRole === 'agent') {
        navigate('/delivery-dashboard', { replace: true });
      } else if (userRole === 'farmer' && user?.isApproved === true) {
        navigate('/farmer-dashboard', { replace: true });
      } else if (userRole === 'farmer' && user?.isApproved !== true) {
        navigate('/farmer-pending-approval', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
  
  // ============================================
  // CRITICAL FIX: Updated login success handler with proper navigation
  // ============================================
  const handleLoginSuccess = (token, user) => {
    console.log('🔐 Login success:', {
      email: user.email,
      role: user.role,
      isApproved: user.isApproved
    });

    // Clear old tokens and data
    localStorage.clear();
    sessionStorage.clear();

    // Store new credentials with approval status
    localStorage.setItem("authToken", token);
    localStorage.setItem("userData", JSON.stringify(user));
    localStorage.setItem("userRole", user.role);

    // CRITICAL: Store approval status for frontend checks
    if (user.role === 'farmer') {
      localStorage.setItem("isApproved", user.isApproved.toString());
    }

    setToastMessage("Login successful!");
    setShowToast(true);

    // Clear loading state
    setIsLoading(false);

    // Dispatch auth state change
    window.dispatchEvent(new Event("authStateChanged"));
    console.log('✅ Auth state changed event dispatched');

    // ============================================
    // CRITICAL FIX: Role-based redirect with approval check using React Router
    // ============================================
    setTimeout(() => {
      if (user.role === 'admin') {
        console.log('✅ Redirecting admin to dashboard');
        navigate('/admin', { replace: true });
      } else if (user.role === 'agent') {
        console.log('✅ Redirecting agent to delivery dashboard');
        navigate('/delivery-dashboard', { replace: true });
      } else if (user.role === 'farmer') {
        // Check approval status for farmers
        if (user.isApproved === true) {
          console.log('✅ Redirecting approved farmer to dashboard');
          navigate('/farmer-dashboard', { replace: true });
        } else {
          console.log('❌ Farmer not approved, redirecting to pending approval page');
          // Don't clear token - let the pending approval page handle logout
          navigate('/farmer-pending-approval', { replace: true });
        }
      } else {
        console.log('✅ Redirecting customer to home');
        navigate('/', { replace: true });
      }
    }, 100);
  };

  // ============================================
  // CRITICAL FIX: Updated submit handler
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      console.log('📤 Sending login request to:', `${API_BASE_URL}/api/user/login`);
      console.log('📤 Login data:', { email: formData.email });

      const response = await axios.post(
        `${API_BASE_URL}/api/user/login`,
        {
          email: formData.email,
          password: formData.password,
        },
        { 
          headers: { "Content-Type": "application/json" },
          timeout: 10000
        }
      );

      console.log('📥 Login response:', response.data);

      if (response.data.success) {
        const { token, user } = response.data;
        console.log('✅ Login successful - User data:', {
          email: user.email,
          role: user.role,
          isApproved: user.isApproved
        });

        // Farmer approval check is now handled in handleLoginSuccess
        handleLoginSuccess(token, user);
      } else {
        setError(response.data.message || "Login failed");
        setIsLoading(false);
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      setIsLoading(false);
      
      if (err.response && err.response.data) {
        const errorData = err.response.data;
        
        console.log('Error response:', errorData);

        // Handle specific error cases
        if (errorData.requiresApproval) {
          setError(errorData.message || "Your farmer account is pending admin approval.");
          return;
        }

        if (errorData.requiresVerification && errorData.email) {
          navigate("/verify-otp", {
            state: {
              email: errorData.email,
              purpose: "signup",
            },
          });
          return;
        }

        setError(errorData.message || "Login error");
      } else if (err.code === 'ECONNABORTED') {
        setError("Connection timeout. Please try again.");
      } else {
        setError("Unable to reach server. Please check your connection.");
      }
    }
  };
  
  // ============================================
  // ✅ FIXED: Google Login Handler - Updated route and field name
  // ============================================
  const handleGoogleLoginSuccess = async (credentialResponse) => {
    setError("");
    setIsLoading(true);
    console.log('🔑 Google login initiated');
    console.log('🔑 Credential response:', credentialResponse);
    
    try {
      console.log('📤 Sending Google auth request to:', `${API_BASE_URL}/api/user/google-auth`);
      
      const response = await axios.post(
        `${API_BASE_URL}/api/user/google-auth`, // ✅ FIXED: Changed from /google-login to /google-auth
        {
          credential: credentialResponse.credential, // ✅ FIXED: Changed from 'token' to 'credential'
        },
        { 
          timeout: 10000,
          headers: { "Content-Type": "application/json" }
        }
      );

      console.log('📥 Google auth response:', response.data);

      if (response.data.success) {
        const { token, user } = response.data;
        console.log('✅ Google login successful:', user.email);
        handleLoginSuccess(token, user);
      } else {
        setError(response.data.message || "Google login failed.");
        setIsLoading(false);
      }
    } catch (err) {
      console.error('❌ Google login error:', err);
      console.error('❌ Error response:', err.response?.data);
      setError(err.response?.data?.message || "Google login failed. Please try again.");
      setIsLoading(false);
    }
  };

  const handleGoogleLoginError = () => {
    console.error('❌ Google login failed');
    setError("Google login failed. Please try again.");
  };

  const handleRetailerLogin = () => {
    navigate('/admin/login');
  };
  
  const handleSignupRedirect = () => {
    navigate('/signup', { state: { intendedRole } });
  };

  return (
    <div className={loginStyles.page}>
      <Link to="/" className={loginStyles.backLink}>
        <FaArrowLeft className="mr-2" />
        Back to Home
      </Link>

      {showToast && (
        <div className={loginStyles.toast}>
          <FaCheck className="mr-2" />
          {toastMessage}
        </div>
      )}

      <div className={loginStyles.loginCard}>
        <div className={loginStyles.logoContainer}>
          <div className={loginStyles.logoOuter}>
            <div className={loginStyles.logoInner}>
              {intendedRole === 'farmer' ? (
                <GiFarmer className={loginStyles.logoIcon} />
              ) : (
                <FaUser className={loginStyles.logoIcon} />
              )}
            </div>
          </div>
        </div>

        <h2 className={loginStyles.title}>
          {intendedRole === 'farmer' ? 'Farmer Login' : 'Welcome Back'}
        </h2>
        
        <div className="mb-4 text-center">
          <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
            intendedRole === 'farmer' 
              ? 'bg-amber-100 text-amber-800' 
              : 'bg-emerald-100 text-emerald-800'
          }`}>
            {intendedRole === 'farmer' ? '🌾 Logging in as Farmer' : '🛒 Logging in as Customer'}
          </span>
        </div>

        <form onSubmit={handleSubmit} className={loginStyles.form}>
          <div className={loginStyles.inputContainer}>
            <FaUser className={loginStyles.inputIcon} />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
              required
              disabled={isLoading}
              className={loginStyles.input}
              autoComplete="email"
            />
          </div>

          <div className={loginStyles.inputContainer}>
            <FaLock className={loginStyles.inputIcon} />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              required
              disabled={isLoading}
              className={loginStyles.passwordInput}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className={loginStyles.toggleButton}
              disabled={isLoading}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <div className={loginStyles.rememberContainer}>
            <label className={loginStyles.rememberLabel}>
              <input
                type="checkbox"
                name="remember"
                checked={formData.remember}
                onChange={handleChange}
                disabled={isLoading}
                className={loginStyles.rememberCheckbox}
              />
              Remember me
            </label>
            <Link to="/forgot-password" className={loginStyles.forgotLink}>
              Forgot Password?
            </Link>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              <p className="text-sm font-semibold">{error}</p>
              {error.includes("pending admin approval") && (
                <p className="text-xs mt-2">
                  Your account needs to be approved by an administrator before you can access the farmer dashboard. 
                  Please contact support if you've been waiting for more than 24 hours.
                </p>
              )}
            </div>
          )}

          <button 
            type="submit" 
            className={loginStyles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing In...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
        
        {intendedRole === 'customer' && (
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-green-100 text-black-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleLoginSuccess}
                onError={handleGoogleLoginError}
                useOneTap
                theme="outline"
                shape="pill"
                width="300px"
              />
            </div>
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={handleRetailerLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-3 border-2 border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-all duration-200 font-semibold group disabled:opacity-50"
          >
            <FaStore className="mr-2 group-hover:scale-110 transition-transform" />
            Are you a Retailer? Login Here
          </button>
        </div>

        <p className={loginStyles.signupText}>
          Don't have an account?{" "}
          <button
            onClick={handleSignupRedirect}
            disabled={isLoading}
            className={loginStyles.signupLink}
          >
            Sign Up as {intendedRole === 'farmer' ? 'Farmer' : 'Customer'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;