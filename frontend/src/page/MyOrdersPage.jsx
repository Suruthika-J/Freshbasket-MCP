// frontend/src/page/MyOrdersPage.jsx
// UPDATED: Multi-vendor order support with parent + sub-orders

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiDownload, FiPackage, FiClock, FiCheckCircle, FiMapPin, FiChevronDown, FiChevronUp, FiShoppingBag, FiTruck, FiUser, FiRefreshCw, FiAlertCircle, FiCamera, FiCheck, FiX, FiStar } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import RatingModal from '../components/RatingModal';

const MyOrdersPage = () => {
    const [parentOrders, setParentOrders] = useState([]);
    const [legacyOrders, setLegacyOrders] = useState([]);
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrders, setExpandedOrders] = useState({});
    const [activeTab, setActiveTab] = useState('orders'); // orders, returns

    // Rating State
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [orderToRate, setOrderToRate] = useState(null);
    const [orderReviews, setOrderReviews] = useState({});

    // Return Modal State
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [selectedSubOrder, setSelectedSubOrder] = useState(null);
    const [returnItems, setReturnItems] = useState({}); // { productId: true/false }
    const [returnReason, setReturnReason] = useState('Damaged');
    const [returnDescription, setReturnDescription] = useState('');
    const [submittingReturn, setSubmittingReturn] = useState(false);

    // Legacy Return Modal State
    const [isLegacyReturnModalOpen, setIsLegacyReturnModalOpen] = useState(false);
    const [selectedLegacyOrder, setSelectedLegacyOrder] = useState(null);

    const apiUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchOrders();
        fetchReturns();
    }, []);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const parentResponse = await axios.get(`${apiUrl}/api/parent-orders/my-orders`, { headers });
            setParentOrders(parentResponse.data.parentOrders || []);

            const legacyResponse = await axios.get(`${apiUrl}/api/orders`, { headers });
            const legacy = legacyResponse.data.filter(order => order.isLegacy !== false);
            setLegacyOrders(legacy || []);

            const allOrders = [...(parentResponse.data.parentOrders || []), ...(legacy || [])];
            await fetchReviews(allOrders);

        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const fetchReviews = async (ordersList) => {
        const reviewsMap = {};
        for (const order of ordersList) {
            try {
                const response = await axios.get(`${apiUrl}/api/reviews/order/${order._id}`);
                reviewsMap[order._id] = (response.data.success && response.data.review) ? response.data.review : null;
            } catch (err) {
                reviewsMap[order._id] = null;
            }
        }
        setOrderReviews(prev => ({ ...prev, ...reviewsMap }));
    };

    const handleReviewSubmitted = (review) => {
        setOrderReviews(prev => ({ ...prev, [review.orderId]: review }));
        fetchOrders();
    };

    const fetchReturns = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const response = await axios.get(`${apiUrl}/api/returns/my-returns`, { headers });
            setReturns(response.data.returns || []);
        } catch (error) {
            console.error('Error fetching returns:', error);
        }
    };

    const handleReturnSubmit = async () => {
        const selectedItems = selectedSubOrder.items
            .filter(item => returnItems[item.productId])
            .map(item => ({
                ...item,
                reason: returnReason // Backend requires individual reason
            }));

        if (selectedItems.length === 0) {
            toast.warning('Please select at least one item to return');
            return;
        }

        setSubmittingReturn(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.post(`${apiUrl}/api/returns/request`, {
                subOrderId: selectedSubOrder._id,
                items: selectedItems,
                overallReason: returnReason,
                description: returnDescription
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                toast.success('Return request submitted!');
                setIsReturnModalOpen(false);
                fetchOrders();
                fetchReturns();
                setReturnItems({});
                setReturnDescription('');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit return');
        } finally {
            setSubmittingReturn(false);
        }
    };

    const handleLegacyReturnSubmit = async () => {
        setSubmittingReturn(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.post(`${apiUrl}/api/returns`, {
                orderId: selectedLegacyOrder._id,
                reason: returnReason,
                additionalNotes: returnDescription
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                toast.success('Return submitted!');
                setIsLegacyReturnModalOpen(false);
                fetchOrders();
                fetchReturns();
                setReturnDescription('');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit return');
        } finally {
            setSubmittingReturn(false);
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
        <div className="min-h-screen fb-bg py-8 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold fb-text">My Orders</h1>
                        <p className="fb-text-secondary mt-2">{totalOrders} order{totalOrders !== 1 ? 's' : ''} found</p>
                    </div>
                    <div className="flex bg-white rounded-lg p-1 shadow-sm border fb-border">
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`px-6 py-2 rounded-md font-medium transition-all ${activeTab === 'orders' ? 'bg-emerald-600 text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            Orders
                        </button>
                        <button
                            onClick={() => setActiveTab('returns')}
                            className={`px-6 py-2 rounded-md font-medium transition-all ${activeTab === 'returns' ? 'bg-emerald-600 text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            Returns ({returns.length})
                        </button>
                    </div>
                </div>

                {activeTab === 'returns' ? (
                    <div className="space-y-6">
                        {returns.length === 0 ? (
                            <div className="fb-card rounded-lg shadow p-12 text-center">
                                <FiRefreshCw className="mx-auto fb-text-muted mb-4" size={64} />
                                <h2 className="text-2xl font-semibold fb-text mb-2">No Returned Orders</h2>
                                <p className="fb-text-secondary">If you have issues with an order, you can return it here.</p>
                            </div>
                        ) : (
                            returns.map(ret => (
                                <div key={ret._id} className="fb-card rounded-xl overflow-hidden shadow">
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <span className="text-sm font-bold text-emerald-600">{ret.returnId}</span>
                                                <h3 className="text-lg font-bold fb-text">Reason: {ret.overallReason}</h3>
                                                <p className="text-sm fb-text-muted">Requested on {new Date(ret.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <span className={`px-4 py-1 rounded-full text-sm font-bold uppercase ${ret.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                                                ret.status === 'refunded' ? 'bg-emerald-100 text-emerald-700' :
                                                    ret.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {ret.status}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="fb-surface-alt p-4 rounded-lg">
                                                <h4 className="font-bold text-sm mb-2">Items being returned:</h4>
                                                <ul className="space-y-1">
                                                    {ret.items.map((item, i) => (
                                                        <li key={i} className="text-sm fb-text-secondary flex justify-between">
                                                            <span>{item.name} × {item.quantity}</span>
                                                            <span className="font-bold">₹{item.price * item.quantity}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                                <div className="mt-3 pt-3 border-t fb-divider flex justify-between font-bold">
                                                    <span>Refund Amount:</span>
                                                    <span className="fb-text-primary text-lg">₹{ret.refundDetails.amount}</span>
                                                </div>
                                            </div>
                                            <div className="fb-surface-alt p-4 rounded-lg">
                                                <h4 className="font-bold text-sm mb-2">Return Status & Remarks:</h4>
                                                <p className="text-sm fb-text-secondary">{ret.adminRemarks || 'Waiting for review...'}</p>
                                                {ret.status === 'approved' && (
                                                    <div className="mt-4 p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg flex items-start gap-2">
                                                        <FiAlertCircle className="mt-0.5" />
                                                        <span>An agent will contact you soon to pick up the items.</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : totalOrders === 0 ? (
                    <div className="fb-card rounded-lg shadow p-12 text-center">
                        <FiPackage className="mx-auto fb-text-muted mb-4" size={64} />
                        <h2 className="text-2xl font-semibold fb-text mb-2">
                            No Orders Yet
                        </h2>
                        <p className="fb-text-secondary">
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
                                    className="fb-card rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
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
                                    <div className="p-6 fb-surface">
                                        {/* Status & Payment Info */}
                                        <div className="flex gap-4 mb-4 flex-wrap">
                                            <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full border font-medium ${getParentStatusColor(parentOrder.overallStatus)}`}>
                                                <FiCheckCircle />
                                                {formatStatus(parentOrder.overallStatus)}
                                            </span>
                                            <span className="px-3 py-1.5 rounded-full border fb-bg fb-text fb-border font-medium">
                                                {parentOrder.paymentMethod}
                                            </span>
                                            <span className={`px-3 py-1.5 rounded-full border font-medium ${parentOrder.paymentStatus === 'Paid'
                                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                                : 'bg-orange-100 text-orange-800 border-orange-300'
                                                }`}>
                                                {parentOrder.paymentStatus}
                                            </span>
                                            {parentOrder.overallStatus === 'completed' && !orderReviews[parentOrder._id] && (
                                                <button
                                                    onClick={() => {
                                                        setOrderToRate({ _id: parentOrder._id, orderId: parentOrder.parentOrderId });
                                                        setIsRatingModalOpen(true);
                                                    }}
                                                    className="px-4 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-all hover:shadow-md flex items-center gap-1.5"
                                                >
                                                    <FiStar size={14} /> Rate Order
                                                </button>
                                            )}
                                            {orderReviews[parentOrder._id] && (
                                                <div className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium fb-primary-subtle fb-text-primary border fb-border-primary">
                                                    <FiStar className="fill-yellow-400 text-yellow-500" size={13} /> Rated
                                                </div>
                                            )}
                                            {(() => {
                                                const canReturnParent = parentOrder.overallStatus === 'completed' &&
                                                    parentOrder.subOrders?.some(sub => 
                                                        (sub.status === 'delivered' || sub.deliveryStatus === 'DELIVERED') &&
                                                        (new Date() - new Date(sub.deliveryDate || sub.updatedAt)) / (1000 * 60 * 60 * 24) <= 7 &&
                                                        sub.status !== 'returning' && sub.status !== 'refunded'
                                                    );
                                                return canReturnParent ? (
                                                    <button
                                                        onClick={() => {
                                                            if (parentOrder.subOrders?.length === 1) {
                                                                const sub = parentOrder.subOrders[0];
                                                                if ((sub.status === 'delivered' || sub.deliveryStatus === 'DELIVERED') &&
                                                                    (new Date() - new Date(sub.deliveryDate || sub.updatedAt)) / (1000 * 60 * 60 * 24) <= 7) {
                                                                    setSelectedSubOrder(sub);
                                                                    setIsReturnModalOpen(true);
                                                                }
                                                            } else {
                                                                setExpandedOrders(prev => ({ ...prev, [parentOrder._id]: true }));
                                                                toast.info("Please select the specific sub-order items you wish to return.");
                                                            }
                                                        }}
                                                        className="px-4 py-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-all hover:shadow-md flex items-center gap-1.5"
                                                    >
                                                        <FiRefreshCw size={14} /> Return Order
                                                    </button>
                                                ) : null;
                                            })()}
                                        </div>

                                        {/* Customer Details */}
                                        <div className="fb-surface-alt p-4 rounded-lg mb-4">
                                            <h3 className="font-semibold fb-text mb-2 flex items-center gap-2">
                                                <FiUser size={18} />
                                                Delivery Address:
                                            </h3>
                                            <p className="fb-text-secondary">
                                                {parentOrder.customer.name}<br />
                                                {parentOrder.customer.address}<br />
                                                {parentOrder.customer.phone}
                                            </p>
                                        </div>

                                        {/* Toggle Sub-Orders Button */}
                                        <button
                                            onClick={() => toggleOrderExpansion(parentOrder._id)}
                                            className="w-full flex items-center justify-between px-4 py-3 fb-primary-subtle hover:bg-emerald-100/10 rounded-lg transition-colors mb-4"
                                        >
                                            <span className="font-semibold fb-text-primary flex items-center gap-2">
                                                <FiShoppingBag />
                                                View {parentOrder.subOrders?.length} Sub-Order{parentOrder.subOrders?.length !== 1 ? 's' : ''}
                                            </span>
                                            {isExpanded ? <FiChevronUp className="fb-text-primary" /> : <FiChevronDown className="fb-text-primary" />}
                                        </button>

                                        {/* Sub-Orders (Expandable) */}
                                        {isExpanded && (
                                            <div className="space-y-4 mb-4">
                                                {parentOrder.subOrders?.map((subOrder, index) => {
                                                    const canReturn = (subOrder.status === 'delivered' || subOrder.deliveryStatus === 'DELIVERED') &&
                                                        (new Date() - new Date(subOrder.deliveryDate || subOrder.updatedAt)) / (1000 * 60 * 60 * 24) <= 7;

                                                    return (
                                                        <div key={subOrder._id} className="border fb-border rounded-lg p-4 fb-surface-alt">
                                                            {/* Sub-Order Header */}
                                                            <div className="flex justify-between items-start mb-3">
                                                                <div>
                                                                    <p className="text-sm fb-text-muted">Sub-Order {String.fromCharCode(65 + index)}</p>
                                                                    <p className="font-semibold fb-text">{subOrder.vendor?.vendorName || 'Unknown Vendor'}</p>
                                                                    <span className="text-xs fb-primary-subtle px-2 py-0.5 rounded fb-text-primary mt-1 inline-block border fb-border-primary">
                                                                        {subOrder.vendor?.vendorType === 'admin' ? 'Admin Store' : 'Farmer'}
                                                                    </span>
                                                                </div>
                                                                <div className="flex flex-col items-end gap-2">
                                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSubOrderStatusColor(subOrder.status)}`}>
                                                                        {formatStatus(subOrder.status)}
                                                                    </span>
                                                                    {canReturn && (
                                                                        <button
                                                                            onClick={() => {
                                                                                setSelectedSubOrder(subOrder);
                                                                                setIsReturnModalOpen(true);
                                                                            }}
                                                                            className="text-xs font-semibold fb-text-primary hover:underline"
                                                                        >
                                                                            Return Order
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Sub-Order Items */}
                                                            <div className="space-y-2 mb-3">
                                                                {subOrder.items?.map((item, idx) => (
                                                                    <div key={idx} className="flex justify-between items-center text-sm">
                                                                        <span className="fb-text-secondary">
                                                                            {item.name} × {item.quantity}
                                                                        </span>
                                                                        <span className="font-medium fb-text">
                                                                            ₹{(item.price * item.quantity).toFixed(2)}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {/* Delivery Option */}
                                                            <div className="flex items-center justify-between pt-3 border-t fb-divider">
                                                                <div className="flex items-center gap-2 text-sm fb-text-muted">
                                                                    <FiTruck />
                                                                    <span>
                                                                        {subOrder.deliveryOption === 'SELF_PICKUP' ? 'Self Pickup' : 'Delivery Agent'}
                                                                    </span>
                                                                </div>
                                                                <span className="font-semibold fb-text">
                                                                    ₹{subOrder.total?.toFixed(2)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
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
                                className="fb-card rounded-xl overflow-hidden hover:shadow-lg transition-shadow opacity-90"
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
                                <div className="p-6 fb-surface">
                                    <div className="flex gap-4 mb-4 flex-wrap">
                                        <span className="px-3 py-1.5 rounded-full border fb-bg fb-text fb-border font-medium">
                                            {order.status}
                                        </span>
                                        <span className="px-3 py-1.5 rounded-full border fb-bg fb-text fb-border font-medium">
                                            {order.paymentMethod}
                                        </span>
                                        {(order.status === 'Delivered' || order.status === 'completed') && !orderReviews[order._id] && (
                                            <button
                                                onClick={() => {
                                                    setOrderToRate(order);
                                                    setIsRatingModalOpen(true);
                                                }}
                                                className="px-4 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-all hover:shadow-md flex items-center gap-1.5"
                                            >
                                                <FiStar size={14} /> Rate Order
                                            </button>
                                        )}
                                        {orderReviews[order._id] && (
                                            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium fb-primary-subtle fb-text-primary border fb-border-primary">
                                                <FiStar className="fill-yellow-400 text-yellow-500" size={13} /> Rated
                                            </div>
                                        )}
                                        {(() => {
                                            const orderDate = new Date(order.deliveryDate || order.updatedAt || order.date);
                                            const diffDays = (new Date() - orderDate) / (1000 * 60 * 60 * 24);
                                            const canReturnLegacy = (order.status === 'Delivered' || order.status === 'completed') &&
                                                diffDays <= 7 && (!order.returnStatus || order.returnStatus === 'None');
                                            return canReturnLegacy ? (
                                                <button
                                                    onClick={() => {
                                                        setSelectedLegacyOrder(order);
                                                        setIsLegacyReturnModalOpen(true);
                                                    }}
                                                    className="px-4 py-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-all hover:shadow-md flex items-center gap-1.5"
                                                >
                                                    <FiRefreshCw size={14} /> Return Order
                                                </button>
                                            ) : null;
                                        })()}
                                    </div>

                                    {/* Order Items */}
                                    <div className="space-y-3 mb-4">
                                        <h3 className="font-semibold fb-text">Items:</h3>
                                        {order.items?.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center fb-surface-alt p-3 rounded-lg">
                                                <div>
                                                    <p className="font-medium fb-text">{item.name}</p>
                                                    <p className="text-sm fb-text-muted">
                                                        Qty: {item.quantity} × ₹{item.price}
                                                    </p>
                                                </div>
                                                <p className="font-semibold fb-text">
                                                    ₹{(item.quantity * item.price).toFixed(2)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Customer Details */}
                                    <div className="fb-surface-alt p-4 rounded-lg">
                                        <h3 className="font-semibold fb-text mb-2">Delivery Address:</h3>
                                        <p className="fb-text-secondary">
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

            {/* Rating Modal */}
            <RatingModal
                isOpen={isRatingModalOpen}
                onClose={() => setIsRatingModalOpen(false)}
                order={orderToRate}
                onReviewSubmitted={handleReviewSubmitted}
            />

            {/* Return Request Modal */}
            <Modal
                isOpen={isReturnModalOpen}
                onClose={() => setIsReturnModalOpen(false)}
                title="Return Order"
                size="md"
            >
                <div className="p-6">
                    <p className="text-sm fb-text-secondary mb-4">
                        Please select the items you wish to return and explain the reason.
                        Note: Returns are subject to our policy (2 days for general items, same day for perishables).
                    </p>

                    <div className="space-y-3 mb-6">
                        <h4 className="font-bold fb-text text-sm">Select Items:</h4>
                        {selectedSubOrder?.items.map((item) => (
                            <div key={item.productId} className="flex items-center justify-between p-3 border fb-border rounded-lg bg-gray-50/50">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id={`item-${item.productId}`}
                                        checked={!!returnItems[item.productId]}
                                        onChange={(e) => setReturnItems(prev => ({ ...prev, [item.productId]: e.target.checked }))}
                                        className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <label htmlFor={`item-${item.productId}`} className="text-sm font-medium fb-text">
                                        {item.name} <span className="fb-text-muted">× {item.quantity}</span>
                                    </label>
                                </div>
                                <span className="text-sm font-bold">₹{item.price * item.quantity}</span>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-bold fb-text mb-2 text-red-500">Reason for Return *</label>
                            <select
                                value={returnReason}
                                onChange={(e) => setReturnReason(e.target.value)}
                                className="w-full fb-input rounded-lg"
                            >
                                <option>Wrong item</option>
                                <option>Damaged</option>
                                <option>Expired</option>
                                <option>Quality issue</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold fb-text mb-2">Upload Proof (Optional)</label>
                            <div className="flex items-center justify-center w-full h-[42px] border-2 border-dashed fb-border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                <label className="flex items-center gap-2 text-sm fb-text-muted cursor-pointer">
                                    <FiCamera />
                                    <span>Add Photos</span>
                                    <input type="file" className="hidden" multiple accept="image/*" />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-bold fb-text mb-2">Additional Description</label>
                        <textarea
                            value={returnDescription}
                            onChange={(e) => setReturnDescription(e.target.value)}
                            className="w-full fb-input rounded-lg min-h-[100px]"
                            placeholder="Please provide more details about the issue..."
                        />
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t fb-divider">
                        <div className="flex flex-col">
                            <span className="text-xs fb-text-muted">Estimated Refund</span>
                            <span className="text-xl font-bold fb-text-primary">
                                ₹{selectedSubOrder?.items
                                    .filter(item => returnItems[item.productId])
                                    .reduce((acc, item) => acc + (item.price * item.quantity), 0) || 0}
                            </span>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsReturnModalOpen(false)}
                                className="px-6 py-2 rounded-lg border fb-border hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReturnSubmit}
                                disabled={submittingReturn}
                                className={`px-8 py-2 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2 ${submittingReturn ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {submittingReturn ? 'Submitting...' : 'Return Order'}
                                {!submittingReturn && <FiCheck />}
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Legacy Return Modal */}
            <Modal
                isOpen={isLegacyReturnModalOpen}
                onClose={() => setIsLegacyReturnModalOpen(false)}
                title="Return Order"
                size="md"
            >
                <div className="p-6">
                    <p className="text-sm fb-text-secondary mb-4">
                        Please explain the reason for returning this order. Our team will review and pick it up.
                        Note: Returns are subject to our 7-day policy.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-bold fb-text mb-2 text-red-500">Reason for Return *</label>
                            <select
                                value={returnReason}
                                onChange={(e) => setReturnReason(e.target.value)}
                                className="w-full fb-input rounded-lg"
                            >
                                <option>Wrong item</option>
                                <option>Damaged</option>
                                <option>Expired</option>
                                <option>Quality issue</option>
                                <option>Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-bold fb-text mb-2">Additional Description</label>
                        <textarea
                            value={returnDescription}
                            onChange={(e) => setReturnDescription(e.target.value)}
                            className="w-full fb-input rounded-lg min-h-[100px]"
                            placeholder="Please provide more details about the issue..."
                        />
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t fb-divider">
                        <div className="flex gap-3 ml-auto">
                            <button
                                onClick={() => setIsLegacyReturnModalOpen(false)}
                                className="px-6 py-2 rounded-lg border fb-border hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLegacyReturnSubmit}
                                disabled={submittingReturn}
                                className={`px-8 py-2 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2 ${submittingReturn ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {submittingReturn ? 'Submitting...' : 'Return Order'}
                                {!submittingReturn && <FiCheck />}
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default MyOrdersPage;