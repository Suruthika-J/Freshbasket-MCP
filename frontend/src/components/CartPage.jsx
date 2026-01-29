import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiTrash2, FiPlus, FiMinus, FiTag, FiX } from 'react-icons/fi';
import { useCart } from '../CartContext';
import { cartStyles } from '../assets/dummyStyles';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CartPage = () => {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
  } = useCart();

  // Coupon state management
  const [showCouponField, setShowCouponField] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);

  // Valid coupons configuration
  const validCoupons = {
    'BASKET2025': { discount: 10, type: 'percentage' }
  };

  const getItemPrice = item => item.price ?? item.product?.price ?? 0;
  const getItemName  = item => item.name  ?? item.product?.name  ?? 'Unnamed item';
  const getItemImage = item => {
    const path = item.image ?? item.product?.imageUrl ?? '';
    return path ? `http://localhost:4000${path}` : '';
  };

  const subtotal = cart.reduce((sum, item) => {
    return sum + getItemPrice(item) * item.quantity;
  }, 0);

  const discountAmount = (subtotal * discount) / 100;
  const subtotalAfterDiscount = subtotal - discountAmount;
  const shipping = subtotalAfterDiscount > 1000 ? 0 : 50;
  const tax = subtotalAfterDiscount * 0.05;
  const total = subtotalAfterDiscount + shipping + tax;

  const handleQuantityChange = async (id, delta) => {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty > 0) {
      await updateQuantity(id, newQty);
    } else {
      await removeFromCart(id);
    }
  };

  const handleApplyCoupon = () => {
    const trimmedCode = couponCode.trim().toUpperCase();
    
    if (!trimmedCode) {
      toast.error('Please enter a coupon code', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    if (validCoupons[trimmedCode]) {
      const couponData = validCoupons[trimmedCode];
      setDiscount(couponData.discount);
      setAppliedCoupon(trimmedCode);
      toast.success(`Coupon "${trimmedCode}" applied successfully! You saved ${couponData.discount}%`, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } else {
      toast.error('Invalid coupon code. Please try again.', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponCode('');
    setShowCouponField(false);
    toast.info('Coupon removed successfully', {
      position: 'top-right',
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  // Inline styles for coupon section
  const couponStyles = {
    applyCouponButton: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '10px 16px',
      background: 'linear-gradient(to right, #d1fae5, #ccfbf1)',
      color: '#047857',
      fontWeight: '500',
      borderRadius: '8px',
      border: '1px solid #6ee7b7',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    inputContainer: {
      display: 'flex',
      gap: '8px',
      marginBottom: '8px',
    },
    couponInput: {
      flex: 1,
      padding: '10px 16px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none',
      backgroundColor: '#064e3b', // Dark background for white text/placeholder
      color: 'white',              // Color for the typed text
    },
    applyButton: {
      padding: '10px 20px',
      backgroundColor: '#059669',
      color: 'white',
      fontWeight: '500',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
    cancelButton: {
      fontSize: '12px',
      color: '#6b7280',
      textDecoration: 'underline',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: 0,
    },
    appliedCouponBox: {
      background: 'linear-gradient(to right, #ecfdf5, #d1fae5)',
      border: '1px solid #6ee7b7',
      borderRadius: '8px',
      padding: '12px',
    },
    appliedCouponContent: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    appliedCouponLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    appliedCouponTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#065f46',
      margin: 0,
    },
    appliedCouponCode: {
      fontSize: '12px',
      color: '#059669',
      margin: 0,
    },
    removeButton: {
      color: '#ef4444',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '4px',
      display: 'flex',
      alignItems: 'center',
    },
    discountRow: {
      color: '#059669',
      fontWeight: '500',
    },
    savingsText: {
      fontSize: '12px',
      textAlign: 'center',
      color: '#059669',
      fontWeight: '500',
      marginTop: '8px',
    }
  };

  if (cart.length === 0) {
    return (
      <div className={cartStyles.pageContainer}>
        <ToastContainer />
        <div className={cartStyles.maxContainer}>
          <Link to="/items" className={cartStyles.continueShopping}>
            <FiArrowLeft className="mr-2" /> Continue Shopping
          </Link>
          <div className={cartStyles.emptyCartContainer}>
            <div className={cartStyles.emptyCartIcon}>🛒</div>
            <h1 className={cartStyles.emptyCartHeading}>Your Cart is Empty</h1>
            <p className={cartStyles.emptyCartText}>
              Looks like you haven't added anything yet.
            </p>
            <Link to="/items" className={cartStyles.emptyCartButton}>
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cartStyles.pageContainer}>
      {/* --- CHANGE: Added style tag to target the placeholder --- */}
      <style>
        {`
          .coupon-input-field::placeholder {
            color: white;
            opacity: 0.7; /* Optional: Makes placeholder slightly transparent */
          }
          .coupon-input-field::-webkit-input-placeholder { /* For Edge, Chrome, Safari */
            color: white;
            opacity: 0.7;
          }
          .coupon-input-field:-ms-input-placeholder { /* For Internet Explorer 10-11 */
            color: white;
            opacity: 0.7;
          }
        `}
      </style>
      <ToastContainer />
      <div className={cartStyles.maxContainerLarge}>
        <div className={cartStyles.headerContainer}>
          <h1 className={cartStyles.headerTitle}>Your Shopping Cart</h1>
          <button onClick={clearCart} className={cartStyles.clearCartButton}>
            <FiTrash2 className="mr-1" /> Clear Cart
          </button>
        </div>

        <div className={cartStyles.cartGrid}>
          <div className={cartStyles.cartItemsSection}>
            <div className={cartStyles.cartItemsGrid}>
              {cart.map(item => {
                const id    = item.id;
                const name  = getItemName(item);
                const price = getItemPrice(item);
                const img   = getItemImage(item);

                return (
                  <div key={id} className={cartStyles.cartItemCard}>
                    <div className={cartStyles.cartItemImageContainer}>
                      {img ? (
                        <img
                          src={img}
                          alt={name}
                          className={cartStyles.cartItemImage}
                          onError={e => {
                            e.target.onerror = null;
                            e.target.src = '/no-image.png';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600 rounded">
                          No Image
                        </div>
                      )}
                    </div>

                    <h3 className={cartStyles.cartItemName}>{name}</h3>
                    <p className={cartStyles.cartItemPrice}>
                      ₹{price.toFixed(2)}
                    </p>

                    <div className={cartStyles.cartItemQuantityContainer}>
                      <button
                        onClick={() => handleQuantityChange(id, -1)}
                        className={cartStyles.cartItemQuantityButton}
                      >
                        <FiMinus />
                      </button>
                      <span className={cartStyles.cartItemQuantity}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(id, 1)}
                        className={cartStyles.cartItemQuantityButton}
                      >
                        <FiPlus />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(id)}
                      className={cartStyles.cartItemRemoveButton}
                    >
                      <FiTrash2 className="mr-1" /> Remove
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className={cartStyles.orderSummaryCard}>
              <h2 className={cartStyles.orderSummaryTitle}>Order Summary</h2>

              <div className="space-y-4 text-sm sm:text-base">
                <div className={cartStyles.orderSummaryRow}>
                  <span className={cartStyles.orderSummaryLabel}>Subtotal</span>
                  <span className={cartStyles.orderSummaryValue}>
                    ₹{subtotal.toFixed(2)}
                  </span>
                </div>

                {/* Coupon Section */}
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
                  {!appliedCoupon && !showCouponField && (
                    <button
                      onClick={() => setShowCouponField(true)}
                      style={couponStyles.applyCouponButton}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'linear-gradient(to right, #a7f3d0, #99f6e4)';
                        e.target.style.borderColor = '#34d399';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'linear-gradient(to right, #d1fae5, #ccfbf1)';
                        e.target.style.borderColor = '#6ee7b7';
                      }}
                    >
                      <FiTag style={{ fontSize: '18px' }} />
                      Apply Coupon
                    </button>
                  )}

                  {showCouponField && !appliedCoupon && (
                    <div>
                      <div style={couponStyles.inputContainer}>
                        <input
                          type="text"
                          // --- CHANGE: Added className for CSS targeting ---
                          className="coupon-input-field"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="Enter coupon code"
                          style={couponStyles.couponInput}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleApplyCoupon();
                            }
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#059669';
                            e.target.style.boxShadow = '0 0 0 3px rgba(5, 150, 105, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#d1d5db';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                        <button
                          onClick={handleApplyCoupon}
                          style={couponStyles.applyButton}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#047857'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#059669'}
                        >
                          Apply
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          setShowCouponField(false);
                          setCouponCode('');
                        }}
                        style={couponStyles.cancelButton}
                        onMouseEnter={(e) => e.target.style.color = '#374151'}
                        onMouseLeave={(e) => e.target.style.color = '#6b7280'}
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {appliedCoupon && (
                    <div style={couponStyles.appliedCouponBox}>
                      <div style={couponStyles.appliedCouponContent}>
                        <div style={couponStyles.appliedCouponLeft}>
                          <FiTag style={{ color: '#059669' }} />
                          <div>
                            <p style={couponStyles.appliedCouponTitle}>
                              Coupon applied successfully!
                            </p>
                            <p style={couponStyles.appliedCouponCode}>
                              Code: {appliedCoupon} ({discount}% off)
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleRemoveCoupon}
                          style={couponStyles.removeButton}
                          title="Remove coupon"
                          onMouseEnter={(e) => e.target.style.color = '#dc2626'}
                          onMouseLeave={(e) => e.target.style.color = '#ef4444'}
                        >
                          <FiX style={{ fontSize: '18px' }} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Discount Row */}
                {appliedCoupon && (
                  <div className={cartStyles.orderSummaryRow}>
                    <span style={couponStyles.discountRow}>
                      Discount ({discount}%)
                    </span>
                    <span style={{ ...couponStyles.discountRow, fontWeight: '600' }}>
                      -₹{discountAmount.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className={cartStyles.orderSummaryRow}>
                  <span className={cartStyles.orderSummaryLabel}>Shipping charge</span>
                  <span className={cartStyles.orderSummaryValue}>
                    {shipping === 0 ? (
                      <span className="text-green-500 font-semibold">Free</span>
                    ) : (
                      `₹${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>

                {subtotalAfterDiscount <= 1000 && (
                  <p className="text-xs text-gray-600 -mt-2">
                    Add ₹{(1001 - subtotalAfterDiscount).toFixed(2)} more for free delivery
                  </p>
                )}

                <div className={cartStyles.orderSummaryRow}>
                  <span className={cartStyles.orderSummaryLabel}>Taxes (5%)</span>
                  <span className={cartStyles.orderSummaryValue}>
                    ₹{tax.toFixed(2)}
                  </span>
                </div>

                <div className={cartStyles.orderSummaryDivider}></div>

                <div className={cartStyles.orderSummaryTotalRow}>
                  <span className={cartStyles.orderSummaryTotalLabel}>Total</span>
                  <span className={cartStyles.orderSummaryTotalValue}>
                    ₹{total.toFixed(2)}
                  </span>
                </div>

                {appliedCoupon && (
                  <p style={couponStyles.savingsText}>
                    You saved ₹{discountAmount.toFixed(2)} with this coupon! 🎉
                  </p>
                )}
              </div>

              <button className={cartStyles.checkoutButton}>
                <Link to="/checkout">Proceed to Checkout</Link>
              </button>

              <div className={cartStyles.continueShoppingBottom}>
                <Link to="/items" className={cartStyles.continueShopping}>
                  <FiArrowLeft className="mr-2" /> Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;