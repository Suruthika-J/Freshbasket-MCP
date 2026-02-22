// File: CartContext.jsx
// Path: frontend/src/CartContext.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const CartContext = createContext();

const API_BASE_URL = 'http://localhost:4000/api';

// ============================================
// FIXED: Better Auth Token Retrieval
// ============================================
const getAuthHeader = () => {
  const token = localStorage.getItem('authToken') ||
    localStorage.getItem('token') ||
    sessionStorage.getItem('token');

  if (!token) {
    console.log('⚠️ No auth token found in storage');
    return {};
  }

  console.log('✅ Auth token found, attaching to request');

  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

// ============================================
// HANDLE TOKEN EXPIRATION - AUTO LOGOUT
// ============================================
const handleTokenExpiration = () => {
  console.log('🔒 Token expired - clearing session');

  // Clear all auth data
  localStorage.removeItem('authToken');
  localStorage.removeItem('token');
  localStorage.removeItem('userData');
  localStorage.removeItem('userRole');
  sessionStorage.clear();

  // Dispatch auth state change
  window.dispatchEvent(new Event('authStateChanged'));

  // Show notification
  toast.error('Session expired. Please log in again.', {
    position: 'top-center',
    autoClose: 3000,
  });

  // Redirect to login after a short delay
  setTimeout(() => {
    window.location.href = '/login';
  }, 1000);
};

const normalizeItems = (rawItems = []) => {
  return rawItems
    .map(item => {
      const id = item._id || item.productId || item.product?._id;
      const productId = item.productId || item.product?._id;
      const name = item.product?.name || item.name || 'Unnamed';
      const price = item.price ?? item.product?.price ?? 0;
      const imageUrl = item.product?.imageUrl || item.imageUrl || '';

      // ============================================
      // MULTI-VENDOR: Extract vendor information
      // ============================================
      const uploaderRole = item.product?.uploaderRole || item.uploaderRole || 'admin';
      const uploaderId = item.product?.uploaderId || item.uploaderId || 'admin';
      const uploaderName = item.product?.uploaderName || item.uploaderName || 'FreshBasket Admin';

      return {
        ...item,
        id,
        productId,
        name,
        price,
        imageUrl,
        quantity: item.quantity || 0,
        // Vendor tracking
        vendorId: uploaderId,
        vendorType: uploaderRole,
        vendorName: uploaderName
      };
    })
    .filter(item => item.id != null);
};

const calculateShipping = (subtotal) => {
  return subtotal > 1000 ? 0 : 50;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ============================================
  // MULTI-VENDOR: Delivery options per vendor
  // ============================================
  const [deliveryOptions, setDeliveryOptions] = useState({});
  // Format: { vendorId: 'self-pickup' | 'delivery-agent' }

  useEffect(() => {
    // Check if user is authenticated and not a delivery agent
    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');

    console.log('🔐 CartContext init - Token:', !!token, 'Role:', userRole);

    // Only fetch cart for regular users
    if (token && userRole !== 'agent') {
      fetchCart();
    } else {
      console.log('⏭️ Skipping cart fetch - not authenticated or is delivery agent');
      setLoading(false);
    }

    // Listen for auth state changes
    const handleAuthChange = () => {
      const newToken = localStorage.getItem('authToken');
      const newRole = localStorage.getItem('userRole');

      console.log('🔄 Auth state changed - Token:', !!newToken, 'Role:', newRole);

      if (newToken && newRole !== 'agent') {
        fetchCart();
      } else {
        setCart([]);
      }
    };

    window.addEventListener('authStateChanged', handleAuthChange);
    return () => window.removeEventListener('authStateChanged', handleAuthChange);
  }, []);

  const fetchCart = async () => {
    const authHeader = getAuthHeader();
    const userRole = localStorage.getItem('userRole');

    // Don't fetch if no auth or user is delivery agent
    if (!authHeader.headers || userRole === 'agent') {
      console.log('⏭️ Skipping cart fetch - no auth token or user is agent');
      setCart([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      setError(null);

      console.log('📡 Fetching cart from:', `${API_BASE_URL}/cart`);

      const { data } = await axios.get(
        `${API_BASE_URL}/cart`,
        {
          ...authHeader,
          withCredentials: true,
          timeout: 10000,
        }
      );

      const rawItems = Array.isArray(data) ? data :
        Array.isArray(data.items) ? data.items :
          data.cart?.items || [];

      setCart(normalizeItems(rawItems));
      console.log('✅ Cart fetched successfully:', rawItems.length, 'items');

    } catch (err) {
      console.error('❌ Error fetching cart:', err.message);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);

      // ============================================
      // CRITICAL FIX: Handle Token Expiration
      // ============================================
      if (err.response?.status === 401) {
        const errorMsg = err.response?.data?.message || '';

        if (errorMsg.includes('expired') || errorMsg.includes('invalid')) {
          console.log('🔒 Token expired or invalid - logging out');
          handleTokenExpiration();
          return; // Stop execution
        }

        console.log('🔒 Auth token invalid');
        setCart([]);
        setError('Please log in to view your cart');
      } else if (err.response) {
        setError(`Server error: ${err.response.status}`);
      } else if (err.request) {
        setError('Cannot connect to server');
      } else {
        setError(`Request error: ${err.message}`);
      }

      setCart([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshCart = async () => {
    const authHeader = getAuthHeader();
    const userRole = localStorage.getItem('userRole');

    if (!authHeader.headers || userRole === 'agent') {
      console.log('⏭️ Cannot refresh cart - no auth token or user is agent');
      return;
    }

    try {
      setError(null);

      console.log('🔄 Refreshing cart...');

      const { data } = await axios.get(
        `${API_BASE_URL}/cart`,
        {
          ...authHeader,
          withCredentials: true,
          timeout: 10000,
        }
      );

      const rawItems = Array.isArray(data) ? data :
        Array.isArray(data.items) ? data.items :
          data.cart?.items || [];

      setCart(normalizeItems(rawItems));
      console.log('✅ Cart refreshed:', rawItems.length, 'items');

    } catch (err) {
      console.error('❌ Error refreshing cart:', err.message);

      // Handle token expiration on refresh
      if (err.response?.status === 401) {
        const errorMsg = err.response?.data?.message || '';
        if (errorMsg.includes('expired') || errorMsg.includes('invalid')) {
          handleTokenExpiration();
          return;
        }
        setCart([]);
        setError('Please log in to view your cart');
      } else if (err.response) {
        setError(`Refresh failed: ${err.response.status}`);
      } else if (err.request) {
        setError('Cannot connect to server');
      } else {
        setError(`Refresh error: ${err.message}`);
      }
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    const authHeader = getAuthHeader();
    const userRole = localStorage.getItem('userRole');

    if (!authHeader.headers) {
      setError('Please log in to add items to cart');
      throw new Error('Not authenticated');
    }

    if (userRole === 'agent') {
      setError('Delivery agents cannot add items to cart');
      throw new Error('Invalid user role');
    }

    try {
      setError(null);

      console.log('➕ Adding to cart:', { productId, quantity });

      await axios.post(
        `${API_BASE_URL}/cart`,
        { productId, quantity },
        {
          ...authHeader,
          withCredentials: true,
          timeout: 10000,
        }
      );

      await refreshCart();
      console.log('✅ Item added to cart');

    } catch (err) {
      console.error('❌ Error adding to cart:', err.message);

      if (err.response?.status === 401) {
        const errorMsg = err.response?.data?.message || '';
        if (errorMsg.includes('expired') || errorMsg.includes('invalid')) {
          handleTokenExpiration();
          return;
        }
        setError('Please log in to add items');
      } else if (err.response) {
        setError(`Add failed: ${err.response.data?.message || err.response.status}`);
      } else if (err.request) {
        setError('Cannot connect to server');
      } else {
        setError(`Add error: ${err.message}`);
      }
      throw err;
    }
  };

  const updateQuantity = async (lineId, quantity) => {
    const authHeader = getAuthHeader();
    const userRole = localStorage.getItem('userRole');

    if (!authHeader.headers) {
      setError('Please log in');
      throw new Error('Not authenticated');
    }

    if (userRole === 'agent') {
      setError('Delivery agents cannot update cart');
      throw new Error('Invalid user role');
    }

    try {
      setError(null);

      console.log('🔄 Updating quantity:', { lineId, quantity });

      await axios.put(
        `${API_BASE_URL}/cart/${lineId}`,
        { quantity },
        {
          ...authHeader,
          withCredentials: true,
          timeout: 10000,
        }
      );

      await refreshCart();
      console.log('✅ Quantity updated');

    } catch (err) {
      console.error('❌ Error updating quantity:', err.message);

      if (err.response?.status === 401) {
        const errorMsg = err.response?.data?.message || '';
        if (errorMsg.includes('expired') || errorMsg.includes('invalid')) {
          handleTokenExpiration();
          return;
        }
        setError('Please log in');
      } else if (err.response) {
        setError(`Update failed: ${err.response.data?.message || err.response.status}`);
      } else if (err.request) {
        setError('Cannot connect to server');
      } else {
        setError(`Update error: ${err.message}`);
      }
      throw err;
    }
  };

  const removeFromCart = async (lineId) => {
    const authHeader = getAuthHeader();
    const userRole = localStorage.getItem('userRole');

    if (!authHeader.headers) {
      setError('Please log in');
      throw new Error('Not authenticated');
    }

    if (userRole === 'agent') {
      setError('Delivery agents cannot modify cart');
      throw new Error('Invalid user role');
    }

    try {
      setError(null);

      console.log('🗑️ Removing from cart:', lineId);

      await axios.delete(
        `${API_BASE_URL}/cart/${lineId}`,
        {
          ...authHeader,
          withCredentials: true,
          timeout: 10000,
        }
      );

      await refreshCart();
      console.log('✅ Item removed from cart');

    } catch (err) {
      console.error('❌ Error removing from cart:', err.message);

      if (err.response?.status === 401) {
        const errorMsg = err.response?.data?.message || '';
        if (errorMsg.includes('expired') || errorMsg.includes('invalid')) {
          handleTokenExpiration();
          return;
        }
        setError('Please log in');
      } else if (err.response) {
        setError(`Remove failed: ${err.response.data?.message || err.response.status}`);
      } else if (err.request) {
        setError('Cannot connect to server');
      } else {
        setError(`Remove error: ${err.message}`);
      }
      throw err;
    }
  };

  const clearCart = async () => {
    const authHeader = getAuthHeader();
    const userRole = localStorage.getItem('userRole');

    if (!authHeader.headers) {
      setError('Please log in');
      throw new Error('Not authenticated');
    }

    if (userRole === 'agent') {
      setError('Delivery agents cannot clear cart');
      throw new Error('Invalid user role');
    }

    try {
      setError(null);

      console.log('🧹 Clearing cart...');

      await axios.post(
        `${API_BASE_URL}/cart/clear`,
        {},
        {
          ...authHeader,
          withCredentials: true,
          timeout: 10000,
        }
      );

      setCart([]);
      console.log('✅ Cart cleared');

    } catch (err) {
      console.error('❌ Error clearing cart:', err.message);

      if (err.response?.status === 401) {
        const errorMsg = err.response?.data?.message || '';
        if (errorMsg.includes('expired') || errorMsg.includes('invalid')) {
          handleTokenExpiration();
          return;
        }
        setError('Please log in');
      } else if (err.response) {
        setError(`Clear failed: ${err.response.data?.message || err.response.status}`);
      } else if (err.request) {
        setError('Cannot connect to server');
      } else {
        setError(`Clear error: ${err.message}`);
      }
      throw err;
    }
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // ============================================
  // MULTI-VENDOR: Helper Functions
  // ============================================

  /**
   * Groups cart items by vendor
   * Returns: { vendorId: { vendorInfo, items, subtotal } }
   */
  const groupCartByVendor = () => {
    const groups = {};

    cart.forEach(item => {
      const vendorId = item.vendorId || 'admin';

      if (!groups[vendorId]) {
        groups[vendorId] = {
          vendorId,
          vendorType: item.vendorType || 'admin',
          vendorName: item.vendorName || 'FreshBasket Admin',
          items: [],
          subtotal: 0
        };
      }

      groups[vendorId].items.push(item);
      groups[vendorId].subtotal += item.price * item.quantity;
    });

    return groups;
  };

  /**
   * Gets vendor groups as array
   */
  const getVendorGroups = () => {
    return Object.values(groupCartByVendor());
  };

  /**
   * Sets delivery option for a vendor
   */
  const setDeliveryOption = (vendorId, option) => {
    setDeliveryOptions(prev => ({
      ...prev,
      [vendorId]: option
    }));
  };

  /**
   * Gets delivery option for a vendor
   */
  const getDeliveryOption = (vendorId) => {
    return deliveryOptions[vendorId] || null;
  };

  /**
   * Validates delivery options before checkout
   * Returns: { valid: boolean, errors: string[] }
   */
  const validateDeliveryOptions = () => {
    const errors = [];
    const vendorGroups = getVendorGroups();

    vendorGroups.forEach(group => {
      const option = deliveryOptions[group.vendorId];

      if (!option) {
        errors.push(`Please select delivery option for ${group.vendorName}`);
      }

      // Admin products must use delivery-agent
      if (group.vendorType === 'admin' && option !== 'delivery-agent') {
        errors.push(`${group.vendorName} products must use delivery agent`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  };

  /**
   * Calculates delivery charge for a vendor
   */
  const calculateVendorDeliveryCharge = (subtotal, deliveryOption) => {
    if (deliveryOption === 'self-pickup') {
      return 0;
    }
    // Delivery agent charge
    return subtotal >= 500 ? 0 : 40;
  };

  /**
   * Gets total with delivery charges
   */
  const getTotalWithDelivery = () => {
    const vendorGroups = getVendorGroups();
    let total = 0;

    vendorGroups.forEach(group => {
      const deliveryOption = deliveryOptions[group.vendorId];
      const deliveryCharge = calculateVendorDeliveryCharge(group.subtotal, deliveryOption);
      total += group.subtotal + deliveryCharge;
    });

    return total;
  };

  /**
   * Initializes default delivery options for cart
   */
  const initializeDeliveryOptions = () => {
    const vendorGroups = getVendorGroups();
    const newOptions = {};

    vendorGroups.forEach(group => {
      // Admin products default to delivery-agent
      if (group.vendorType === 'admin') {
        newOptions[group.vendorId] = 'delivery-agent';
      } else {
        // Farmer products default to delivery-agent (user can change)
        newOptions[group.vendorId] = deliveryOptions[group.vendorId] || 'delivery-agent';
      }
    });

    setDeliveryOptions(newOptions);
  };

  const getShippingCost = () => {
    const subtotal = getCartTotal();
    return calculateShipping(subtotal);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        cartCount,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        getCartTotal,
        getShippingCost,
        refreshCart,
        // Multi-vendor functions
        groupCartByVendor,
        getVendorGroups,
        deliveryOptions,
        setDeliveryOption,
        getDeliveryOption,
        validateDeliveryOptions,
        calculateVendorDeliveryCharge,
        getTotalWithDelivery,
        initializeDeliveryOptions
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used inside CartProvider');
  }
  return ctx;
};