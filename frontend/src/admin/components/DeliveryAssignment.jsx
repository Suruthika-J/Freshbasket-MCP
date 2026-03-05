// frontend/src/admin/components/DeliveryAssignment.jsx
// Admin component for assigning delivery agents to sub-orders

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiTruck, FiUser, FiPackage, FiMapPin } from 'react-icons/fi';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const DeliveryAssignment = () => {
    const [pendingDeliveries, setPendingDeliveries] = useState([]);
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPendingDeliveries();
        fetchAgents();
    }, []);

    const getToken = () => {
        try {
            const sessionData = localStorage.getItem('adminSession');
            if (sessionData) {
                const { token } = JSON.parse(sessionData);
                return token;
            }
        } catch (error) {
            console.error('Error getting admin token:', error);
        }
        return localStorage.getItem('authToken'); // Fallback
    };

    const fetchPendingDeliveries = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${API_BASE_URL}/api/sub-orders/admin/pending-deliveries`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                // Backend returns { success: true, count: X, pendingDeliveries: [...] }
                setPendingDeliveries(response.data.pendingDeliveries || []);
            }
        } catch (error) {
            console.error('Error fetching pending deliveries:', error);
            toast.error('Failed to load pending deliveries');
        } finally {
            setLoading(false);
        }
    };

    const fetchAgents = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${API_BASE_URL}/api/user/agents`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setAgents(response.data.agents || []);
            }
        } catch (error) {
            console.error('Error fetching agents:', error);
        }
    };

    const assignAgent = async (subOrderId, agentId) => {
        try {
            const token = getToken();
            // Updated to PATCH /api/sub-orders/:id/assign-delivery-agent
            const response = await axios.patch(
                `${API_BASE_URL}/api/sub-orders/${subOrderId}/assign-delivery-agent`,
                { agentId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                toast.success('Agent assigned successfully');
                fetchPendingDeliveries(); // Refresh list
            }
        } catch (error) {
            console.error('Error assigning agent:', error);
            toast.error(error.response?.data?.message || 'Failed to assign agent');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Delivery Assignment</h2>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                    {pendingDeliveries.length} Pending
                </span>
            </div>

            {pendingDeliveries.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <FiTruck className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Pending Deliveries</h3>
                    <p className="text-gray-500">All delivery requests have been assigned.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {pendingDeliveries.map((subOrder) => (
                        <div key={subOrder._id} className="bg-white rounded-lg shadow-sm p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Order Info */}
                                <div className="lg:col-span-2">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {subOrder.subOrderId}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                Parent: {subOrder.parentOrder?.parentOrderId || 'N/A'}
                                            </p>
                                        </div>
                                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                                            {subOrder.status}
                                        </span>
                                    </div>

                                    {/* Customer Info */}
                                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                        <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <FiUser size={16} />
                                            Customer
                                        </h4>
                                        <p className="text-sm text-gray-600">
                                            {subOrder.parentOrder?.customer?.name || 'N/A'}<br />
                                            {subOrder.parentOrder?.customer?.phone || 'N/A'}<br />
                                            <span className="flex items-center gap-1 mt-1">
                                                <FiMapPin size={14} />
                                                {subOrder.parentOrder?.customer?.address || 'N/A'}
                                            </span>
                                        </p>
                                    </div>

                                    {/* Items */}
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <FiPackage size={16} />
                                            Items ({subOrder.items?.length || 0})
                                        </h4>
                                        <div className="space-y-1">
                                            {subOrder.items?.slice(0, 3).map((item, idx) => (
                                                <p key={idx} className="text-sm text-gray-600">
                                                    • {item.name} × {item.quantity}
                                                </p>
                                            ))}
                                            {subOrder.items?.length > 3 && (
                                                <p className="text-sm text-gray-500">
                                                    +{subOrder.items.length - 3} more items
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Agent Assignment */}
                                <div className="flex flex-col justify-between">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Assign Delivery Agent
                                        </label>
                                        <select
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    assignAgent(subOrder._id, e.target.value);
                                                }
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            defaultValue=""
                                        >
                                            <option value="" disabled>Select an agent...</option>
                                            {agents.map((agent) => (
                                                <option key={agent._id} value={agent._id}>
                                                    {agent.name} ({agent.email})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <p className="text-sm text-gray-600">Order Total</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            ₹{subOrder.total?.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DeliveryAssignment;
