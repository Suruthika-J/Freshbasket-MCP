// frontend/src/components/AgentSubOrders.jsx
// Component for delivery agents to view and manage assigned sub-orders

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiPackage, FiTruck, FiUser, FiMapPin, FiCheck, FiNavigation } from 'react-icons/fi';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const AgentSubOrders = () => {
    const [subOrders, setSubOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, ready, out-for-delivery

    useEffect(() => {
        fetchSubOrders();
    }, []);

    const fetchSubOrders = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(`${API_BASE_URL}/api/sub-orders/agent/my-deliveries`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setSubOrders(response.data.subOrders || []);
            }
        } catch (error) {
            console.error('Error fetching sub-orders:', error);
            toast.error('Failed to load deliveries');
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (subOrderId, newStatus) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.patch(
                `${API_BASE_URL}/api/sub-orders/${subOrderId}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                toast.success(`Order status updated to ${newStatus}`);
                fetchSubOrders(); // Refresh
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'delivered':
                return 'bg-emerald-100 text-emerald-800';
            case 'out-for-delivery':
                return 'bg-blue-100 text-blue-800';
            case 'ready':
                return 'bg-cyan-100 text-cyan-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatStatus = (status) => {
        return status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const filteredOrders = filter === 'all'
        ? subOrders
        : subOrders.filter(order => order.status === filter);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {['all', 'ready', 'out-for-delivery'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${filter === status
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {status === 'all' ? 'All Deliveries' : formatStatus(status)}
                        <span className="ml-2 text-sm">
                            ({status === 'all' ? subOrders.length : subOrders.filter(o => o.status === status).length})
                        </span>
                    </button>
                ))}
            </div>

            {/* Sub-Orders List */}
            {filteredOrders.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <FiTruck className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Deliveries Found</h3>
                    <p className="text-gray-500">
                        {filter === 'all'
                            ? 'You have no assigned deliveries yet.'
                            : `No ${formatStatus(filter).toLowerCase()} deliveries.`}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map((subOrder) => (
                        <div key={subOrder._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                            {/* Order Header */}
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
                                <div className="flex justify-between items-center flex-wrap gap-4">
                                    <div>
                                        <p className="text-sm opacity-90">Sub-Order ID</p>
                                        <p className="text-lg font-bold">{subOrder.subOrderId}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm opacity-90">Parent Order</p>
                                        <p className="font-semibold">{subOrder.parentOrder?.parentOrderId || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm opacity-90">Vendor</p>
                                        <p className="font-semibold">{subOrder.vendor?.vendorName || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm opacity-90">Total</p>
                                        <p className="text-xl font-bold">₹{subOrder.total?.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Order Body */}
                            <div className="p-6">
                                {/* Status Badge */}
                                <div className="flex items-center gap-3 mb-4">
                                    <span className={`px-3 py-1.5 rounded-full font-medium ${getStatusColor(subOrder.status)}`}>
                                        {formatStatus(subOrder.status)}
                                    </span>
                                    <span className="text-sm text-gray-600">
                                        Delivery Option: {subOrder.deliveryOption === 'SELF_PICKUP' ? 'Self Pickup' : 'Delivery Agent'}
                                    </span>
                                </div>

                                {/* Customer Info */}
                                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <FiUser size={18} />
                                        Customer Details
                                    </h4>
                                    <div className="space-y-1 text-gray-600">
                                        <p><strong>Name:</strong> {subOrder.customer?.name}</p>
                                        <p><strong>Phone:</strong> {subOrder.customer?.phone}</p>
                                        <p className="flex items-start gap-1">
                                            <FiMapPin className="mt-1 flex-shrink-0" size={16} />
                                            <span><strong>Address:</strong> {subOrder.customer?.address}</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Items */}
                                <div className="mb-4">
                                    <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                        <FiPackage size={18} />
                                        Order Items ({subOrder.items?.length || 0})
                                    </h4>
                                    <div className="space-y-2">
                                        {subOrder.items?.map((item, idx) => (
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
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 flex-wrap">
                                    {subOrder.status === 'ready' && (
                                        <button
                                            onClick={() => updateOrderStatus(subOrder._id, 'out-for-delivery')}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                        >
                                            <FiNavigation />
                                            Start Delivery
                                        </button>
                                    )}
                                    {subOrder.status === 'out-for-delivery' && (
                                        <button
                                            onClick={() => updateOrderStatus(subOrder._id, 'delivered')}
                                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                                        >
                                            <FiCheck />
                                            Mark as Delivered
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AgentSubOrders;
