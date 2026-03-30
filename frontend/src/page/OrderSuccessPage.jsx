// frontend/src/page/OrderSuccessPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiDownload, FiHome } from 'react-icons/fi';
import jsPDF from 'jspdf';
import axios from 'axios';

const OrderSuccessPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(10);
    const [orderDetails, setOrderDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const apiUrl = import.meta.env.VITE_API_URL;

    // Fetch order details
    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                
                // 1. Try fetching as a parent order first
                try {
                    const response = await axios.get(`${apiUrl}/api/parent-orders/${orderId}`, { headers });
                    if (response.data.success && response.data.parentOrder) {
                        const po = response.data.parentOrder;
                        const flatItems = po.subOrders ? po.subOrders.flatMap(so => so.items || []) : [];
                        
                        setOrderDetails({
                            orderId: po.parentOrderId || orderId,
                            createdAt: po.createdAt || new Date().toISOString(),
                            status: (po.paymentStatus === 'Paid' ? 'Paid' : po.overallStatus) || 'SUCCESSFUL',
                            paymentMethod: po.paymentMethod || 'Unknown',
                            total: po.totalAmount || 0,
                            items: flatItems,
                            customer: po.customer || {}
                        });
                        setLoading(false);
                        return;
                    }
                } catch (parentErr) {
                    console.log('Not a parent order, falling back to legacy orders...', parentErr?.response?.data || parentErr.message);
                }

                // 2. Fallback to legacy orders
                const response = await axios.get(`${apiUrl}/api/orders/${orderId}`, { headers });
                setOrderDetails(response.data);
            } catch (error) {
                console.error('Error fetching order details:', error);
            } finally {
                setLoading(false);
            }
        };

        if (orderId) {
            fetchOrderDetails();
        }
    }, [orderId, apiUrl]);

    // Countdown timer
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else {
            navigate('/', { replace: true });
        }
    }, [countdown, navigate]);

    // Generate PDF Receipt
    const downloadReceipt = () => {
        const doc = new jsPDF();

        // Header
        doc.setFillColor(16, 185, 129); // Emerald color
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(28);
        doc.setFont(undefined, 'bold');
        doc.text('ORDER RECEIPT', 105, 25, { align: 'center' });

        // Reset text color
        doc.setTextColor(0, 0, 0);

        // Order Success Icon (using text)
        doc.setFontSize(40);
        doc.text('✓', 95, 70);

        // Order Success Message
        doc.setFontSize(22);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(16, 185, 129);
        doc.text('Order Successful!', 105, 90, { align: 'center' });

        // Order Details
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');

        let yPos = 110;

        // Order ID
        doc.setFont(undefined, 'bold');
        doc.text('Order ID:', 20, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(orderDetails?.orderId || orderId, 60, yPos);

        yPos += 10;

        // Order Date
        doc.setFont(undefined, 'bold');
        doc.text('Order Date:', 20, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(
            orderDetails?.createdAt
                ? new Date(orderDetails.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
                : new Date().toLocaleDateString('en-IN'),
            60,
            yPos
        );

        yPos += 10;

        // Order Status
        doc.setFont(undefined, 'bold');
        doc.text('Status:', 20, yPos);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(16, 185, 129);
        doc.text('SUCCESSFUL', 60, yPos);
        doc.setTextColor(0, 0, 0);

        yPos += 10;

        // Payment Method
        if (orderDetails?.paymentMethod) {
            doc.setFont(undefined, 'bold');
            doc.text('Payment Method:', 20, yPos);
            doc.setFont(undefined, 'normal');
            doc.text(orderDetails.paymentMethod, 60, yPos);
            yPos += 10;
        }

        // Total Amount
        if (orderDetails?.total) {
            doc.setFont(undefined, 'bold');
            doc.text('Total Amount:', 20, yPos);
            doc.setFont(undefined, 'normal');
            doc.setFontSize(14);
            doc.text(`₹${orderDetails.total.toFixed(2)}`, 60, yPos);
            doc.setFontSize(12);
            yPos += 15;
        }

        // Items Section
        if (orderDetails?.items && orderDetails.items.length > 0) {
            doc.setFont(undefined, 'bold');
            doc.setFontSize(14);
            doc.text('Order Items:', 20, yPos);
            yPos += 10;

            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');

            orderDetails.items.forEach((item, index) => {
                const itemText = `${index + 1}. ${item.name} (Qty: ${item.quantity}) - ₹${(item.price * item.quantity).toFixed(2)}`;
                doc.text(itemText, 25, yPos);
                yPos += 7;
            });

            yPos += 5;
        }

        // Customer Details
        if (orderDetails?.customer) {
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('Delivery Address:', 20, yPos);
            yPos += 8;

            doc.setFont(undefined, 'normal');
            doc.setFontSize(10);
            doc.text(orderDetails.customer.name || 'N/A', 25, yPos);
            yPos += 6;
            doc.text(orderDetails.customer.address || 'N/A', 25, yPos);
            yPos += 6;
            doc.text(orderDetails.customer.phone || 'N/A', 25, yPos);
            yPos += 10;
        }

        // Thank you message
        yPos += 10;
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(16, 185, 129);
        doc.text('Thank you for your order!', 105, yPos, { align: 'center' });

        yPos += 8;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(107, 114, 128);
        doc.text('We hope to serve you again soon.', 105, yPos, { align: 'center' });

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text('RushBasket - Your Trusted Shopping Partner', 105, 280, { align: 'center' });
        doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, 105, 285, { align: 'center' });

        // Save PDF
        doc.save(`RushBasket_Receipt_${orderDetails?.orderId || orderId}.pdf`);
    };

    if (loading) {
        return (
            <div className="min-h-screen fb-bg flex items-center justify-center">
                <div className="fb-card backdrop-blur-lg border fb-border rounded-2xl p-8 text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 fb-border-primary border-t-transparent mx-auto mb-4"></div>
                    <p className="fb-text text-lg font-medium">Loading order details...</p>
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
                @keyframes fadeInUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .success-check {
                    animation: rotateCheck 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .fade-in-up {
                    animation: fadeInUp 0.5s ease-out forwards;
                }
                .bounce-animation {
                    animation: bounce 2s infinite;
                }
            `}</style>

            <div className="w-full max-w-md">
                <div className="fb-card backdrop-blur-lg border-2 fb-border-primary rounded-3xl p-8 shadow-2xl fade-in-up">
                    {/* Success Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="relative w-32 h-32">
                            <div className="absolute inset-0 fb-primary-subtle rounded-full opacity-20 blur-xl"></div>
                            <FiCheckCircle
                                className="fb-text-primary relative z-10 success-check w-full h-full"
                                strokeWidth={2}
                            />
                        </div>
                    </div>

                    {/* Success Message */}
                    <div className="text-center mb-6">
                        <h1 className="text-4xl font-bold fb-text mb-3">
                            Order Successful! 🎉
                        </h1>
                        <p className="fb-text-secondary text-lg mb-2">
                            Your order has been placed successfully
                        </p>
                        <p className="fb-text font-bold text-2xl">
                            Order ID: {orderDetails?.orderId || orderId}
                        </p>
                    </div>

                    {/* Order Summary */}
                    {orderDetails && (
                        <div className="fb-surface-alt border fb-border rounded-xl p-5 mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="fb-text-secondary font-medium">Total Amount:</span>
                                <span className="fb-text font-bold text-2xl">
                                    ₹{orderDetails.total?.toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="fb-text-secondary font-medium">Payment Method:</span>
                                <span className="fb-text">{orderDetails.paymentMethod}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="fb-text-secondary font-medium">Status:</span>
                                <span className="px-3 py-1 fb-primary-subtle fb-text-primary rounded-full text-sm font-medium border fb-border-primary">
                                    {orderDetails.status}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-3 mb-6">
                        {/* Download Receipt Button */}
                        <button
                            onClick={downloadReceipt}
                            className="w-full fb-btn-primary font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl flex items-center justify-center gap-3"
                        >
                            <FiDownload size={20} />
                            Download Receipt (PDF)
                        </button>

                        {/* Go to Home Button */}
                        <button
                            onClick={() => navigate('/', { replace: true })}
                            className="w-full fb-bg-surface-alt hover:opacity-80 fb-text font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-3 border fb-border"
                        >
                            <FiHome size={20} />
                            Go to Home
                        </button>

                        {/* View My Orders */}
                        <button
                            onClick={() => navigate('/myorders', { replace: true })}
                            className="w-full fb-bg-surface-alt hover:opacity-80 fb-text-secondary font-semibold py-4 px-6 rounded-xl transition-all duration-300 border fb-border"
                        >
                            View My Orders
                        </button>
                    </div>

                    {/* Countdown Timer */}
                    <div className="text-center">
                        <p className="fb-text-primary text-sm mb-3 bounce-animation">
                            Redirecting to home in {countdown} second{countdown !== 1 ? 's' : ''}...
                        </p>
                        <div className="w-full fb-surface-alt rounded-full h-2">
                            <div
                                className="fb-bg-primary h-2 rounded-full transition-all duration-1000 ease-linear"
                                style={{ width: `${((10 - countdown) / 10) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccessPage;