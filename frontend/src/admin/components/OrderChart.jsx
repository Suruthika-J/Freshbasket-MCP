// admin/src/components/OrderChart.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { FiX, FiCalendar, FiDollarSign, FiPackage, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';

const OrderChart = ({ isOpen, onClose }) => {
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

  // ✅ FIX: Get auth headers from localStorage
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
        return {
          'Content-Type': 'application/json'
        };
      }
    }
    return {
      'Content-Type': 'application/json'
    };
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      console.log('📊 Fetching stats with params:', params);

      // ✅ FIX: Include auth headers
      const { data } = await axios.get('http://localhost:4000/api/orders/stats', { 
        params,
        headers: getAuthHeaders()
      });
      
      setStats(data);
      console.log('✅ Stats received:', data);
      
      toast.success('Statistics loaded successfully!', {
        position: 'top-right',
        autoClose: 2000,
      });
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
      
      // Better error handling
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please login again.', {
          position: 'top-right',
          autoClose: 3000,
        });
        localStorage.removeItem('adminSession');
        window.location.href = '/admin/login';
      } else if (error.response?.status === 404) {
        toast.error('Statistics endpoint not found. Please check backend.', {
          position: 'top-right',
          autoClose: 3000,
        });
      } else {
        toast.error(error.response?.data?.message || 'Failed to load order statistics', {
          position: 'top-right',
          autoClose: 3000,
        });
      }
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
      toast.error('Start date must be before end date', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }
    fetchStats();
    setShowDateFilter(false);
    toast.success('Filter applied successfully!', {
      position: 'top-right',
      autoClose: 2000,
    });
  };

  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
    setShowDateFilter(false);
    setTimeout(fetchStats, 100);
    toast.info('Filter cleared - showing all orders', {
      position: 'top-right',
      autoClose: 2000,
    });
  };

  if (!isOpen) return null;

  // Prepare chart data
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
          <p className="text-sm text-gray-600">
            Count: <span className="font-medium">{data.value}</span>
          </p>
          <p className="text-sm text-gray-600">
            Percentage: <span className="font-medium">{percentage}%</span>
          </p>
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Order Statistics Dashboard</h2>
              <p className="text-blue-100 mt-1">Visual interpretation of your order data</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-blue-800 rounded-lg p-2 transition-colors"
            >
              <FiX size={24} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="p-6">
            {/* Date Filter Toggle Button */}
            <div className="mb-6 flex justify-end">
              <button
                onClick={() => setShowDateFilter(!showDateFilter)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
              >
                <FiCalendar className="mr-2" />
                {showDateFilter ? 'Hide Date Filter' : 'View From Date to Date'}
              </button>
            </div>

            {/* Collapsible Date Range Filter */}
            {showDateFilter && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 border border-blue-200 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Select Date Range</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleApplyFilter}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {loading ? 'Loading...' : 'Apply Filter'}
                  </button>
                  <button
                    onClick={handleClearFilter}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Clear Filter
                  </button>
                </div>
                {(startDate || endDate) && (
                  <div className="mt-3 p-2 bg-blue-100 rounded-md">
                    <p className="text-sm text-blue-800 font-medium">
                      📅 Filtering: {startDate || 'All time'} → {endDate || 'Now'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {loading ? (
              <div className="flex flex-col justify-center items-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Loading statistics...</p>
              </div>
            ) : stats ? (
              <>
                {/* Top 3 Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* Total Revenue */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-5 border border-green-200 shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-700 mb-1">Total Revenue</p>
                        <p className="text-3xl font-bold text-green-900 mt-2">
                          ₹{stats.totalRevenue?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                        </p>
                        <p className="text-xs text-green-600 mt-2">
                          {startDate || endDate 
                            ? `📅 ${startDate || 'All'} to ${endDate || 'Now'}` 
                            : '📅 From all paid orders'
                          }
                        </p>
                      </div>
                      <div className="p-3 bg-green-200 rounded-lg">
                        <FiDollarSign className="w-8 h-8 text-green-700" />
                      </div>
                    </div>
                  </div>

                  {/* Total Orders */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border border-blue-200 shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-700 mb-1">Total Orders</p>
                        <p className="text-3xl font-bold text-blue-900 mt-2">
                          {stats.totalOrders}
                        </p>
                        <p className="text-xs text-blue-600 mt-2">
                          {startDate || endDate 
                            ? `📅 ${startDate || 'All'} to ${endDate || 'Now'}` 
                            : '📅 All statuses included'
                          }
                        </p>
                      </div>
                      <div className="p-3 bg-blue-200 rounded-lg">
                        <FiPackage className="w-8 h-8 text-blue-700" />
                      </div>
                    </div>
                  </div>

                  {/* Total Delivered Orders */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-5 border border-purple-200 shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-purple-700 mb-1">Delivered Orders</p>
                        <p className="text-3xl font-bold text-purple-900 mt-2">
                          {stats.totalDeliveredOrders || stats.stats.Delivered}
                        </p>
                        <p className="text-xs text-purple-600 mt-2">
                          {stats.totalOrders > 0 
                            ? `✅ ${((stats.stats.Delivered / stats.totalOrders) * 100).toFixed(1)}% delivery rate` 
                            : '✅ No orders yet'
                          }
                        </p>
                      </div>
                      <div className="p-3 bg-purple-200 rounded-lg">
                        <FiCheckCircle className="w-8 h-8 text-purple-700" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Date Range Info Badge */}
                {(startDate || endDate) && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      <span className="font-semibold">📊 Filtered View:</span> Showing data from{' '}
                      <span className="font-bold">{startDate || 'beginning'}</span> to{' '}
                      <span className="font-bold">{endDate || 'now'}</span>
                    </p>
                  </div>
                )}

                {/* Pie Chart Section */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Order Distribution by Status
                  </h3>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={450}>
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={CustomLabel}
                          outerRadius={130}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          iconType="square"
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-10 text-gray-500">
                      <FiPackage className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                      <p className="text-lg font-medium">No order data available</p>
                      <p className="text-sm">Try adjusting your date range filter</p>
                    </div>
                  )}
                </div>

                {/* Status Breakdown Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {/* Pending */}
                  <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-yellow-400 hover:shadow-md transition-shadow">
                    <p className="text-xs font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.stats.Pending}</p>
                    <p className="text-xs text-gray-500">
                      {stats.totalOrders > 0 ? ((stats.stats.Pending / stats.totalOrders) * 100).toFixed(1) : 0}%
                    </p>
                  </div>

                  {/* Processing */}
                  <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-blue-400 hover:shadow-md transition-shadow">
                    <p className="text-xs font-medium text-gray-600">Processing</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.stats.Processing}</p>
                    <p className="text-xs text-gray-500">
                      {stats.totalOrders > 0 ? ((stats.stats.Processing / stats.totalOrders) * 100).toFixed(1) : 0}%
                    </p>
                  </div>

                  {/* Shipped */}
                  <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-purple-400 hover:shadow-md transition-shadow">
                    <p className="text-xs font-medium text-gray-600">Shipped</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.stats.Shipped}</p>
                    <p className="text-xs text-gray-500">
                      {stats.totalOrders > 0 ? ((stats.stats.Shipped / stats.totalOrders) * 100).toFixed(1) : 0}%
                    </p>
                  </div>

                  {/* Delivered */}
                  <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-green-400 hover:shadow-md transition-shadow">
                    <p className="text-xs font-medium text-gray-600">Delivered</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.stats.Delivered}</p>
                    <p className="text-xs text-gray-500">
                      {stats.totalOrders > 0 ? ((stats.stats.Delivered / stats.totalOrders) * 100).toFixed(1) : 0}%
                    </p>
                  </div>

                  {/* Cancelled */}
                  <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-gray-400 hover:shadow-md transition-shadow">
                    <p className="text-xs font-medium text-gray-600">Cancelled</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.stats.Cancelled}</p>
                    <p className="text-xs text-gray-500">
                      {stats.totalOrders > 0 ? ((stats.stats.Cancelled / stats.totalOrders) * 100).toFixed(1) : 0}%
                    </p>
                  </div>

                  {/* Unpaid */}
                  <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-red-400 hover:shadow-md transition-shadow">
                    <p className="text-xs font-medium text-gray-600">Unpaid</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.stats.Unpaid}</p>
                    <p className="text-xs text-gray-500">
                      {stats.totalOrders > 0 ? ((stats.stats.Unpaid / stats.totalOrders) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-10 text-gray-500">
                <p>Unable to load statistics</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderChart;