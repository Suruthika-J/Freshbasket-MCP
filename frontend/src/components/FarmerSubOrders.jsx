// frontend/src/components/FarmerSubOrders.jsx
// Component for farmers to view and manage their sub-orders

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiPackage, FiTruck, FiUser, FiClock, FiCheck } from 'react-icons/fi';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const FarmerSubOrders = () => {
    const [subOrders, setSubOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchSubOrders();
    }, []);

    const fetchSubOrders = async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            const response = await axios.get(`${API_BASE_URL}/api/orders/farmer`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                setSubOrders(response.data.subOrders);
            } else {
                toast.error('Failed to fetch orders');
            }
        } catch (error) {
            console.error('❌ Error fetching sub-orders:', error);
            const errorMessage = error.response?.data?.message || 'Failed to load orders';
            const errorDetail = error.response?.data?.error || '';
            toast.error(`${errorMessage}${errorDetail ? ': ' + errorDetail : ''}`);
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (subOrderId, status) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) { toast.error('Authentication required'); return; }

            const response = await axios.patch(`${API_BASE_URL}/api/sub-orders/${subOrderId}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
            });

            if (response.data.success) {
                toast.success('Order status updated successfully');
                fetchSubOrders();
            } else {
                toast.error('Failed to update order status');
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            toast.error('Failed to update order status');
        }
    };

    // Returns vivid, clearly readable badge styles
    const getStatusBadge = (status) => {
        const map = {
            'delivered': { bg: '#E8F5E9', color: '#1B5E20', border: '#2E7D32' },
            'out-for-delivery': { bg: '#E3F2FD', color: '#0D47A1', border: '#1565C0' },
            'ready': { bg: '#E0F7FA', color: '#006064', border: '#00838F' },
            'preparing': { bg: '#FFF8E1', color: '#E65100', border: '#F57C00' },
            'confirmed': { bg: '#F3E5F5', color: '#4A148C', border: '#7B1FA2' },
            'pending': { bg: '#FFF3E0', color: '#BF360C', border: '#E64A19' },
        };
        return map[status] || { bg: '#F5F5F5', color: '#424242', border: '#9E9E9E' };
    };

    const formatStatus = (status) =>
        status ? status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Unknown';

    const filteredOrders = filter === 'all' ? subOrders : subOrders.filter(o => o.orderStatus === filter);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-100">
                <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-green-600 mb-4"></div>
                <p className="text-gray-500 font-medium">Loading your orders...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">Farmer Orders</h2>
                    <p className="text-gray-500 mt-1">Manage and track your customer orders from FreshBasket</p>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {['all', 'pending', 'confirmed', 'preparing', 'ready'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 transform hover:scale-105 active:scale-95 whitespace-nowrap shadow-sm ${filter === status
                                ? 'bg-green-600 text-white shadow-green-200'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                                }`}
                        >
                            {status === 'all' ? 'All' : formatStatus(status)}
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${filter === status ? 'bg-white/20' : 'bg-gray-100'}`}>
                                {status === 'all' ? subOrders.length : subOrders.filter(o => o.orderStatus === status).length}
                            </span>
                        </button>
                    ))}
                </div>
            </header>

            {filteredOrders.length === 0 ? (
                <div className="bg-white rounded-2xl p-20 text-center shadow-sm border border-gray-100">
                    <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FiPackage className="text-gray-300" size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">No Orders Found</h3>
                    <p className="text-gray-500 max-w-xs mx-auto">
                        {filter === 'all' ? 'We haven\'t received any orders for your products yet.' : `You don't have any orders currently marked as ${formatStatus(filter).toLowerCase()}.`}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {filteredOrders.map((subOrder) => {
                        const badge = getStatusBadge(subOrder.orderStatus);
                        return (
                            <div key={subOrder._id} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 group">
                                {/* Order Header - Sophisticated Gradient */}
                                <div className="px-8 py-5 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
                                    <div className="flex justify-between items-center flex-wrap gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-md">
                                                <FiPackage size={24} className="text-green-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">Sub-Order ID</p>
                                                <p className="text-lg font-mono font-bold text-green-400">{subOrder.subOrderId}</p>
                                            </div>
                                        </div>
                                        <div className="h-10 w-px bg-white/10 hidden md:block"></div>
                                        <div>
                                            <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">Parent Order</p>
                                            <p className="font-semibold text-gray-200">{subOrder.parentOrderId}</p>
                                        </div>
                                        <div className="h-10 w-px bg-white/10 hidden md:block"></div>
                                        <div>
                                            <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">Total Earnt</p>
                                            <p className="text-2xl font-black text-white">₹{subOrder.subTotal?.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Body */}
                                <div className="p-8">
                                    <div className="flex flex-col lg:flex-row gap-8">
                                        {/* Left Side: Progress & Status */}
                                        <div className="flex-1 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest border shadow-sm"
                                                        style={{ backgroundColor: badge.bg, color: badge.color, borderColor: badge.border }}
                                                    >
                                                        {formatStatus(subOrder.orderStatus)}
                                                    </span>
                                                    <div className="flex flex-col gap-1 items-start">
                                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-xs font-bold text-gray-500 border border-gray-100">
                                                            <FiTruck size={14} className="text-blue-500" />
                                                            {subOrder.deliveryOption === 'SELF_PICKUP' ? 'Self Pickup' : 'Home Delivery'}
                                                        </div>
                                                        {subOrder.deliveryOption === 'DELIVERY_AGENT' && (
                                                            <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-indigo-100">
                                                                Status: {subOrder.deliveryStatus || 'PENDING_ASSIGNMENT'}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                                    <FiClock size={14} />
                                                    {new Date(subOrder.createdAt).toLocaleDateString('en-IN', {
                                                        day: 'numeric', month: 'short', year: 'numeric'
                                                    })}
                                                </div>
                                            </div>

                                            {/* Products Section */}
                                            <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
                                                <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <div className="w-1.5 h-4 bg-green-500 rounded-full"></div>
                                                    Order Items ({subOrder.items?.length})
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {subOrder.items?.map((item, idx) => (
                                                        <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center group/item hover:border-green-200 transition-colors shadow-sm">
                                                            <div>
                                                                <p className="font-bold text-gray-800 group-hover/item:text-green-700 transition-colors">{item.name}</p>
                                                                <p className="text-xs font-bold text-gray-400 mt-1">
                                                                    {item.quantity} units × ₹{item.price}
                                                                </p>
                                                            </div>
                                                            <p className="font-black text-gray-900 bg-gray-50 px-3 py-1 rounded-lg">
                                                                ₹{item.subtotal?.toFixed(2)}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Side: Customer & Actions */}
                                        <div className="w-full lg:w-80 space-y-6">
                                            {/* Customer Highlights */}
                                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100 relative overflow-hidden group/customer">
                                                <div className="absolute -right-4 -top-4 text-green-100 group-hover/customer:text-green-200 transition-colors transform rotate-12">
                                                    <FiUser size={120} />
                                                </div>
                                                <h4 className="text-xs font-black text-green-700 uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10">
                                                    <FiUser size={14} />
                                                    Customer Info
                                                </h4>
                                                <div className="space-y-3 relative z-10">
                                                    <div>
                                                        <p className="text-lg font-black text-gray-800 leading-tight">{subOrder.customerName}</p>
                                                        <p className="text-sm font-bold text-green-600">{subOrder.customerPhone}</p>
                                                    </div>
                                                    <div className="pt-3 border-t border-green-200/50">
                                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-tighter mb-1">Delivery Address</p>
                                                        <p className="text-sm text-gray-600 leading-snug">{subOrder.customerAddress}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Order Action Logic */}
                                            <div className="pt-2">
                                                {subOrder.orderStatus === 'confirmed' && (
                                                    <button
                                                        onClick={() => updateOrderStatus(subOrder._id, 'preparing')}
                                                        className="w-full group flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-orange-500 text-white font-black uppercase tracking-widest text-sm hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 active:scale-[0.98]"
                                                    >
                                                        <FiClock className="group-hover:rotate-12 transition-transform" />
                                                        Start Preparing
                                                    </button>
                                                )}
                                                {subOrder.orderStatus === 'preparing' && (
                                                    <button
                                                        onClick={() => updateOrderStatus(subOrder._id, 'ready')}
                                                        className="w-full group flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-blue-600 text-white font-black uppercase tracking-widest text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-[0.98]"
                                                    >
                                                        <FiCheck className="scale-125" />
                                                        Mark as Ready
                                                    </button>
                                                )}
                                                {subOrder.orderStatus === 'ready' && subOrder.deliveryOption === 'SELF_PICKUP' && (
                                                    <button
                                                        onClick={() => updateOrderStatus(subOrder._id, 'delivered')}
                                                        className="w-full group flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-green-600 text-white font-black uppercase tracking-widest text-sm hover:bg-green-700 transition-all shadow-lg shadow-green-200 active:scale-[0.98]"
                                                    >
                                                        <FiCheck className="scale-125" />
                                                        Confirm Handover
                                                    </button>
                                                )}
                                                {['delivered', 'cancelled'].includes(subOrder.orderStatus) && (
                                                    <div className={`text-center py-4 rounded-xl border-2 border-dashed font-bold uppercase tracking-widest text-xs ${subOrder.orderStatus === 'delivered' ? 'border-green-100 text-green-400' : 'border-red-100 text-red-400'
                                                        }`}>
                                                        {subOrder.orderStatus} Order
                                                    </div>
                                                )}
                                                {subOrder.orderStatus === 'ready' && subOrder.deliveryOption === 'DELIVERY_AGENT' && (
                                                    <div className="bg-blue-50 text-blue-700 p-4 rounded-xl text-center border border-blue-100">
                                                        <p className="text-xs font-black uppercase tracking-widest mb-1">Awaiting Agent</p>
                                                        <p className="text-xs font-bold opacity-80 leading-tight">Waiting for delivery agent to pick up your order.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default FarmerSubOrders;
