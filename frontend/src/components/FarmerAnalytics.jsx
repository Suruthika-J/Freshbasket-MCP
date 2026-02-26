// frontend/src/components/FarmerAnalytics.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    FiTrendingUp, FiTrendingDown, FiDollarSign,
    FiShoppingBag, FiPackage, FiCheckCircle
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const STATUS_COLORS = {
    'pending': '#FFC107',
    'confirmed': '#2196F3',
    'preparing': '#9C27B0',
    'ready': '#FF9800',
    'delivered': '#4CAF50',
    'cancelled': '#F44336'
};

const FarmerAnalytics = () => {
    const { t } = useTranslation('farmer');
    const [summary, setSummary] = useState(null);
    const [salesData, setSalesData] = useState([]);
    const [productData, setProductData] = useState({ topSelling: [], inventoryStatus: [] });
    const [statusData, setStatusData] = useState([]);
    const [filter, setFilter] = useState('month');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllAnalytics();
    }, [filter]);

    const fetchAllAnalytics = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const [summaryRes, salesRes, productsRes, statusRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/farmer/analytics/summary?filter=${filter}`, config),
                axios.get(`${API_BASE_URL}/api/farmer/analytics/sales?filter=${filter}`, config),
                axios.get(`${API_BASE_URL}/api/farmer/analytics/products`, config),
                axios.get(`${API_BASE_URL}/api/farmer/analytics/order-status`, config)
            ]);

            setSummary(summaryRes.data.summary);
            setSalesData(salesRes.data.chartData);
            setProductData({
                topSelling: productsRes.data.topSelling,
                inventoryStatus: productsRes.data.inventoryStatus
            });
            setStatusData(statusRes.data.statusDistribution.map(item => ({
                name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
                value: item.count,
                color: STATUS_COLORS[item._id] || '#999'
            })));

        } catch (error) {
            console.error('Error fetching analytics:', error);
            toast.error('Failed to load some analytics data');
        } finally {
            setLoading(false);
        }
    };

    const SummaryCard = ({ title, value, change, icon: Icon, prefix = '' }) => (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{title}</p>
                    <h3 className="text-2xl font-black text-gray-900">{prefix}{value?.toLocaleString()}</h3>
                    {change !== undefined && (
                        <div className={`flex items-center mt-2 text-xs font-bold ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {change >= 0 ? <FiTrendingUp className="mr-1" /> : <FiTrendingDown className="mr-1" />}
                            {Math.abs(change)}% vs prev. period
                        </div>
                    )}
                </div>
                <div className="bg-green-50 rounded-2xl p-4 transform group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-green-600" />
                </div>
            </div>
        </div>
    );

    if (loading && !summary) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Filter Section */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-gray-900">{t('analytics.title')}</h2>
                <div className="flex bg-gray-100 p-1 rounded-2xl">
                    {['today', 'week', 'month'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${filter === f
                                ? 'bg-white shadow-sm text-green-600'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {t(`analytics.filters.${f}`)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard
                    title={t('analytics.revenue')}
                    value={summary?.totalRevenue.value}
                    change={summary?.totalRevenue.change}
                    icon={FiDollarSign}
                    prefix="₹"
                />
                <SummaryCard
                    title={t('analytics.orders')}
                    value={summary?.totalOrders.value}
                    change={summary?.totalOrders.change}
                    icon={FiShoppingBag}
                />
                <SummaryCard
                    title={t('analytics.completed')}
                    value={summary?.completedOrders.value}
                    icon={FiCheckCircle}
                />
                <SummaryCard
                    title={t('analytics.listed')}
                    value={summary?.totalProducts.value}
                    icon={FiPackage}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-black text-gray-900 mb-8 flex items-center gap-2">
                        <span className="bg-green-100 p-2 rounded-lg"><FiTrendingUp className="text-green-600" /></span>
                        {t('analytics.revenueTrend')}
                    </h3>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={salesData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                <YAxis yAxisId="left" tick={{ fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 'bold' }} />
                                <Bar yAxisId="left" dataKey="revenue" fill="#10B981" name={t('analytics.revenue')} radius={[10, 10, 0, 0]} barSize={20} />
                                <Bar yAxisId="right" dataKey="orders" fill="#3B82F6" name={t('analytics.orders')} radius={[10, 10, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-black text-gray-900 mb-8">{t('analytics.statusBreakdown')}</h3>
                    <div className="h-[300px] w-full">
                        {statusData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={statusData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                                        {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                    </Pie>
                                    <Tooltip />
                                    <Legend iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 italic text-sm">{t('analytics.noSales')}</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tables Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-50">
                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter">{t('analytics.topSelling')}</h3>
                    </div>
                    <div className="overflow-x-auto p-4">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                                    <th className="pb-4 px-4">{t('dashboard.tabs.myProducts')}</th>
                                    <th className="pb-4 px-4">{t('analytics.unitSold')}</th>
                                    <th className="pb-4 px-4">{t('analytics.revenue')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {productData.topSelling.map((product) => (
                                    <tr key={product._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-4 font-bold text-gray-800">{product.name}</td>
                                        <td className="py-4 px-4 font-semibold text-gray-600">{product.totalSold}</td>
                                        <td className="py-4 px-4 font-black text-green-600">₹{product.totalRevenue.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-50">
                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter">{t('analytics.inventoryAlerts')}</h3>
                    </div>
                    <div className="overflow-x-auto p-4">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                                    <th className="pb-4 px-4">{t('dashboard.tabs.myProducts')}</th>
                                    <th className="pb-4 px-4">{t('analytics.currentStock')}</th>
                                    <th className="pb-4 px-4">{t('analytics.status')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {productData.inventoryStatus.map((product) => (
                                    <tr key={product._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-4 font-bold text-gray-800">{product.name}</td>
                                        <td className="py-4 px-4 font-semibold text-gray-600">{product.stock} {product.unit}</td>
                                        <td className="py-4 px-4">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${product.stock === 0 ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                                                {product.stock === 0 ? t('dashboard.stats.outOfStock') : t('dashboard.stats.lowStock')}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FarmerAnalytics;
