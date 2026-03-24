// frontend/src/admin/components/AdminReturnRequests.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
    FiPackage, FiClock, FiCheck, FiX, FiTruck,
    FiRefreshCw, FiFilter, FiSearch, FiEye, FiAlertCircle, FiDollarSign, FiInfo, FiTag
} from 'react-icons/fi';
import Modal from '../../components/Modal';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const AdminReturnRequests = () => {
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedReturn, setSelectedReturn] = useState(null);
    const [remarks, setRemarks] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [actionType, setActionType] = useState('');
    const [reusable, setReusable] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');

    const getAuthHeaders = () => {
        const sessionData = localStorage.getItem('adminSession');
        if (sessionData) {
            try {
                const { token } = JSON.parse(sessionData);
                return { 'Authorization': `Bearer ${token}` };
            } catch (err) {
                return {};
            }
        }
        return {};
    };

    const fetchReturns = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${API_BASE_URL}/api/returns/admin/all-combined`,
                { headers: getAuthHeaders() }
            );
            if (response.data.success) {
                setReturns(response.data.returns);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Failed to load return requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReturns();
    }, []);

    const handleUpdateStatus = async () => {
        try {
            let status = '';
            if (actionType === 'approve') status = 'approved';
            if (actionType === 'reject') status = 'rejected';
            if (actionType === 'receive') status = 'received';
            if (actionType === 'refund') status = 'refunded';

            // Use different endpoint based on return type
            const isLegacy = selectedReturn.type === 'legacy';
            const url = isLegacy
                ? `${API_BASE_URL}/api/returns/legacy/${selectedReturn._id}/status`
                : `${API_BASE_URL}/api/returns/${selectedReturn._id}/status`;

            const response = await axios.patch(
                url,
                { status, adminRemarks: remarks, reusable },
                { headers: getAuthHeaders() }
            );

            if (response.data.success) {
                toast.success(`Return request ${status} successfully`);
                setIsModalOpen(false);
                setRemarks('');
                fetchReturns();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            requested: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            approved: 'bg-blue-100 text-blue-700 border-blue-200',
            rejected: 'bg-red-100 text-red-700 border-red-200',
            'picked-up': 'bg-purple-100 text-purple-700 border-purple-200',
            received: 'bg-indigo-100 text-indigo-700 border-indigo-200',
            refunded: 'bg-green-100 text-green-700 border-green-200',
        };
        return <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${styles[status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>{status}</span>;
    };

    const getTypeBadge = (type) => {
        return type === 'legacy'
            ? <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-orange-50 text-orange-600 border border-orange-200">Legacy</span>
            : <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-cyan-50 text-cyan-600 border border-cyan-200">SubOrder</span>;
    };

    // Filter returns by status
    const filteredReturns = statusFilter === 'all'
        ? returns
        : returns.filter(r => r.status === statusFilter);

    // Stats
    const stats = {
        total: returns.length,
        requested: returns.filter(r => r.status === 'requested').length,
        approved: returns.filter(r => r.status === 'approved').length,
        rejected: returns.filter(r => r.status === 'rejected').length,
        refunded: returns.filter(r => r.status === 'refunded').length,
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Return Management</h1>
                    <p className="text-gray-500 mt-1">Review and process customer returns across all vendors</p>
                </div>
                <button
                    onClick={fetchReturns}
                    className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                >
                    <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                {[
                    { label: 'Total', value: stats.total, color: 'bg-gray-50 border-gray-200 text-gray-800' },
                    { label: 'Pending', value: stats.requested, color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
                    { label: 'Approved', value: stats.approved, color: 'bg-blue-50 border-blue-200 text-blue-800' },
                    { label: 'Rejected', value: stats.rejected, color: 'bg-red-50 border-red-200 text-red-800' },
                    { label: 'Refunded', value: stats.refunded, color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
                ].map(stat => (
                    <div key={stat.label} className={`p-4 rounded-2xl border ${stat.color}`}>
                        <p className="text-xs font-bold uppercase tracking-widest opacity-60">{stat.label}</p>
                        <p className="text-2xl font-black mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {['all', 'requested', 'approved', 'rejected', 'received', 'refunded'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setStatusFilter(tab)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${statusFilter === tab
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)} {tab !== 'all' ? `(${returns.filter(r => r.status === tab).length})` : `(${returns.length})`}
                    </button>
                ))}
            </div>

            {filteredReturns.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                    <FiPackage className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900">No Return Requests</h3>
                    <p className="text-gray-500">
                        {statusFilter === 'all'
                            ? 'New return requests will appear here when customers submit them.'
                            : `No ${statusFilter} return requests found.`
                        }
                    </p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {filteredReturns.map((ret) => (
                        <div key={ret._id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex flex-col lg:flex-row justify-between gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                                        <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg font-bold text-sm">{ret.returnId}</span>
                                        {getTypeBadge(ret.type)}
                                        {getStatusBadge(ret.status)}
                                        <span className="text-xs text-gray-400">Requested {new Date(ret.createdAt).toLocaleDateString()}</span>
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Reason: {ret.reason}</h3>
                                    <p className="text-gray-600 mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100 italic">
                                        "{ret.description || 'No additional comments provided'}"
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="border border-gray-100 rounded-2xl p-4">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Customer & Order</p>
                                            <p className="font-bold text-gray-800">{ret.user?.name || 'Unknown'}</p>
                                            <p className="text-sm text-gray-500">{ret.user?.email}</p>
                                            <p className="text-sm text-gray-500">{ret.user?.phone}</p>
                                            <p className="text-xs text-emerald-600 mt-2 font-bold">Order: {ret.orderId}</p>
                                        </div>
                                        <div className="border border-gray-100 rounded-2xl p-4">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Items to Return</p>
                                            {ret.items?.map((item, i) => (
                                                <div key={i} className="flex justify-between text-sm">
                                                    <span className="text-gray-700">{item.name} × {item.quantity}</span>
                                                    <span className="font-bold text-gray-900">₹{item.price * item.quantity}</span>
                                                </div>
                                            ))}
                                            <div className="mt-2 pt-2 border-t border-gray-50 flex justify-between font-bold text-emerald-600">
                                                <span>Total Refund</span>
                                                <span>₹{ret.refundAmount}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:w-72 flex flex-col gap-3">
                                    {ret.images && ret.images.length > 0 && (
                                        <div className="flex gap-2 mb-2">
                                            {ret.images.map((img, i) => (
                                                <img key={i} src={img} className="w-16 h-16 rounded-lg object-cover border border-gray-200" alt="Proof" />
                                            ))}
                                        </div>
                                    )}

                                    {ret.adminRemarks && (
                                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 mb-2">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Admin Remarks</p>
                                            <p className="text-sm text-gray-700 italic">"{ret.adminRemarks}"</p>
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-2 mt-auto">
                                        {ret.status === 'requested' && (
                                            <>
                                                <button
                                                    onClick={() => { setSelectedReturn(ret); setActionType('approve'); setIsModalOpen(true); }}
                                                    className="w-full py-3 bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all"
                                                >
                                                    <FiCheck /> Approve Return
                                                </button>
                                                <button
                                                    onClick={() => { setSelectedReturn(ret); setActionType('reject'); setIsModalOpen(true); }}
                                                    className="w-full py-3 bg-red-50 text-red-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all"
                                                >
                                                    <FiX /> Reject Request
                                                </button>
                                            </>
                                        )}
                                        {ret.status === 'approved' && (
                                            <button
                                                onClick={() => { setSelectedReturn(ret); setActionType('receive'); setIsModalOpen(true); }}
                                                className="w-full py-3 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all"
                                            >
                                                <FiPackage /> Mark as Received
                                            </button>
                                        )}
                                        {(ret.status === 'received' || (ret.type === 'legacy' && ret.status === 'approved')) && (
                                            <button
                                                onClick={() => { setSelectedReturn(ret); setActionType('refund'); setIsModalOpen(true); }}
                                                className="w-full py-3 bg-emerald-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-800 transition-all"
                                            >
                                                <FiDollarSign /> Process Refund
                                            </button>
                                        )}
                                        {(ret.status === 'refunded' || ret.status === 'rejected') && (
                                            <div className="text-center py-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                                {ret.status === 'refunded' ? '✅ Completed' : '❌ Closed'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Action Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`${actionType.charAt(0).toUpperCase() + actionType.slice(1)} Return Request`}
            >
                <div className="p-8">
                    <div className="flex items-center gap-4 mb-6 bg-gray-50 p-4 rounded-3xl">
                        <FiInfo className="text-emerald-600 w-6 h-6" />
                        <p className="text-sm font-bold text-gray-700">
                            Confirm {actionType} for {selectedReturn?.returnId}
                            {selectedReturn?.type === 'legacy' ? ' (Legacy Order)' : ' (SubOrder)'}.
                            This will notify the customer.
                        </p>
                    </div>

                    {actionType === 'receive' && selectedReturn?.type !== 'legacy' && (
                        <div className="mb-6 p-4 bg-blue-50 rounded-3xl border border-blue-100">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={reusable}
                                    onChange={(e) => setReusable(e.target.checked)}
                                    className="w-5 h-5 rounded-md text-emerald-600 focus:ring-emerald-500"
                                />
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-900">Items are Reusable?</span>
                                    <span className="text-xs text-gray-500">Returned items will be added back to stock quantity.</span>
                                </div>
                            </label>
                        </div>
                    )}

                    {actionType === 'refund' && (
                        <div className="mb-6 p-4 bg-emerald-50 rounded-3xl border border-emerald-100">
                            <p className="text-sm text-emerald-800">
                                <strong>Refund Amount:</strong> ₹{selectedReturn?.refundAmount || 0}
                            </p>
                            <p className="text-xs text-emerald-600 mt-1">
                                This is a mock refund. In production, this would trigger a payment gateway refund.
                            </p>
                        </div>
                    )}

                    <div className="mb-8">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Remarks / Response</label>
                        <textarea
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            className="w-full h-32 px-5 py-4 bg-gray-50 border-none rounded-3xl focus:ring-2 focus:ring-emerald-500 transition-all font-semibold"
                            placeholder="Add internal notes or customer message..."
                        />
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-3xl font-black uppercase tracking-widest text-[10px] transition-all hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpdateStatus}
                            className={`flex-1 py-4 rounded-3xl font-black uppercase tracking-widest text-[10px] text-white shadow-lg transition-all ${actionType === 'approve' ? 'bg-emerald-600 hover:shadow-emerald-100 shadow-emerald-50' :
                                    actionType === 'reject' ? 'bg-red-600 hover:shadow-red-100 shadow-red-50' :
                                        actionType === 'receive' ? 'bg-blue-600 shadow-blue-50' :
                                            'bg-emerald-700 shadow-emerald-50'
                                }`}
                        >
                            Confirm {actionType}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AdminReturnRequests;