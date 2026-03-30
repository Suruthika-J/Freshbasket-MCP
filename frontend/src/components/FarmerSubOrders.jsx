// frontend/src/components/FarmerSubOrders.jsx
// Component for farmers to view and manage their sub-orders

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiPackage, FiTruck, FiUser, FiClock, FiCheck, FiCreditCard } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const FarmerSubOrders = () => {
    const { t } = useTranslation('farmer');
    const [subOrders, setSubOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchSubOrders();
    }, []);

    const fetchSubOrders = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(`${API_BASE_URL}/api/orders/farmer`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setSubOrders(response.data.subOrders);
            }
        } catch (error) {
            console.error('Error fetching sub-orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (subOrderId, status) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.patch(`${API_BASE_URL}/api/sub-orders/${subOrderId}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                toast.success('Order status updated successfully');
                fetchSubOrders();
            }
        } catch (error) {
            toast.error('Failed to update order status');
        }
    };

    const updatePaymentStatus = async (subOrderId, paymentStatus) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.patch(`${API_BASE_URL}/api/sub-orders/${subOrderId}/payment-status`, { paymentStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                toast.success(`Payment status updated to ${paymentStatus}`);
                fetchSubOrders();
            }
        } catch (error) {
            toast.error('Failed to update payment status');
        }
    };

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

    const filteredOrders = filter === 'all' ? subOrders : subOrders.filter(o => o.orderStatus === filter);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-3xl border border-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
                <p className="text-gray-500 font-medium">{t('common.loading')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-gray-900">{t('orders.title')}</h2>
                    <p className="text-gray-500 text-sm font-medium">{t('orders.subtitle')}</p>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {['all', 'pending', 'confirmed', 'preparing', 'ready'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-5 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap shadow-sm ${filter === status
                                ? 'bg-green-600 text-white'
                                : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
                                }`}
                        >
                            {t(`orders.statuses.${status}`)}
                            <span className={`ml-2 px-2 py-0.5 rounded-lg text-[10px] ${filter === status ? 'bg-white/20' : 'bg-gray-100'}`}>
                                {status === 'all' ? subOrders.length : subOrders.filter(o => o.orderStatus === status).length}
                            </span>
                        </button>
                    ))}
                </div>
            </header>

            {filteredOrders.length === 0 ? (
                <div className="bg-white rounded-[2rem] p-20 text-center border border-gray-100 shadow-sm">
                    <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FiPackage className="text-gray-300" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{t('orders.noOrders')}</h3>
                    <p className="text-gray-500 text-sm max-w-xs mx-auto leading-relaxed">
                        {filter === 'all' ? t('orders.noOrdersDetail') : t('orders.noOrdersDetail')}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {filteredOrders.map((subOrder) => {
                        const badge = getStatusBadge(subOrder.orderStatus);
                        return (
                            <div key={subOrder._id} className="bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100 group">
                                <div className="px-8 py-5 bg-gray-900 text-white flex justify-between items-center flex-wrap gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white/10 p-2.5 rounded-xl">
                                            <FiPackage size={20} className="text-green-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-gray-400 leading-none mb-1">{t('orders.subOrderId')}</p>
                                            <p className="text-sm font-mono font-bold text-green-400 leading-none">{subOrder.subOrderId}</p>
                                        </div>
                                    </div>
                                    <div className="hidden md:block h-8 w-px bg-white/10"></div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-gray-400 leading-none mb-1">{t('orders.parentOrder')}</p>
                                        <p className="text-sm font-bold text-gray-200 leading-none">{subOrder.parentOrderId}</p>
                                    </div>
                                    <div className="hidden md:block h-8 w-px bg-white/10"></div>
                                    <div className="text-right">
                                        <p className="text-[10px] uppercase font-bold text-gray-400 leading-none mb-1">{t('orders.totalEarnt')}</p>
                                        <p className="text-xl font-black text-white leading-none">₹{subOrder.subTotal?.toFixed(2)}</p>
                                    </div>
                                </div>

                                <div className="p-8">
                                    <div className="flex flex-col lg:flex-row gap-8">
                                        <div className="flex-1 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border"
                                                        style={{ backgroundColor: badge.bg, color: badge.color, borderColor: badge.border }}
                                                    >
                                                        {t(`orders.statuses.${subOrder.orderStatus}`)}
                                                    </span>
                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-[10px] font-bold text-gray-500 border border-gray-100">
                                                        <FiTruck size={14} className="text-blue-500" />
                                                        {subOrder.deliveryOption === 'SELF_PICKUP' ? 'Self Pickup' : 'Home Delivery'}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                                    <FiClock size={14} />
                                                    {new Date(subOrder.createdAt).toLocaleDateString('en-IN')}
                                                </div>
                                            </div>

                                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    {t('orders.items')} ({subOrder.items?.length})
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {subOrder.items?.map((item, idx) => (
                                                        <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center transition-all hover:border-green-200">
                                                            <div>
                                                                <p className="font-bold text-gray-800 text-sm">{item.name}</p>
                                                                <p className="text-[10px] font-bold text-gray-400">
                                                                    {item.quantity} units × ₹{item.price}
                                                                </p>
                                                            </div>
                                                            <p className="font-black text-gray-900 text-sm">₹{item.subtotal?.toFixed(2)}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="w-full lg:w-80 space-y-4">
                                            <div className="bg-green-50/50 rounded-2xl p-6 border border-green-100">
                                                <h4 className="text-xs font-black text-green-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <FiUser size={14} /> {t('orders.customerInfo')}
                                                </h4>
                                                <div className="space-y-3">
                                                    <div>
                                                        <p className="font-black text-gray-800 leading-tight">{subOrder.customerName}</p>
                                                        <p className="text-xs font-bold text-green-600 font-mono">{subOrder.customerPhone}</p>
                                                    </div>
                                                    <div className="pt-3 border-t border-green-200/50">
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t('orders.address')}</p>
                                                        <p className="text-xs text-gray-600 font-medium leading-relaxed">{subOrder.customerAddress}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h4 className="text-xs font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2">
                                                        <FiCreditCard size={14} /> Payment Details
                                                    </h4>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${subOrder.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                        {subOrder.paymentStatus}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <p className="text-xs font-bold text-gray-500">{subOrder.paymentMethod || 'N/A'}</p>
                                                    {subOrder.paymentStatus !== 'Paid' && (
                                                        <button
                                                            onClick={() => updatePaymentStatus(subOrder._id, 'Paid')}
                                                            className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-sm"
                                                        >
                                                            Mark Paid
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="pt-2">
                                                {subOrder.orderStatus === 'confirmed' && (
                                                    <button
                                                        onClick={() => updateOrderStatus(subOrder._id, 'preparing')}
                                                        className="w-full px-6 py-4 rounded-xl bg-orange-500 text-white font-black uppercase tracking-widest text-[10px] hover:bg-orange-600 transition-all shadow-lg shadow-orange-100"
                                                    >
                                                        {t('orders.startPreparing')}
                                                    </button>
                                                )}
                                                {subOrder.orderStatus === 'preparing' && (
                                                    <button
                                                        onClick={() => updateOrderStatus(subOrder._id, 'ready')}
                                                        className="w-full px-6 py-4 rounded-xl bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                                                    >
                                                        {t('orders.markAsReady')}
                                                    </button>
                                                )}
                                                {subOrder.orderStatus === 'ready' && subOrder.deliveryOption === 'SELF_PICKUP' && (
                                                    <button
                                                        onClick={() => updateOrderStatus(subOrder._id, 'delivered')}
                                                        className="w-full px-6 py-4 rounded-xl bg-green-600 text-white font-black uppercase tracking-widest text-[10px] hover:bg-green-700 transition-all shadow-lg shadow-green-100"
                                                    >
                                                        {t('orders.confirmHandover')}
                                                    </button>
                                                )}
                                                {['delivered', 'cancelled'].includes(subOrder.orderStatus) && (
                                                    <div className="text-center py-4 rounded-xl border-2 border-dashed font-black uppercase text-[10px] tracking-widest text-gray-300">
                                                        {t(`orders.statuses.${subOrder.orderStatus}`)} {t('orders.order')}
                                                    </div>
                                                )}
                                                {subOrder.orderStatus === 'ready' && subOrder.deliveryOption === 'DELIVERY_AGENT' && (
                                                    <div className="bg-blue-50 text-blue-700 p-4 rounded-2xl text-center border border-blue-100">
                                                        <p className="text-[10px] font-black uppercase tracking-widest mb-1">{t('orders.awaitingAgent')}</p>
                                                        <p className="text-[10px] font-bold opacity-70">{t('orders.waitingRef')}</p>
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
