// ============================================
// FILE: frontend/src/page/MyOrdersPage.jsx
// Example showing how to integrate invoice download
// ============================================
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiDownload, FiPackage, FiClock, FiCheckCircle, FiMapPin } from 'react-icons/fi';
import InvoiceDownload from '../components/InvoiceDownload';
import UserOrderTracking from '../components/UserOrderTracking';

const MyOrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', isError: false });
    const [trackingModal, setTrackingModal] = useState({ isOpen: false, order: null });

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(`${apiUrl}/api/orders`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            setOrders(response.data);
        } catch (error) {
            console.error('Error fetching orders:', error);
            showToast('Failed to load orders', true);
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message, isError = false) => {
        setToast({ show: true, message, isError });
        setTimeout(() => {
            setToast({ show: false, message: '', isError: false });
        }, 3000);
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Delivered':
                return <FiCheckCircle className="text-emerald-500" />;
            case 'Shipped':
                return <FiPackage className="text-blue-500" />;
            default:
                return <FiClock className="text-yellow-500" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Delivered':
                return 'bg-emerald-100 text-emerald-800 border-emerald-300';
            case 'Shipped':
                return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'Processing':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'Cancelled':
                return 'bg-red-100 text-red-800 border-red-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your orders...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            {/* Toast Notification */}
            {toast.show && (
                <div 
                    className="fixed top-5 right-5 z-50 px-6 py-4 rounded-lg shadow-lg animate-slideIn"
                    style={{
                        background: toast.isError ? '#ef4444' : '#10b981',
                        color: 'white'
                    }}
                >
                    {toast.message}
                </div>
            )}

            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">My Orders</h1>

                {orders.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <FiPackage className="mx-auto text-gray-400 mb-4" size={64} />
                        <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                            No Orders Yet
                        </h2>
                        <p className="text-gray-500">
                            Start shopping to see your orders here!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <div 
                                key={order._id} 
                                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                            >
                                {/* Order Header */}
                                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 text-white">
                                    <div className="flex justify-between items-center flex-wrap gap-4">
                                        <div>
                                            <p className="text-sm opacity-90">Order ID</p>
                                            <p className="text-lg font-bold">{order.orderId}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm opacity-90">Order Date</p>
                                            <p className="font-semibold">
                                                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm opacity-90">Total Amount</p>
                                            <p className="text-xl font-bold">₹{order.total?.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Body */}
                                <div className="p-6">
                                    {/* Status & Payment Info */}
                                    <div className="flex gap-4 mb-4 flex-wrap">
                                        <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full border font-medium ${getStatusColor(order.status)}`}>
                                            {getStatusIcon(order.status)}
                                            {order.status}
                                        </span>
                                        <span className="px-3 py-1.5 rounded-full border bg-gray-100 text-gray-800 border-gray-300 font-medium">
                                            {order.paymentMethod}
                                        </span>
                                        <span className={`px-3 py-1.5 rounded-full border font-medium ${
                                            order.paymentStatus === 'Paid' 
                                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                                : 'bg-orange-100 text-orange-800 border-orange-300'
                                        }`}>
                                            {order.paymentStatus}
                                        </span>
                                    </div>

                                    {/* Order Items */}
                                    <div className="space-y-3 mb-4">
                                        <h3 className="font-semibold text-gray-700">Items:</h3>
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    {item.imageUrl && (
                                                        <img 
                                                            src={item.imageUrl} 
                                                            alt={item.name}
                                                            className="w-12 h-12 object-cover rounded"
                                                        />
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-gray-800">{item.name}</p>
                                                        <p className="text-sm text-gray-500">
                                                            Qty: {item.quantity} × ₹{item.price}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="font-semibold text-gray-800">
                                                    ₹{(item.quantity * item.price).toFixed(2)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Customer Details */}
                                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                        <h3 className="font-semibold text-gray-700 mb-2">Delivery Address:</h3>
                                        <p className="text-gray-600">
                                            {order.customer.name}<br />
                                            {order.customer.address}<br />
                                            {order.customer.phone}
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 flex-wrap">
                                        {/* Track Order Button - Show for active orders */}
                                        {(order.status === 'Processing' || order.status === 'Shipped') && (
                                            <button
                                                onClick={() => setTrackingModal({ isOpen: true, order })}
                                                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                                            >
                                                <FiMapPin size={18} />
                                                Track Order
                                            </button>
                                        )}

                                        {/* ✅ USING REUSABLE INVOICE DOWNLOAD COMPONENT */}
                                        <InvoiceDownload
                                            orderId={order._id}
                                            orderNumber={order.orderId}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium"
                                            onSuccess={() => showToast('✅ Invoice downloaded successfully!')}
                                            onError={(error) => showToast(error, true)}
                                        />

                                        {/* OR USING INLINE DOWNLOAD FUNCTION */}
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const token = localStorage.getItem('authToken');
                                                    const response = await axios({
                                                        url: `${apiUrl}/api/orders/${order._id}/invoice`,
                                                        method: 'GET',
                                                        headers: token ? { Authorization: `Bearer ${token}` } : {},
                                                        responseType: 'blob'
                                                    });

                                                    const blob = new Blob([response.data], { type: 'application/pdf' });
                                                    const url = window.URL.createObjectURL(blob);
                                                    const link = document.createElement('a');
                                                    link.href = url;
                                                    link.download = `Invoice_${order.orderId}.pdf`;
                                                    link.click();
                                                    window.URL.revokeObjectURL(url);

                                                    showToast('✅ Invoice downloaded!');
                                                } catch (error) {
                                                    console.error('Download error:', error);
                                                    showToast('Failed to download invoice', true);
                                                }
                                            }}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors font-medium"
                                        >
                                            <FiDownload size={18} />
                                            Download Invoice
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Order Tracking Modal */}
                <UserOrderTracking
                    isOpen={trackingModal.isOpen}
                    onClose={() => setTrackingModal({ isOpen: false, order: null })}
                    order={trackingModal.order}
                />
            </div>
        </div>
    );
};

export default MyOrdersPage;