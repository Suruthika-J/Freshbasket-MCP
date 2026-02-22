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
        status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    const filteredOrders = filter === 'all' ? subOrders : subOrders.filter(o => o.status === filter);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {['all', 'pending', 'confirmed', 'preparing', 'ready'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className="px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200"
                        style={filter === status
                            ? { backgroundColor: 'var(--color-primary)', color: '#fff' }
                            : { backgroundColor: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)' }
                        }
                    >
                        {status === 'all' ? 'All Orders' : formatStatus(status)}
                        <span className="ml-2 text-sm opacity-80">
                            ({status === 'all' ? subOrders.length : subOrders.filter(o => o.status === status).length})
                        </span>
                    </button>
                ))}
            </div>

            {/* Sub-Orders List */}
            {filteredOrders.length === 0 ? (
                <div className="fb-card rounded-xl p-12 text-center">
                    <FiPackage className="mx-auto fb-text-muted mb-4" size={48} />
                    <h3 className="text-lg font-semibold fb-text mb-2">No Orders Found</h3>
                    <p className="fb-text-secondary">
                        {filter === 'all' ? 'You have no orders yet.' : `No ${formatStatus(filter).toLowerCase()} orders.`}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map((subOrder) => {
                        const badge = getStatusBadge(subOrder.status);
                        return (
                            <div key={subOrder._id} className="fb-card rounded-xl overflow-hidden">
                                {/* Order Header — always green gradient */}
                                <div className="px-6 py-4 text-white" style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%)' }}>
                                    <div className="flex justify-between items-center flex-wrap gap-4">
                                        <div>
                                            <p className="text-sm opacity-80">Sub-Order ID</p>
                                            <p className="text-lg font-bold">{subOrder.subOrderId}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm opacity-80">Parent Order</p>
                                            <p className="font-semibold">{subOrder.parentOrder?.parentOrderId || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm opacity-80">Order Date</p>
                                            <p className="font-semibold">
                                                {new Date(subOrder.createdAt).toLocaleDateString('en-IN', {
                                                    day: 'numeric', month: 'short', year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm opacity-80">Total</p>
                                            <p className="text-xl font-bold">₹{subOrder.total?.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Body */}
                                <div className="p-6">
                                    {/* Status Badge */}
                                    <div className="flex items-center gap-3 mb-5">
                                        <span
                                            className="px-4 py-1.5 rounded-full text-sm font-bold border"
                                            style={{ backgroundColor: badge.bg, color: badge.color, borderColor: badge.border }}
                                        >
                                            {formatStatus(subOrder.status)}
                                        </span>
                                        <span className="flex items-center gap-2 text-sm fb-text-secondary">
                                            <FiTruck />
                                            {subOrder.deliveryOption === 'self-pickup' ? 'Self Pickup' : 'Delivery Agent'}
                                        </span>
                                    </div>

                                    {/* Customer Info */}
                                    <div className="fb-surface-alt rounded-xl p-4 mb-4 border fb-border">
                                        <h4 className="font-semibold fb-text mb-2 flex items-center gap-2">
                                            <FiUser size={16} className="fb-text-primary" />
                                            Customer Details
                                        </h4>
                                        <p className="fb-text-secondary text-sm leading-relaxed">
                                            <span className="fb-text font-medium">{subOrder.customer?.name}</span><br />
                                            {subOrder.customer?.phone}<br />
                                            {subOrder.customer?.address}
                                        </p>
                                    </div>

                                    {/* Items */}
                                    <div className="mb-5">
                                        <h4 className="font-semibold fb-text mb-3">Order Items</h4>
                                        <div className="space-y-2">
                                            {subOrder.items?.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center fb-surface-alt p-3 rounded-lg border fb-border">
                                                    <div>
                                                        <p className="font-medium fb-text">{item.name}</p>
                                                        <p className="text-sm fb-text-secondary">
                                                            Qty: {item.quantity} × ₹{item.price}
                                                        </p>
                                                    </div>
                                                    <p className="font-semibold fb-text-primary">
                                                        ₹{(item.quantity * item.price).toFixed(2)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 flex-wrap">
                                        {subOrder.status === 'confirmed' && (
                                            <button
                                                onClick={() => updateOrderStatus(subOrder._id, 'preparing')}
                                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-opacity hover:opacity-90"
                                                style={{ backgroundColor: 'var(--color-warning)' }}
                                            >
                                                <FiClock />
                                                Mark as Preparing
                                            </button>
                                        )}
                                        {subOrder.status === 'preparing' && (
                                            <button
                                                onClick={() => updateOrderStatus(subOrder._id, 'ready')}
                                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-opacity hover:opacity-90"
                                                style={{ backgroundColor: 'var(--color-info)' }}
                                            >
                                                <FiCheck />
                                                Mark as Ready
                                            </button>
                                        )}
                                        {subOrder.status === 'ready' && subOrder.deliveryOption === 'self-pickup' && (
                                            <button
                                                onClick={() => updateOrderStatus(subOrder._id, 'delivered')}
                                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-opacity hover:opacity-90"
                                                style={{ backgroundColor: 'var(--color-primary)' }}
                                            >
                                                <FiCheck />
                                                Mark as Picked Up
                                            </button>
                                        )}
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
