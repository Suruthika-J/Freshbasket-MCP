
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiX, FiUser, FiTruck } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { getAuthHeaders } from '../utils/auth';

const AssignAgentModal = ({ isOpen, onClose, order, onAgentAssigned }) => {
    const [agents, setAgents] = useState([]);
    const [selectedAgentId, setSelectedAgentId] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchingAgents, setFetchingAgents] = useState(true);

    const API_URL = 'http://localhost:4000/api';

    useEffect(() => {
        if (isOpen) {
            fetchAgents();
            // Pre-select current agent if order is already assigned
            if (order?.assignedTo?._id) {
                setSelectedAgentId(order.assignedTo._id);
            } else {
                setSelectedAgentId('');
            }
        }
    }, [isOpen, order]);

    const fetchAgents = async () => {
        try {
            setFetchingAgents(true);
            console.log('📡 Fetching agents from:', `${API_URL}/agents`);

            const response = await axios.get(`${API_URL}/agents`, {
                headers: getAuthHeaders()
            });

            console.log('✅ Agents response:', response.data);

            if (response.data.success) {
                // Filter only active agents
                const activeAgents = response.data.agents.filter(agent => agent.isActive);
                console.log(`✅ Active agents found: ${activeAgents.length}`);
                setAgents(activeAgents);
            }
        } catch (error) {
            console.error('❌ Fetch agents error:', error);
            toast.error('Failed to load delivery agents');
        } finally {
            setFetchingAgents(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedAgentId) {
            toast.error('Please select a delivery agent');
            return;
        }

        if (!order?._id) {
            toast.error('Invalid order data');
            return;
        }

        setLoading(true);

        try {
            const assignUrl = `${API_URL}/orders/admin/${order._id}/assign`;
            console.log('📡 Assigning agent to:', assignUrl);
            console.log('   Order ID:', order._id);
            console.log('   Agent ID:', selectedAgentId);

            const response = await axios.put(assignUrl, {
                agentId: selectedAgentId
            }, {
                headers: getAuthHeaders()
            });

            console.log('✅ Assignment response:', response.data);

            if (response.data.success) {
                toast.success(response.data.message);
                onAgentAssigned(response.data.order);
                onClose();
            }
        } catch (error) {
            console.error('❌ Assign agent error:', error);
            console.error('   Error response:', error.response?.data);
            console.error('   Status code:', error.response?.status);

            const message = error.response?.data?.message || 'Failed to assign agent';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !order) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <div className="flex items-center">
                        <div className="bg-blue-100 p-2 rounded-full mr-3">
                            <FiUser className="text-blue-600" size={20} />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            Assign Delivery Agent
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={loading}
                    >
                        <FiX size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {/* Order Info */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Order Details</h3>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Order ID:</span>
                                <span className="font-medium text-gray-900">{order.orderId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Customer:</span>
                                <span className="font-medium text-gray-900">{order.customer?.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Status:</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                                    order.status === 'Shipped' ? 'bg-purple-100 text-purple-800' :
                                    order.status === 'Processing' ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {order.status}
                                </span>
                            </div>
                            {order.assignedTo && (
                                <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                                    <span className="text-gray-600">Currently Assigned:</span>
                                    <span className="font-medium text-blue-600">{order.assignedTo.name}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Agent Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Delivery Agent
                        </label>
                        
                        {fetchingAgents ? (
                            <div className="flex items-center justify-center py-8">
                                <i className="fas fa-spinner fa-spin text-2xl text-blue-600"></i>
                                <span className="ml-3 text-gray-600">Loading agents...</span>
                            </div>
                        ) : agents.length === 0 ? (
                            <div className="text-center py-8">
                                <FiTruck className="mx-auto text-gray-400 mb-2" size={32} />
                                <p className="text-gray-600">No active delivery agents available</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Please create delivery agents first
                                </p>
                            </div>
                        ) : (
                            <select
                                value={selectedAgentId}
                                onChange={(e) => setSelectedAgentId(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={loading}
                            >
                                <option value="">-- Choose an agent --</option>
                                {agents.map((agent) => (
                                    <option key={agent._id} value={agent._id}>
                                        {agent.name} - {agent.email}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Selected Agent Info */}
                    {selectedAgentId && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="text-sm font-medium text-blue-900 mb-2">
                                Selected Agent Details
                            </h4>
                            {(() => {
                                const agent = agents.find(a => a._id === selectedAgentId);
                                return agent ? (
                                    <div className="space-y-1 text-sm text-blue-800">
                                        <p><strong>Name:</strong> {agent.name}</p>
                                        <p><strong>Email:</strong> {agent.email}</p>
                                        {agent.phone && <p><strong>Phone:</strong> {agent.phone}</p>}
                                        {agent.assignedOrders !== undefined && (
                                            <p className="pt-2 border-t border-blue-200">
                                                <strong>Current Assignments:</strong> {agent.assignedOrders} orders
                                            </p>
                                        )}
                                    </div>
                                ) : null;
                            })()}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={loading || !selectedAgentId || agents.length === 0}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                    >
                        {loading ? (
                            <>
                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                Assigning...
                            </>
                        ) : (
                            <>
                                <FiTruck className="mr-2" />
                                Assign Agent
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssignAgentModal;