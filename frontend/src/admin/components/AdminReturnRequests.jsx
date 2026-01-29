// ============================================
// FILE: frontend/src/admin/components/AdminReturnRequests.jsx
// Path: frontend/src/admin/components/AdminReturnRequests.jsx
// ============================================

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    FiPackage, FiClock, FiCheck, FiX, FiTruck, 
    FiRefreshCw, FiFilter, FiSearch, FiEye, FiAlertCircle
} from 'react-icons/fi';

const AdminReturnRequests = () => {
    const [returnRequests, setReturnRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [adminResponse, setAdminResponse] = useState('');

    const getAuthHeaders = () => {
        const sessionData = localStorage.getItem('adminSession');
        if (sessionData) {
            try {
                const { token } = JSON.parse(sessionData);
                return {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };
            } catch (err) {
                console.error('Error parsing admin session:', err);
                return {};
            }
        }
        return {};
    };

    const fetchReturnRequests = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                'http://localhost:4000/api/returns/admin/all',
                { headers: getAuthHeaders() }
            );

            if (response.data.success) {
                setReturnRequests(response.data.returnRequests);
                setStats(response.data.stats);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            if (error.response?.status === 401) {
                localStorage.removeItem('adminSession');
                window.location.href = '/admin/login';
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReturnRequests();
    }, []);

    useEffect(() => {
        let result = [...returnRequests];

        // Filter by status
        if (statusFilter !== 'All') {
            result = result.filter(req => req.status === statusFilter);
        }

        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(req => 
                req.orderId?.orderId?.toLowerCase().includes(term) ||
                req.orderId?.customer?.name?.toLowerCase().includes(term) ||
                req.reason?.toLowerCase().includes(term)
            );
        }

        setFilteredRequests(result);
    }, [returnRequests, statusFilter, searchTerm]);

    const handleStatusUpdate = async (id, newStatus) => {
        setActionLoading(true);
        try {
            const response = await axios.put(
                `http://localhost:4000/api/returns/admin/${id}`,
                { 
                    status: newStatus,
                    adminResponse: adminResponse || undefined
                },
                { headers: getAuthHeaders() }
            );

            if (response.data.success) {
                await fetchReturnRequests();
                setIsModalOpen(false);
                setSelectedRequest(null);
                setAdminResponse('');
            }
        } catch (error) {
            console.error('Update error:', error);
            alert(error.response?.data?.message || 'Failed to update status');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
            'Approved': 'bg-green-100 text-green-800 border-green-300',
            'Rejected': 'bg-red-100 text-red-800 border-red-300',
            'Collected': 'bg-blue-100 text-blue-800 border-blue-300',
            'Returned': 'bg-purple-100 text-purple-800 border-purple-300'
        };
        return badges[status] || 'bg-gray-100 text-gray-800 border-gray-300';
    };

    const getStatusIcon = (status) => {
        const icons = {
            'Pending': <FiClock className="inline mr-1" />,
            'Approved': <FiCheck className="inline mr-1" />,
            'Rejected': <FiX className="inline mr-1" />,
            'Collected': <FiTruck className="inline mr-1" />,
            'Returned': <FiPackage className="inline mr-1" />
        };
        return icons[status] || <FiAlertCircle className="inline mr-1" />;
    };

    const statsCards = [
        { 
            label: 'Total', 
            value: stats.total || 0, 
            color: 'blue',
            icon: FiPackage 
        },
        { 
            label: 'Pending', 
            value: stats.pending || 0, 
            color: 'yellow',
            icon: FiClock 
        },
        { 
            label: 'Approved', 
            value: stats.approved || 0, 
            color: 'green',
            icon: FiCheck 
        },
        { 
            label: 'Rejected', 
            value: stats.rejected || 0, 
            color: 'red',
            icon: FiX 
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Return Requests
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Manage customer return requests
                            </p>
                        </div>
                        <button
                            onClick={fetchReturnRequests}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {statsCards.map((stat) => {
                            const IconComponent = stat.icon;
                            return (
                                <div
                                    key={stat.label}
                                    className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">
                                                {stat.label}
                                            </p>
                                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                                {stat.value}
                                            </p>
                                        </div>
                                        <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                                            <IconComponent className={`w-6 h-6 text-${stat.color}-600`} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <FiSearch className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by order ID, customer, or reason..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <FiFilter className="text-gray-400" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="All">All Status</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Rejected">Rejected</option>
                                    <option value="Collected">Collected</option>
                                    <option value="Returned">Returned</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Return Requests Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Order Details
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Reason
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Requested
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredRequests.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center">
                                            <FiPackage className="mx-auto text-gray-400 text-4xl mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-1">
                                                No return requests found
                                            </h3>
                                            <p className="text-gray-500">
                                                {searchTerm || statusFilter !== 'All'
                                                    ? 'Try adjusting your filters'
                                                    : 'Return requests will appear here'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRequests.map((request) => (
                                        <tr key={request._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">
                                                    {request.orderId?.orderId}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {request.orderId?.items?.length || 0} items
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">
                                                    {request.orderId?.customer?.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {request.orderId?.customer?.phone}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 max-w-xs truncate">
                                                    {request.reason}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">
                                                    ₹{request.refundAmount?.toFixed(2)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(request.status)}`}>
                                                    {getStatusIcon(request.status)}
                                                    {request.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">
                                                    {new Date(request.requestedAt).toLocaleDateString()}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {request.daysOld} days ago
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => {
                                                        setSelectedRequest(request);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                                                >
                                                    <FiEye size={14} />
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {isModalOpen && selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="bg-gray-50 px-6 py-4 border-b">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Return Request Details
                                </h2>
                                <button
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setSelectedRequest(null);
                                        setAdminResponse('');
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <FiX size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="overflow-y-auto flex-1 p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Order Information</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Order ID:</span>
                                            <span className="font-medium">{selectedRequest.orderId?.orderId}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Customer:</span>
                                            <span className="font-medium">{selectedRequest.orderId?.customer?.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Total Amount:</span>
                                            <span className="font-medium">₹{selectedRequest.refundAmount?.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Payment Method:</span>
                                            <span className="font-medium">{selectedRequest.orderId?.paymentMethod}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Return Status</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Current Status:</span>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(selectedRequest.status)}`}>
                                                {selectedRequest.status}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Requested:</span>
                                            <span className="font-medium">
                                                {new Date(selectedRequest.requestedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {selectedRequest.approvedAt && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Approved:</span>
                                                <span className="font-medium">
                                                    {new Date(selectedRequest.approvedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-900 mb-3">Return Reason</h3>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-gray-700">{selectedRequest.reason}</p>
                                </div>
                            </div>

                            {selectedRequest.status === 'Pending' && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Admin Response (Optional)
                                    </label>
                                    <textarea
                                        value={adminResponse}
                                        onChange={(e) => setAdminResponse(e.target.value)}
                                        placeholder="Add a note or reason for your decision..."
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                                        rows="3"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="bg-gray-50 px-6 py-4 border-t flex justify-end gap-3">
                            {selectedRequest.status === 'Pending' && (
                                <>
                                    <button
                                        onClick={() => handleStatusUpdate(selectedRequest._id, 'Rejected')}
                                        disabled={actionLoading}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(selectedRequest._id, 'Approved')}
                                        disabled={actionLoading}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
                                    >
                                        Approve
                                    </button>
                                </>
                            )}
                            {selectedRequest.status === 'Approved' && (
                                <button
                                    onClick={() => handleStatusUpdate(selectedRequest._id, 'Collected')}
                                    disabled={actionLoading}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                                >
                                    Mark as Collected
                                </button>
                            )}
                            {selectedRequest.status === 'Collected' && (
                                <button
                                    onClick={() => handleStatusUpdate(selectedRequest._id, 'Returned')}
                                    disabled={actionLoading}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50"
                                >
                                    Complete Return
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setSelectedRequest(null);
                                    setAdminResponse('');
                                }}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReturnRequests;