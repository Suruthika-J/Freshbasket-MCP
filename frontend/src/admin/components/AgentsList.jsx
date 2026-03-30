// admin/src/components/AgentsList.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import AgentOrdersView from './AgentOrdersView';
import { FiAlertTriangle } from 'react-icons/fi';

// Delete Confirm Modal
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, loading, agentName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[60]"
            style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.15)' }}>
            <div className="rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all duration-300"
                style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiAlertTriangle className="text-red-500 w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Agent</h3>
                    <p className="text-gray-500 text-sm mb-6">
                        Are you sure you want to delete agent "{agentName}"? This action cannot be undone.
                    </p>
                    <div className="flex space-x-3">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold shadow-lg shadow-red-200 disabled:opacity-50 flex items-center justify-center"
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                'Delete'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AgentsList = ({ refreshTrigger }) => {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAgent, setSelectedAgent] = useState(null);
    const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
    const [agentToDelete, setAgentToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchAgents = async () => {
        try {
            setLoading(true);
            console.log('📋 Fetching agents from API...');

            const token = localStorage.getItem("token"); // or 'adminSession' if you used that
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/agents`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });


            console.log('✅ Agents fetched:', response.data);

            if (response.data.success) {
                setAgents(response.data.agents);
            }
        } catch (error) {
            console.error('❌ Fetch agents error:', error);
            console.error('❌ Error details:', error.response?.data);
            toast.error('Failed to load agents');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAgents();
    }, [refreshTrigger]);

    const handleStatusToggle = async (agentId, currentStatus) => {
        try {
            const response = await axios.patch(
                `${import.meta.env.VITE_API_URL}/api/agents/${agentId}/status`,
                { isActive: !currentStatus }
            );

            if (response.data.success) {
                toast.success(response.data.message);
                fetchAgents();
            }
        } catch (error) {
            console.error('Update status error:', error);
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const confirmDelete = async () => {
        if (!agentToDelete) return;

        setIsDeleting(true);
        try {
            const response = await axios.delete(
                `${import.meta.env.VITE_API_URL}/api/agents/${agentToDelete._id}`
            );

            if (response.data.success) {
                toast.success('Agent deleted successfully');
                fetchAgents();
            }
        } catch (error) {
            console.error('Delete agent error:', error);
            toast.error(error.response?.data?.message || 'Failed to delete agent');
        } finally {
            setIsDeleting(false);
            setAgentToDelete(null);
        }
    };



    const handleViewOrders = (agent) => {
        setSelectedAgent(agent);
        setIsOrdersModalOpen(true);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <i className="fas fa-spinner fa-spin text-4xl text-green-600"></i>
            </div>
        );
    }

    if (agents.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <i className="fas fa-users text-6xl text-gray-300 mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No Delivery Agents Yet
                </h3>
                <p className="text-gray-500">
                    Add your first delivery agent to start managing deliveries
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white rounded-lg shadow-md">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Delivery Agents</h2>
                    <button
                        onClick={fetchAgents}
                        className="px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition"
                    >
                        <i className="fas fa-sync-alt mr-2"></i>
                        Refresh
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Agent
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Contact
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Joined
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Last Login
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {agents.map((agent) => (
                                <tr key={agent._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                                                <i className="fas fa-user text-green-600"></i>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {agent.name}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    ID: {agent._id.substring(0, 8)}...
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">
                                            <i className="fas fa-envelope text-gray-400 mr-2"></i>
                                            {agent.email}
                                        </div>
                                        {agent.phone && (
                                            <div className="text-sm text-gray-500">
                                                <i className="fas fa-phone text-gray-400 mr-2"></i>
                                                {agent.phone}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${agent.isActive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}
                                        >
                                            <span
                                                className={`w-2 h-2 rounded-full mr-1.5 ${agent.isActive ? 'bg-green-400' : 'bg-red-400'
                                                    }`}
                                            ></span>
                                            {agent.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {formatDate(agent.createdAt)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {agent.lastLogin ? formatDate(agent.lastLogin) : 'Never'}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium space-x-2">
                                        {/* View Orders Button */}
                                        <button
                                            onClick={() => handleViewOrders(agent)}
                                            className="px-3 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                                            title="View Orders"
                                        >
                                            <i className="fas fa-eye mr-1"></i>
                                            View Orders
                                        </button>
                                        <button
                                            onClick={() => handleStatusToggle(agent._id, agent.isActive)}
                                            className={`px-3 py-1 rounded ${agent.isActive
                                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                }`}
                                            title={agent.isActive ? 'Deactivate' : 'Activate'}
                                        >
                                            <i className={`fas fa-${agent.isActive ? 'pause' : 'play'} mr-1`}></i>
                                            {agent.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button
                                            onClick={() => setAgentToDelete(agent)}
                                            className="px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                                            title="Delete Agent"
                                        >
                                            <i className="fas fa-trash mr-1"></i>
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 text-sm text-gray-600 border-t border-gray-200">
                    Total Agents: {agents.length}
                </div>
            </div>

            {/* Agent Orders Modal */}
            <AgentOrdersView
                isOpen={isOrdersModalOpen}
                onClose={() => setIsOrdersModalOpen(false)}
                agentId={selectedAgent?._id}
                agentName={selectedAgent?.name}
            />

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={!!agentToDelete}
                onClose={() => setAgentToDelete(null)}
                onConfirm={confirmDelete}
                loading={isDeleting}
                agentName={agentToDelete?.name}
            />
        </>
    );
};

export default AgentsList;