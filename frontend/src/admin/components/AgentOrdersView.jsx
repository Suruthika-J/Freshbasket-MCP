// admin/src/components/AgentOrdersView.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiX, FiPackage, FiTruck, FiMapPin } from 'react-icons/fi';
import { toast } from 'react-toastify';

const AgentOrdersView = ({ isOpen, onClose, agentId, agentName }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        if (isOpen && agentId) {
            fetchAgentOrders();
        }
    }, [isOpen, agentId]);

    const fetchAgentOrders = async () => {
        try {
            setLoading(true);
            console.log('📦 Fetching orders for agent:', agentId);

            const response = await axios.get(
                `http://localhost:4000/api/agents/${agentId}`
            );

            console.log('✅ Orders fetched:', response.data);

            if (response.data.success) {
                setOrders(response.data.agent.assignedOrders || []);
            }
        } catch (error) {
            console.error('❌ Fetch agent orders error:', error);
            toast.error('Failed to load agent orders');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'Processing':
                return 'bg-blue-100 text-blue-800';
            case 'Shipped':
                return 'bg-purple-100 text-purple-800';
            case 'Delivered':
                return 'bg-green-100 text-green-800';
            case 'Cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-emerald-600 px-6 py-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold text-white">
                            Orders Assigned to {agentName}
                        </h2>
                        <p className="text-emerald-100 text-sm mt-1">
                            View all orders assigned to this delivery agent
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-gray-200 transition-colors"
                    >
                        <FiX size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <i className="fas fa-spinner fa-spin text-4xl text-emerald-600"></i>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-12">
                            <FiPackage className="mx-auto text-6xl text-gray-300 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                No Orders Assigned
                            </h3>
                            <p className="text-gray-500">
                                This agent doesn't have any orders assigned yet
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {orders.map((order) => (
                                <div
                                    key={order._id}
                                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => setSelectedOrder(order)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <h3 className="font-semibold text-lg text-gray-900">
                                                    {order.orderId}
                                                </h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            
                                            <div className="space-y-1 text-sm text-gray-600">
                                                <p>
                                                    <strong>Customer:</strong> {order.customer?.name}
                                                </p>
                                                <p>
                                                    <strong>Phone:</strong> {order.customer?.phone || 'N/A'}
                                                </p>
                                                <p>
                                                    <strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-emerald-600">
                                                ₹{order.total?.toFixed(2)}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {Array.isArray(order.items) ? order.items.length : 0} items
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                        <p className="text-gray-600">
                            Total Orders: <strong>{orders.length}</strong>
                        </p>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="bg-blue-600 px-6 py-4 flex justify-between items-center sticky top-0">
                            <h3 className="text-lg font-semibold text-white">
                                Order Details: {selectedOrder.orderId}
                            </h3>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="text-white hover:text-gray-200"
                            >
                                <FiX size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Customer Info */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="font-semibold mb-2 flex items-center">
                                    <FiMapPin className="mr-2 text-blue-600" />
                                    Customer Information
                                </h4>
                                <div className="space-y-1 text-sm">
                                    <p><strong>Name:</strong> {selectedOrder.customer?.name}</p>
                                    <p><strong>Phone:</strong> {selectedOrder.customer?.phone}</p>
                                    <p><strong>Email:</strong> {selectedOrder.customer?.email || 'N/A'}</p>
                                    <p><strong>Address:</strong> {selectedOrder.customer?.address}</p>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div>
                                <h4 className="font-semibold mb-2 flex items-center">
                                    <FiPackage className="mr-2 text-blue-600" />
                                    Order Items
                                </h4>
                                <div className="space-y-2">
                                    {selectedOrder.items?.map((item, idx) => (
                                        <div key={idx} className="flex justify-between p-2 bg-gray-50 rounded">
                                            <span>{item.name} × {item.quantity}</span>
                                            <span className="font-medium">
                                                ₹{(item.price * item.quantity).toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="bg-blue-50 rounded-lg p-4">
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total Amount:</span>
                                    <span className="text-blue-600">
                                        ₹{selectedOrder.total?.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgentOrdersView;