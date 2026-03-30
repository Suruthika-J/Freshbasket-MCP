import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { FiX, FiCalendar, FiDollarSign, FiPackage, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';

const OrderChart = ({ isOpen, onClose, isStandalone = false }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);

  const COLORS = {
    Pending: '#FBBF24',
    Processing: '#3B82F6',
    Shipped: '#8B5CF6',
    Delivered: '#10B981',
    Cancelled: '#6B7280',
    Unpaid: '#EF4444'
  };

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
        return { 'Content-Type': 'application/json' };
      }
    }
    return { 'Content-Type': 'application/json' };
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/orders/stats`, {
        params,
        headers: getAuthHeaders()
      });

      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load order statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStats();
    }
  }, [isOpen]);

  const handleApplyFilter = () => {
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      toast.error('Start date must be before end date');
      return;
    }
    fetchStats();
    setShowDateFilter(false);
  };

  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
    setShowDateFilter(false);
    setTimeout(fetchStats, 100);
  };

  if (!isOpen) return null;

  const chartData = stats ? [
    { name: 'Pending', value: stats.stats.Pending, color: COLORS.Pending },
    { name: 'Processing', value: stats.stats.Processing, color: COLORS.Processing },
    { name: 'Shipped', value: stats.stats.Shipped, color: COLORS.Shipped },
    { name: 'Delivered', value: stats.stats.Delivered, color: COLORS.Delivered },
    { name: 'Unpaid', value: stats.stats.Unpaid, color: COLORS.Unpaid },
  ].filter(item => item.value > 0) : [];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = stats ? ((data.value / stats.totalOrders) * 100).toFixed(1) : 0;
      return (
        <div className="bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">Count: <span className="font-medium">{data.value}</span></p>
          <p className="text-sm text-gray-600">Percentage: <span className="font-medium">{percentage}%</span></p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 30;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#374151"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm font-medium"
      >
        {`${name}: ${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  const dashboardContent = (
    <div className={`p-6 ${isStandalone ? '' : 'overflow-y-auto max-h-[calc(90vh-80px)]'}`}>
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setShowDateFilter(!showDateFilter)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          <FiCalendar className="mr-2" />
          {showDateFilter ? 'Hide Date Filter' : 'Filter by Date'}
        </button>
      </div>

      {showDateFilter && (
        <div className="bg-blue-50/50 p-4 rounded-2xl mb-6 border border-blue-100 animate-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">From Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">To Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleApplyFilter} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm">Apply</button>
            <button onClick={handleClearFilter} className="px-6 py-2 bg-gray-200 text-gray-600 rounded-xl font-bold text-sm">Clear</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/20"><FiDollarSign /></div>
                <div>
                  <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">Total Revenue</p>
                  <p className="text-2xl font-black text-gray-900">₹{stats.totalRevenue?.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-blue-500/20"><FiPackage /></div>
                <div>
                  <p className="text-xs font-black text-blue-600 uppercase tracking-widest">Total Orders</p>
                  <p className="text-2xl font-black text-gray-900">{stats.totalOrders}</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 p-6 rounded-[2rem] border border-purple-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-purple-500 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-purple-500/20"><FiCheckCircle /></div>
                <div>
                  <p className="text-xs font-black text-purple-600 uppercase tracking-widest">Delivered</p>
                  <p className="text-2xl font-black text-gray-900">{stats.stats.Delivered}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm h-[450px]">
              <h3 className="text-lg font-black text-gray-900 mb-6">Order Status Distribution</h3>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" labelLine={true} label={CustomLabel} outerRadius={100} dataKey="value">
                    {chartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {Object.entries(stats.stats).map(([label, value]) => (
                <div key={label} className="bg-gray-50 p-6 rounded-3xl border border-gray-100 hover:bg-white hover:shadow-lg transition-all">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{label}</p>
                  <p className="text-2xl font-black text-gray-900">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-20 text-gray-400 font-bold">No statistical data available.</div>
      )}
    </div>
  );

  if (isStandalone) {
    return <div className="bg-white rounded-b-[2.5rem] overflow-hidden">{dashboardContent}</div>;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-100">
        <div className="bg-slate-900 px-10 py-8 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black tracking-tight italic">Analytics Insights</h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Platform Performance Intelligence</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-2xl transition-all"><FiX size={24} /></button>
        </div>
        {dashboardContent}
      </div>
    </div>
  );
};

export default OrderChart;