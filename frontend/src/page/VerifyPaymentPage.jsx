// frontend/src/page/VerifyPaymentPage.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../CartContext';
import { FiCheckCircle, FiDownload, FiPackage } from 'react-icons/fi';

const VerifyPaymentPage = () => {
    const { clearCart } = useCart();
    const { search } = useLocation();
    const navigate = useNavigate();
    const [statusMsg, setStatusMsg] = useState('Verifying payment...');
    const [orderConfirmed, setOrderConfirmed] = useState(false);
    const [confirmedOrder, setConfirmedOrder] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [showToastMsg, setShowToastMsg] = useState(false);
    const [isToastError, setIsToastError] = useState(false);
    const [countdown, setCountdown] = useState(8);
    // ✅ Get API URL from environment variable
    const apiUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const params = new URLSearchParams(search);
        const session_id = params.get('session_id');
        const payment_status = params.get('payment_status');
        const order_id = params.get('order_id'); // For COD orders
        const token = localStorage.getItem('authToken');

        console.log('🔍 Payment verification started');
        console.log('   API URL:', apiUrl);
        console.log('   Session ID:', session_id);
        console.log('   Order ID:', order_id);
        console.log('   Payment Status:', payment_status);

        // If user cancelled on Stripe side, send them back to checkout
        if (payment_status === 'cancel') {
            console.log('❌ Payment cancelled by user');
            navigate('/checkout', { replace: true });
            return;
        }

        // Handle COD orders (order_id is passed)
        if (order_id) {
            console.log('📦 COD Order - Fetching order details');
            axios
                .get(`${apiUrl}/api/orders/${order_id}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                })
                .then((response) => {
                    console.log('✅ COD Order confirmed:', response.data);
                    clearCart();
                    setConfirmedOrder(response.data);
                    setOrderConfirmed(true);
                    setShowSuccess(true);
                    setStatusMsg('Order placed successfully!');

                    // Auto-download invoice after 2 seconds
                    setTimeout(() => {
                        downloadInvoice(response.data._id, response.data.orderId);
                    }, 2000);

                    // Navigate to Order Success Page after 3 seconds
                    setTimeout(() => {
                        navigate(`/order-success/${response.data._id}`, { replace: true });
                    }, 3000);
                })
                .catch(err => {
                    console.error('❌ Order fetch error:', err);
                    setStatusMsg('There was an error fetching your order.');
                });
            return;
        }

        // Handle Online Payment orders (session_id is passed)
        if (!session_id) {
            console.log('❌ No session ID or order ID found');
            setStatusMsg('No order information provided.');
            return;
        }

        console.log('💳 Online Payment - Verifying with Stripe');
        axios
            .get(`${apiUrl}/api/orders/verify`, {
                params: { session_id },
                headers: token
                    ? { Authorization: `Bearer ${token}` }
                    : {}
            })
            .then((response) => {
                console.log('✅ Online payment confirmed:', response.data);
                clearCart();
                setConfirmedOrder(response.data);
                setOrderConfirmed(true);
                setShowSuccess(true);
                setStatusMsg('Order confirmed!');

                // Auto-download invoice after 2 seconds
                setTimeout(() => {
                    downloadInvoice(response.data._id, response.data.orderId);
                }, 2000);

                // Navigate to Order Success Page after 3 seconds
                setTimeout(() => {
                    navigate(`/order-success/${response.data._id}`, { replace: true });
                }, 3000);
            })
            .catch(err => {
                console.error('❌ Confirmation error:', err);
                setStatusMsg('There was an error confirming your payment.');
            });
    }, [search, clearCart, navigate, apiUrl]);

    // Countdown timer and auto-redirect (keeping the old logic as fallback)
    useEffect(() => {
        if (orderConfirmed && countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);

            return () => clearTimeout(timer);
        } else if (orderConfirmed && countdown === 0) {
            // Redirect to order success page as fallback
            if (confirmedOrder?._id) {
                navigate(`/order-success/${confirmedOrder._id}`, { replace: true });
            } else {
                navigate('/', { replace: true });
            }
        }
    }, [orderConfirmed, countdown, navigate, confirmedOrder]);

    // Function to download invoice
    const downloadInvoice = async (orderId, orderNumber) => {
        try {
            console.log('📄 Downloading invoice for order:', orderId);
            const token = localStorage.getItem('authToken');

            const response = await axios({
                url: `${apiUrl}/api/orders/${orderId}/invoice`,
                method: 'GET',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                responseType: 'blob',
                timeout: 10000
            });

            console.log('✅ Invoice data received, size:', response.data.size);

            // Create blob with explicit PDF type
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);

            // Create download link
            const link = document.createElement('a');
            link.style.display = 'none';
            link.href = url;
            link.download = `Invoice_${orderNumber}.pdf`;
            link.setAttribute('download', `Invoice_${orderNumber}.pdf`);

            document.body.appendChild(link);
            link.click();

            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);

            showToast('✅ Invoice downloaded successfully!', false);
            console.log('✅ Invoice downloaded successfully');
        } catch (error) {
            console.error('❌ Invoice download error:', error);
            //showToast('⚠️ Invoice download failed. You can access it from My Orders page.', true);
        }
    };

    const handleDownloadInvoice = async () => {
        await downloadInvoice(confirmedOrder._id, confirmedOrder.orderId);
    };

    const handleViewMyOrders = () => {
        navigate('/myorders', { replace: true });
    };

    const handleContinueShopping = () => {
        navigate('/', { replace: true });
    };

    const showToast = (message, isError = false) => {
        setToastMessage(message);
        setIsToastError(isError);
        setShowToastMsg(true);

        setTimeout(() => {
            setShowToastMsg(false);
        }, 3500);
    };

    if (!orderConfirmed) {
        return (
            <div className="min-h-screen fb-bg flex items-center justify-center p-4">
                <div className="fb-card backdrop-blur-lg border fb-border rounded-2xl p-8 text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 fb-border-primary border-t-transparent mx-auto mb-4"></div>
                    <p className="fb-text text-lg font-medium">{statusMsg}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen fb-bg flex items-center justify-center p-4">
            <style>{`
                @keyframes rotateCheck {
                    0% { transform: rotate(0deg) scale(0); opacity: 0; }
                    50% { transform: rotate(180deg) scale(1.1); }
                    100% { transform: rotate(360deg) scale(1); opacity: 1; }
                }
                @keyframes slideInRight {
                    from { 
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to { 
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOutRight {
                    from { 
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to { 
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
                @keyframes fadeInUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .success-check {
                    animation: rotateCheck 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .fade-in-up {
                    animation: fadeInUp 0.5s ease-out forwards;
                }
                .toast-show {
                    animation: slideInRight 0.4s ease-out forwards;
                }
                .toast-hide {
                    animation: slideOutRight 0.4s ease-out forwards;
                }
            `}</style>

            {/* Toast Notification */}
            {showToastMsg && (
                <div
                    className={`fixed top-5 right-5 z-[9999] ${showToastMsg ? 'toast-show' : 'toast-hide'}`}
                    style={{
                        padding: '16px 24px',
                        background: isToastError ? '#ef4444' : 'var(--color-primary)',
                        color: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                        fontWeight: '600',
                        fontSize: '15px',
                        minWidth: '280px',
                        maxWidth: '400px',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    {toastMessage}
                </div>
            )}

            <div className="w-full max-w-md">
                {/* Success Card */}
                <div className="fb-card backdrop-blur-lg border-2 fb-border-primary rounded-3xl p-8 shadow-2xl fade-in-up">
                    {/* Success Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="relative w-32 h-32">
                            <img
                                src="/assets/orderplaced.gif"
                                alt="Order Placed Successfully"
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                            <div className="hidden absolute inset-0 items-center justify-center">
                                <div className="absolute inset-0 fb-primary-subtle rounded-full opacity-20 blur-xl"></div>
                                <FiCheckCircle
                                    className={`fb-text-primary relative z-10 ${showSuccess ? 'success-check' : ''}`}
                                    size={80}
                                    strokeWidth={2}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Success Message */}
                    <div className="text-center mb-6">
                        <h1 className="text-3xl font-bold fb-text mb-2">
                            Order Placed Successfully! 🎉
                        </h1>
                        <p className="fb-text-secondary text-lg">
                            Thank you for your purchase
                        </p>
                    </div>

                    {/* Order Details Card */}
                    <div className="fb-surface-alt border fb-border rounded-xl p-5 mb-6">
                        <div className="flex justify-between items-center mb-3">
                            <span className="fb-text-secondary font-medium">Order ID:</span>
                            <span className="fb-text font-bold">{confirmedOrder?.orderId}</span>
                        </div>
                        <div className="flex justify-between items-center mb-3">
                            <span className="fb-text-secondary font-medium">Total Amount:</span>
                            <span className="fb-text-primary font-bold text-xl">
                                ₹{confirmedOrder?.total?.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center mb-3">
                            <span className="fb-text-secondary font-medium">Payment Method:</span>
                            <span className="fb-text font-medium">
                                {confirmedOrder?.paymentMethod}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="fb-text-secondary font-medium">Payment:</span>
                            <span className="px-3 py-1 fb-primary-subtle fb-text-primary rounded-full text-sm font-medium border fb-border-primary">
                                {confirmedOrder?.paymentStatus}
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3 mb-6">
                        {/* Download Invoice */}
                        <button
                            onClick={handleDownloadInvoice}
                            className="w-full fb-btn-primary font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl flex items-center justify-center gap-3"
                        >
                            <FiDownload size={20} />
                            Download Invoice (PDF)
                        </button>

                        {/* View My Orders */}
                        <button
                            onClick={handleViewMyOrders}
                            className="w-full fb-bg-surface-alt hover:opacity-80 fb-text font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-3 border fb-border"
                        >
                            <FiPackage size={20} />
                            View My Orders
                        </button>

                        {/* Continue Shopping */}
                        <button
                            onClick={handleContinueShopping}
                            className="w-full fb-bg-surface-alt hover:opacity-80 fb-text-secondary font-semibold py-4 px-6 rounded-xl transition-all duration-300 border fb-border"
                        >
                            Continue Shopping
                        </button>
                    </div>

                    {/* Auto Download Notice */}
                    <p className="text-center fb-text-muted text-sm mb-2">
                        💾 Invoice downloaded automatically
                    </p>

                    {/* Countdown Timer */}
                    <div className="text-center">
                        <p className="fb-text-primary text-sm">
                            Redirecting to order details in {countdown} second{countdown !== 1 ? 's' : ''}...
                        </p>
                        <div className="mt-2 w-full fb-surface-alt rounded-full h-1.5">
                            <div
                                className="fb-bg-primary h-1.5 rounded-full transition-all duration-1000"
                                style={{ width: `${((8 - countdown) / 8) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyPaymentPage;