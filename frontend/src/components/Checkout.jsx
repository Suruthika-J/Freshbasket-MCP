// frontend/src/components/Checkout.jsx
// UPDATED VERSION - Sends flat items array, backend handles vendor grouping

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCheck, FiCreditCard, FiTruck, FiUser, FiPackage, FiShoppingBag } from 'react-icons/fi';
import { useCart } from '../CartContext';
import { checkoutStyles } from '../assets/dummyStyles';
import axios from 'axios';
import { toast } from 'react-toastify';

const CheckoutPage = () => {
  const {
    cart,
    getCartTotal,
    clearCart,
    getVendorGroups,
    deliveryOptions,
    setDeliveryOption,
    validateDeliveryOptions,
    calculateVendorDeliveryCharge,
    getTotalWithDelivery,
    initializeDeliveryOptions
  } = useCart();

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    paymentMethod: 'Cash on Delivery',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Get API URL from environment variable
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  // Load user data on mount
  useEffect(() => {
    loadUserData();
  }, []);

  // Initialize delivery options when cart loads
  useEffect(() => {
    if (cart.length > 0) {
      initializeDeliveryOptions();
    }
  }, [cart.length]);

  // ✅ Load user data from localStorage
  const loadUserData = () => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      if (userData) {
        setFormData(prev => ({
          ...prev,
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || ''
        }));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleDeliveryOptionChange = (vendorId, option) => {
    setDeliveryOption(vendorId, option);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Invalid email format';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    else if (!/^\d{10}$/.test(formData.phone))
      newErrors.phone = 'Invalid phone number (must be 10 digits)';
    if (!formData.address.trim()) newErrors.address = 'Address is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      toast.error('Please fill in all required fields correctly');
      return;
    }

    // Validate cart is not empty
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    // Validate delivery options
    const deliveryValidation = validateDeliveryOptions();
    if (!deliveryValidation.valid) {
      deliveryValidation.errors.forEach(error => toast.error(error));
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('authToken');

      if (!token) {
        toast.error('Please login to place an order');
        navigate('/login');
        return;
      }

      // ============================================
      // ✅ NEW APPROACH: Send flat items array
      // Backend will automatically group by farmer
      // ============================================
      const orderPayload = {
        customer: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          notes: formData.notes.trim()
        },
        paymentMethod: formData.paymentMethod,
        // ✅ Flat items array with delivery options
        items: cart.map(item => ({
          productId: item.productId || item.product?._id || item._id,
          quantity: item.quantity,
          // Include delivery option from cart context
          deliveryOption: deliveryOptions[item.vendorId] || 'delivery-agent'
        }))
      };

      console.log('📦 Creating multi-vendor parent order...');
      console.log('   API URL:', apiUrl);
      console.log('   Payment Method:', formData.paymentMethod);
      console.log('   Items Count:', orderPayload.items.length);
      console.log('   Order Payload:', JSON.stringify(orderPayload, null, 2));

      const res = await axios.post(
        `${apiUrl}/api/parent-orders`,
        orderPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('✅ Parent Order Created:', res.data);

      if (res.data.success) {
        const { parentOrder: createdOrder } = res.data;

        // Clear cart after successful order
        await clearCart();

        // Online Payment - Redirect to Stripe
        if (formData.paymentMethod === 'Online Payment' && createdOrder.sessionUrl) {
          console.log('🔗 Redirecting to Stripe checkout...');
          toast.success('Redirecting to payment gateway...');
          setTimeout(() => {
            window.location.href = createdOrder.sessionUrl;
          }, 500);
          return;
        }

        // Cash on Delivery - Show success and redirect
        toast.success(`Order placed successfully! Order ID: ${createdOrder.parentOrderId}`, {
          autoClose: 2000
        });
        
        setTimeout(() => {
          navigate('/myorders');
        }, 1500);
      } else {
        throw new Error(res.data.message || 'Failed to create order');
      }

    } catch (err) {
      console.error('❌ Order creation error:', err);
      
      let errorMessage = 'Failed to place order. Please try again.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      // Handle specific error cases
      if (err.response?.status === 401) {
        errorMessage = 'Session expired. Please login again.';
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response?.status === 400) {
        errorMessage = err.response.data.message || 'Invalid order data';
      }

      toast.error(errorMessage, { autoClose: 4000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const vendorGroups = getVendorGroups();
  const subtotal = getCartTotal();
  const totalWithDelivery = getTotalWithDelivery();

  // Empty cart state
  if (!cart.length) {
    return (
      <div className={checkoutStyles.emptyPage}>
        <div className={checkoutStyles.emptyCard}>
          <div className={checkoutStyles.emptyIcon}>🛒</div>
          <h1 className={checkoutStyles.emptyTitle}>Your Cart is Empty</h1>
          <p className={checkoutStyles.emptyText}>
            You don't have any items to checkout.
          </p>
          <Link
            to="/items"
            className={checkoutStyles.emptyButton}
          >
            <FiArrowLeft className="mr-2" /> Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={checkoutStyles.page}>
      <div className={checkoutStyles.container}>
        <Link to="/cart" className={checkoutStyles.backLink}>
          <FiArrowLeft className="mr-2" />
          Back to Cart
        </Link>

        <div className={checkoutStyles.header}>
          <h1 className={checkoutStyles.mainTitle}>Multi-Vendor Checkout</h1>
          <p className={checkoutStyles.subtitle}>
            Complete your purchase from {vendorGroups.length} vendor{vendorGroups.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Customer Info Form */}
          <div className={checkoutStyles.card}>
            <h2 className={checkoutStyles.sectionTitle}>
              <FiUser className="mr-2 text-emerald-300" />
              Customer Information
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-emerald-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`${checkoutStyles.input} ${errors.name ? checkoutStyles.inputError : ''}`}
                  placeholder="Enter your full name"
                  required
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-400">{errors.name}</p>
                )}
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-emerald-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`${checkoutStyles.input} ${errors.email ? checkoutStyles.inputError : ''}`}
                    placeholder="you@example.com"
                    required
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-400">{errors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-emerald-300 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`${checkoutStyles.input} ${errors.phone ? checkoutStyles.inputError : ''}`}
                    placeholder="10-digit phone number"
                    pattern="[0-9]{10}"
                    required
                  />
                  {errors.phone && (
                    <p className="mt-2 text-sm text-red-400">{errors.phone}</p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-emerald-300 mb-2">
                  Delivery Address *
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                  className={`${checkoutStyles.input} ${errors.address ? checkoutStyles.inputError : ''}`}
                  placeholder="Full address including landmark"
                  required
                ></textarea>
                {errors.address && (
                  <p className="mt-2 text-sm text-red-400">{errors.address}</p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-emerald-300 mb-2">
                  Delivery Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="2"
                  className={checkoutStyles.input}
                  placeholder="Special instructions, gate code, etc."
                ></textarea>
              </div>

              {/* Payment Method */}
              <div>
                <h3 className={checkoutStyles.sectionTitle}>
                  <FiCreditCard className="mr-2 text-emerald-300" />
                  Payment Method
                </h3>
                <div className="space-y-3">
                  <label className={checkoutStyles.radioCard}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="Cash on Delivery"
                      checked={formData.paymentMethod === 'Cash on Delivery'}
                      onChange={handleChange}
                      className="h-5 w-5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="ml-3">
                      <span className="font-medium text-emerald-100">
                        Cash on Delivery
                      </span>
                      <span className="block text-sm text-emerald-400">
                        Pay when you receive your order
                      </span>
                    </div>
                  </label>
                  <label className={checkoutStyles.radioCard}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="Online Payment"
                      checked={formData.paymentMethod === 'Online Payment'}
                      onChange={handleChange}
                      className="h-5 w-5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="ml-3">
                      <span className="font-medium text-emerald-100">
                        Online Payment
                      </span>
                      <span className="block text-sm text-emerald-400">
                        Pay now securely via card/UPI
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </form>
          </div>

          {/* Order Summary - Multi-Vendor */}
          <div className={checkoutStyles.card}>
            <h2 className={checkoutStyles.sectionTitle}>
              <FiPackage className="mr-2 text-emerald-300" />
              Order Summary
            </h2>

            {/* Vendor Groups Display */}
            <div className="mb-6 space-y-6">
              {vendorGroups.map((group, index) => {
                const deliveryOption = deliveryOptions[group.vendorId] || 'delivery-agent';
                const deliveryCharge = calculateVendorDeliveryCharge(group.subtotal, deliveryOption);

                return (
                  <div key={group.vendorId} className="border border-emerald-700/30 rounded-lg p-4 bg-emerald-900/20">
                    {/* Vendor Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <FiShoppingBag className="text-emerald-400 mr-2" />
                        <span className="font-semibold text-emerald-100">
                          {group.vendorName}
                        </span>
                      </div>
                      <span className="text-xs bg-emerald-700/50 px-2 py-1 rounded text-emerald-200">
                        {group.vendorType === 'admin' ? 'Admin Store' : 'Farmer'}
                      </span>
                    </div>

                    {/* Items List */}
                    <div className="space-y-2 mb-4">
                      {group.items.map(item => (
                        <div key={item.id || item._id} className="flex justify-between text-sm">
                          <span className="text-emerald-300">
                            {item.name} × {item.quantity}
                          </span>
                          <span className="text-emerald-100">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Delivery Options */}
                    <div className="border-t border-emerald-700/30 pt-3 mt-3">
                      <label className="block text-sm font-medium text-emerald-300 mb-2">
                        <FiTruck className="inline mr-1" />
                        Delivery Option
                      </label>
                      <div className="space-y-2">
                        {/* Self-Pickup (only for farmers) */}
                        {group.vendorType === 'farmer' && (
                          <label className="flex items-center p-2 rounded border border-emerald-700/50 cursor-pointer hover:bg-emerald-800/20 transition-colors">
                            <input
                              type="radio"
                              name={`delivery-${group.vendorId}`}
                              value="self-pickup"
                              checked={deliveryOption === 'self-pickup'}
                              onChange={() => handleDeliveryOptionChange(group.vendorId, 'self-pickup')}
                              className="h-4 w-4 text-emerald-600"
                            />
                            <div className="ml-2 flex-1">
                              <span className="text-sm font-medium text-emerald-100">Self Pickup</span>
                              <span className="block text-xs text-emerald-400">Free - Collect from farmer</span>
                            </div>
                          </label>
                        )}

                        {/* Delivery Agent */}
                        <label className="flex items-center p-2 rounded border border-emerald-700/50 cursor-pointer hover:bg-emerald-800/20 transition-colors">
                          <input
                            type="radio"
                            name={`delivery-${group.vendorId}`}
                            value="delivery-agent"
                            checked={deliveryOption === 'delivery-agent'}
                            onChange={() => handleDeliveryOptionChange(group.vendorId, 'delivery-agent')}
                            disabled={group.vendorType === 'admin'}
                            className="h-4 w-4 text-emerald-600"
                          />
                          <div className="ml-2 flex-1">
                            <span className="text-sm font-medium text-emerald-100">Delivery Agent</span>
                            <span className="block text-xs text-emerald-400">
                              {deliveryCharge === 0 
                                ? 'Free delivery (order above ₹500)' 
                                : `₹${deliveryCharge} delivery charge`}
                              {group.vendorType === 'admin' && ' (Required for admin products)'}
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Vendor Subtotal */}
                    <div className="border-t border-emerald-700/30 pt-3 mt-3 flex justify-between items-center">
                      <span className="text-sm text-emerald-300">Vendor Total</span>
                      <span className="font-medium text-emerald-100">
                        ₹{(group.subtotal + deliveryCharge).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Grand Total Section */}
            <div className="border-t border-emerald-700/50 pt-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-emerald-300">Items Subtotal</span>
                <span className="font-medium text-emerald-100">
                  ₹{subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-300">Total Delivery Charges</span>
                <span className="font-medium text-emerald-100">
                  ₹{(totalWithDelivery - subtotal).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between pt-3 mt-3 border-t border-emerald-700/50">
                <span className="text-lg font-bold text-emerald-100">
                  Grand Total
                </span>
                <span className="text-lg font-bold text-emerald-300">
                  ₹{totalWithDelivery.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Place Order Button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`${checkoutStyles.button} ${isSubmitting
                ? checkoutStyles.disabledButton
                : checkoutStyles.submitButton
                } mt-6 w-full`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing Order...
                </>
              ) : (
                <>
                  <FiCheck className="mr-2" />
                  Place Order - ₹{totalWithDelivery.toFixed(2)}
                </>
              )}
            </button>

            <p className="mt-4 text-center text-sm text-emerald-400">
              By placing your order you agree to our{' '}
              <a href="/terms" className={checkoutStyles.link}>
                Terms & Conditions
              </a>{' '}
              and{' '}
              <a href="/privacy" className={checkoutStyles.link}>
                Privacy Policy
              </a>
            </p>
          </div>
        </div>

        {/* Delivery Information Footer */}
        <div className={checkoutStyles.deliveryInfo}>
          <h3 className={checkoutStyles.deliveryTitle}>
            <FiTruck className="mr-2" />
            Delivery Information
          </h3>
          <p className={checkoutStyles.deliveryText}>
            • Orders are fulfilled by individual vendors independently<br />
            • Delivery times may vary per vendor<br />
            • Self-pickup orders can be collected directly from the farmer<br />
            • Track your order status in "My Orders" section after placing the order
          </p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;