// frontend/src/components/FarmerReturnManagement.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
    FiRefreshCw, FiCheckCircle, FiXCircle, FiPackage,
    FiMessageSquare, FiInfo, FiTruck, FiDollarSign
} from 'react-icons/fi';
import Modal from './Modal';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const FarmerReturnManagement = () => {
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReturn, setSelectedReturn] = useState(null);
    const [remarks, setRemarks] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [actionType, setActionType] = useState(''); // approve, reject, receive, refund
    const [reusable, setReusable] = useState(false);

    useEffect(() => {
        fetchReturns();
    }, []);

    const fetchReturns = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(`${API_BASE_URL}/api/returns/admin/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setReturns(response.data.returns);
            }
        } catch (error) {
            console.error('Error fetching returns:', error);
            toast.error('Failed to load return requests');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async () => {
        try {
            const token = localStorage.getItem('authToken');
            let status = '';
            if (actionType === 'approve') status = 'approved';
            if (actionType === 'reject') status = 'rejected';
            if (actionType === 'receive') status = 'received';
            if (actionType === 'refund') status = 'refunded';

            const response = await axios.patch(
                `${API_BASE_URL}/api/returns/${selectedReturn._id}/status`,
                { status, adminRemarks: remarks, reusable },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                toast.success(`Return request ${status} successfully`);
                setIsModalOpen(false);
                setRemarks('');
                fetchReturns();
            }
        } catch (error) {
            toast.error('Failed to update return status');
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            requested: 'bg-yellow-100 text-yellow-700',
            approved: 'bg-blue-100 text-blue-700',
            rejected: 'bg-red-100 text-red-700',
            'picked-up': 'bg-purple-100 text-purple-700',
            received: 'bg-indigo-100 text-indigo-700',
            refunded: 'bg-green-100 text-green-700',
        };
        return <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${styles[status] || 'bg-gray-100 text-gray-700'}`}>{status}</span>;
    };

    if (loading) return <div className="p-20 text-center text-gray-400">Loading returns...</div>;

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Return Requests</h2>
                <button onClick={fetchReturns} className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all">
                    <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {returns.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <FiRefreshCw className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No return requests found</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {returns.map((ret) => (
                        <div key={ret._id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-sm font-black text-emerald-600">{ret.returnId}</span>
                                        {getStatusBadge(ret.status)}
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">Reason: {ret.overallReason}</h3>
                                    <p className="text-sm text-gray-500 mb-4">{ret.description || 'No description provided'}</p>

                                    <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Items being returned</p>
                                        {ret.items.map((item, i) => (
                                            <div key={i} className="flex justify-between text-sm font-bold text-gray-700">
                                                <span>{item.name} × {item.quantity}</span>
                                                <span>₹{item.price * item.quantity}</span>
                                            </div>
                                        ))}
                                        <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between font-black text-emerald-600">
                                            <span>Total Refund</span>
                                            <span>₹{ret.refundDetails.amount}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="md:w-64 space-y-3">
                                    <div className="bg-green-50 rounded-2xl p-4 text-xs">
                                        <p className="font-black text-green-800 mb-1">Customer Details</p>
                                        <p className="text-green-700">{ret.user?.name}</p>
                                        <p className="text-green-600">{ret.user?.phone}</p>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        {ret.status === 'requested' && (
                                            <>
                                                <button
                                                    onClick={() => { setSelectedReturn(ret); setActionType('approve'); setIsModalOpen(true); }}
                                                    className="w-full py-3 bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all"
                                                >
                                                    <FiCheckCircle /> Approve
                                                </button>
                                                <button
                                                    onClick={() => { setSelectedReturn(ret); setActionType('reject'); setIsModalOpen(true); }}
                                                    className="w-full py-3 bg-red-50 text-red-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all"
                                                >
                                                    <FiXCircle /> Reject
                                                </button>
                                            </>
                                        )}
                                        {ret.status === 'approved' && (
                                            <button
                                                onClick={() => { setSelectedReturn(ret); setActionType('receive'); setIsModalOpen(true); }}
                                                className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all"
                                            >
                                                <FiPackage /> Mark Received
                                            </button>
                                        )}
                                        {ret.status === 'received' && (
                                            <button
                                                onClick={() => { setSelectedReturn(ret); setActionType('refund'); setIsModalOpen(true); }}
                                                className="w-full py-3 bg-green-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-all"
                                            >
                                                <FiDollarSign /> Process Refund
                                            </button>
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
                        <p className="text-sm font-bold text-gray-700">You are about to {actionType} return {selectedReturn?.returnId}.</p>
                    </div>

                    {actionType === 'receive' && (
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
                                    <span className="text-xs text-gray-500">If yes, stock quantity will be added back automatically.</span>
                                </div>
                            </label>
                        </div>
                    )}

                    <div className="mb-8">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Remarks / Note to Customer</label>
                        <textarea
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            className="w-full h-32 px-5 py-4 bg-gray-50 border-none rounded-3xl focus:ring-2 focus:ring-emerald-500 transition-all font-semibold"
                            placeholder="Explain the reason for this action..."
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
                                        actionType === 'receive' ? 'bg-indigo-600 shadow-indigo-50' :
                                            'bg-green-600 shadow-green-50'
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

export default FarmerReturnManagement;
