// frontend/src/page/MyOrdersPage.jsx
// UPDATED: Multi-vendor order support with parent + sub-orders

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiDownload, FiPackage, FiClock, FiCheckCircle, FiMapPin, FiChevronDown, FiChevronUp, FiShoppingBag, FiTruck, FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';

const MyOrdersPage = () => {
    const [parentOrders, setParentOrders] = useState([]);
    const [legacyOrders, setLegacyOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrders, setExpandedOrders] = useState({});

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            // Fetch parent orders (new multi-vendor system)
            const parentResponse = await axios.get(`${apiUrl}/api/parent-orders/my-orders`, { headers });
            setParentOrders(parentResponse.data.parentOrders || []);

            // Fetch legacy orders (old system)
            const legacyResponse = await axios.get(`${apiUrl}/api/orders`, { headers });
            const legacy = legacyResponse.data.filter(order => order.isLegacy !== false);
            setLegacyOrders(legacy || []);

        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const toggleOrderExpansion = (orderId) => {
        setExpandedOrders(prev => ({
            ...prev,
            [orderId]: !prev[orderId]
        }));
    };

    const getParentStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'bg-emerald-100 text-emerald-800 border-emerald-300';
            case 'processing':
            case 'partially-delivered':
                return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'cancelled':
                return 'bg-red-100 text-red-800 border-red-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getSubOrderStatusColor = (status) => {
        switch (status) {
            case 'delivered':
                return 'bg-emerald-100 text-emerald-800';
            case 'out-for-delivery':
                return 'bg-blue-100 text-blue-800';
            case 'ready':
            case 'preparing':
                return 'bg-yellow-100 text-yellow-800';
            case 'confirmed':
                return 'bg-cyan-100 text-cyan-800';
            case 'pending':
                return 'bg-gray-100 text-gray-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatStatus = (status) => {
        return status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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

    const totalOrders = parentOrders.length + legacyOrders.length;

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">My Orders</h1>
                    <p className="text-gray-600 mt-2">{totalOrders} order{totalOrders !== 1 ? 's' : ''} found</p>
                </div>

                {totalOrders === 0 ? (
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
                        {/* Parent Orders (Multi-Vendor) */}
                        {parentOrders.map((parentOrder) => {
                            const isExpanded = expandedOrders[parentOrder._id];

                            return (
                                <div
                                    key={parentOrder._id}
                                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                                >
                                    {/* Parent Order Header */}
                                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 text-white">
                                        <div className="flex justify-between items-center flex-wrap gap-4">
                                            <div>
                                                <p className="text-sm opacity-90">Order ID</p>
                                                <p className="text-lg font-bold">{parentOrder.parentOrderId}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm opacity-90">Order Date</p>
                                                <p className="font-semibold">
                                                    {new Date(parentOrder.date).toLocaleDateString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm opacity-90">Total Amount</p>
                                                <p className="text-xl font-bold">₹{parentOrder.totalAmount?.toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm opacity-90">Vendors</p>
                                                <p className="font-semibold">{parentOrder.subOrders?.length || 0} vendor{parentOrder.subOrders?.length !== 1 ? 's' : ''}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Parent Order Body */}
                                    <div className="p-6">
                                        {/* Status & Payment Info */}
                                        <div className="flex gap-4 mb-4 flex-wrap">
                                            <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full border font-medium ${getParentStatusColor(parentOrder.overallStatus)}`}>
                                                <FiCheckCircle />
                                                {formatStatus(parentOrder.overallStatus)}
                                            </span>
                                            <span className="px-3 py-1.5 rounded-full border bg-gray-100 text-gray-800 border-gray-300 font-medium">
                                                {parentOrder.paymentMethod}
                                            </span>
                                            <span className={`px-3 py-1.5 rounded-full border font-medium ${parentOrder.paymentStatus === 'Paid'
                                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                                    : 'bg-orange-100 text-orange-800 border-orange-300'
                                                }`}>
                                                {parentOrder.paymentStatus}
                                            </span>
                                        </div>

                                        {/* Customer Details */}
                                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                            <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                <FiUser size={18} />
                                                Delivery Address:
                                            </h3>
                                            <p className="text-gray-600">
                                                {parentOrder.customer.name}<br />
                                                {parentOrder.customer.address}<br />
                                                {parentOrder.customer.phone}
                                            </p>
                                        </div>

                                        {/* Toggle Sub-Orders Button */}
                                        <button
                                            onClick={() => toggleOrderExpansion(parentOrder._id)}
                                            className="w-full flex items-center justify-between px-4 py-3 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors mb-4"
                                        >
                                            <span className="font-semibold text-emerald-800 flex items-center gap-2">
                                                <FiShoppingBag />
                                                View {parentOrder.subOrders?.length} Sub-Order{parentOrder.subOrders?.length !== 1 ? 's' : ''}
                                            </span>
                                            {isExpanded ? <FiChevronUp className="text-emerald-800" /> : <FiChevronDown className="text-emerald-800" />}
                                        </button>

                                        {/* Sub-Orders (Expandable) */}
                                        {isExpanded && (
                                            <div className="space-y-4 mb-4">
                                                {parentOrder.subOrders?.map((subOrder, index) => (
                                                    <div key={subOrder._id} className="border border-emerald-200 rounded-lg p-4 bg-emerald-50/30">
                                                        {/* Sub-Order Header */}
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div>
                                                                <p className="text-sm text-gray-600">Sub-Order {String.fromCharCode(65 + index)}</p>
                                                                <p className="font-semibold text-gray-800">{subOrder.vendor?.vendorName || 'Unknown Vendor'}</p>
                                                                <span className="text-xs bg-emerald-700/20 px-2 py-0.5 rounded text-emerald-800 mt-1 inline-block">
                                                                    {subOrder.vendor?.vendorType === 'admin' ? 'Admin Store' : 'Farmer'}
                                                                </span>
                                                            </div>
                                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSubOrderStatusColor(subOrder.status)}`}>
                                                                {formatStatus(subOrder.status)}
                                                            </span>
                                                        </div>

                                                        {/* Sub-Order Items */}
                                                        <div className="space-y-2 mb-3">
                                                            {subOrder.items?.map((item, idx) => (
                                                                <div key={idx} className="flex justify-between items-center text-sm">
                                                                    <span className="text-gray-700">
                                                                        {item.name} × {item.quantity}
                                                                    </span>
                                                                    <span className="font-medium text-gray-800">
                                                                        ₹{(item.price * item.quantity).toFixed(2)}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Delivery Option */}
                                                        <div className="flex items-center justify-between pt-3 border-t border-emerald-200">
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <FiTruck />
                                                                <span>
                                                                    {subOrder.deliveryOption === 'self-pickup' ? 'Self Pickup' : 'Delivery Agent'}
                                                                </span>
                                                            </div>
                                                            <span className="font-semibold text-gray-800">
                                                                ₹{subOrder.total?.toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Legacy Orders */}
                        {legacyOrders.map((order) => (
                            <div
                                key={order._id}
                                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow opacity-90"
                            >
                                {/* Legacy Order Header */}
                                <div className="bg-gradient-to-r from-gray-600 to-gray-700 px-6 py-4 text-white">
                                    <div className="flex justify-between items-center flex-wrap gap-4">
                                        <div>
                                            <p className="text-sm opacity-90">Order ID (Legacy)</p>
                                            <p className="text-lg font-bold">{order.orderId}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm opacity-90">Order Date</p>
                                            <p className="font-semibold">
                                                {new Date(order.createdAt || order.date).toLocaleDateString('en-IN', {
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

                                {/* Legacy Order Body */}
                                <div className="p-6">
                                    <div className="flex gap-4 mb-4 flex-wrap">
                                        <span className="px-3 py-1.5 rounded-full border bg-gray-100 text-gray-800 border-gray-300 font-medium">
                                            {order.status}
                                        </span>
                                        <span className="px-3 py-1.5 rounded-full border bg-gray-100 text-gray-800 border-gray-300 font-medium">
                                            {order.paymentMethod}
                                        </span>
                                    </div>

                                    {/* Order Items */}
                                    <div className="space-y-3 mb-4">
                                        <h3 className="font-semibold text-gray-700">Items:</h3>
                                        {order.items?.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-gray-800">{item.name}</p>
                                                    <p className="text-sm text-gray-500">
                                                        Qty: {item.quantity} × ₹{item.price}
                                                    </p>
                                                </div>
                                                <p className="font-semibold text-gray-800">
                                                    ₹{(item.quantity * item.price).toFixed(2)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Customer Details */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="font-semibold text-gray-700 mb-2">Delivery Address:</h3>
                                        <p className="text-gray-600">
                                            {order.customer?.name}<br />
                                            {order.customer?.address}<br />
                                            {order.customer?.phone}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyOrdersPage;