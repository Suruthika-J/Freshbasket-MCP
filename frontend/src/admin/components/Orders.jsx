// /frontend/src/admin/src/components/Orders.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FiCheck, FiX, FiTruck, FiPackage, FiCreditCard, FiUser,
  FiMapPin, FiPhone, FiMail, FiEdit, FiClock, FiRefreshCw,
  FiBarChart2, FiFilter, FiSearch, FiInfo, FiUsers
} from 'react-icons/fi';
import { BsCurrencyRupee } from "react-icons/bs";
import { FaStore } from 'react-icons/fa';
import { ordersPageStyles as styles } from '../assets/adminStyles';
import OrderChart from './OrderChart';
import AssignAgentModal from './AssignAgentModal';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const Orders = () => {
  const [activeTab, setActiveTab] = useState('admin'); // 'admin' or 'farmer'
  const [subOrders, setSubOrders] = useState([]);
  const [filteredSubOrders, setFilteredSubOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(false);

  const [selectedSubOrder, setSelectedSubOrder] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [subOrderToAssign, setSubOrderToAssign] = useState(null);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);

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

  const fetchSubOrders = async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/sub-orders/admin/all`, {
        headers: getAuthHeaders()
      });
      if (data.success) {
        setSubOrders(data.subOrders);
      }
    } catch (error) {
      console.error('❌ Error fetching sub-orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubOrders();
    const interval = setInterval(fetchSubOrders, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let result = subOrders.filter(so => so.vendor.vendorType === activeTab);

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(so =>
        so.subOrderId?.toLowerCase().includes(term) ||
        so.parentOrder?.parentOrderId?.toLowerCase().includes(term) ||
        so.parentOrder?.customer?.name?.toLowerCase().includes(term) ||
        so.vendor.vendorName.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'All') {
      result = result.filter(so => so.status === statusFilter.toLowerCase());
    }

    setFilteredSubOrders(result);
  }, [subOrders, activeTab, searchTerm, statusFilter]);

  const updateStatus = async (id, status) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/sub-orders/${id}/status`,
        { status },
        { headers: getAuthHeaders() }
      );
      if (response.data.success) {
        toast.success(`Order marked as ${status}`);
        fetchSubOrders();
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const updatePaymentStatus = async (id, paymentStatus) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/sub-orders/${id}/payment-status`,
        { paymentStatus },
        { headers: getAuthHeaders() }
      );
      if (response.data.success) {
        toast.success(`Payment status updated to ${paymentStatus}`);
        fetchSubOrders();
        // Update selected sub order in modal if it's the one we just updated
        if (selectedSubOrder && selectedSubOrder._id === id) {
          setSelectedSubOrder({ ...selectedSubOrder, paymentStatus });
        }
      }
    } catch (error) {
      toast.error('Failed to update payment status');
    }
  };

  const handleAgentAssigned = (updatedSubOrder) => {
    fetchSubOrders();
    setIsAssignModalOpen(false);
  };

  // Grouping logic for Farmer Tab
  const groupedFarmerOrders = filteredSubOrders.reduce((groups, order) => {
    const farmerName = order.vendor.vendorName;
    if (!groups[farmerName]) groups[farmerName] = [];
    groups[farmerName].push(order);
    return groups;
  }, {});

  const renderStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-blue-100 text-blue-700',
      preparing: 'bg-indigo-100 text-indigo-700',
      ready: 'bg-emerald-100 text-emerald-700',
      delivered: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
      returning: 'bg-orange-100 text-orange-700',
      refunded: 'bg-gray-100 text-gray-700'
    };
    return <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${colors[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
  };

  const renderDeliveryBadge = (type) => {
    const isPickup = type === 'selfPickup' || type === 'SELF_PICKUP';
    return (
      <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${isPickup ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
        {isPickup ? <FiMapPin size={10} /> : <FiTruck size={10} />}
        {isPickup ? 'Self Pickup' : 'Agent Delivery'}
      </span>
    );
  };

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Order Management</h1>
            <p className="text-gray-500 font-medium">Oversee platform sales and farmer marketplace operations.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsChartModalOpen(true)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm"
            >
              <FiBarChart2 /> Analytics
            </button>
            <button
              onClick={fetchSubOrders}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
            >
              <FiRefreshCw className={isLoading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white p-1.5 rounded-2xl border border-gray-200 w-fit mb-8 shadow-sm">
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'admin' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <FaStore /> Admin Store
          </button>
          <button
            onClick={() => setActiveTab('farmer')}
            className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'farmer' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <FiUsers /> Farmer Market
          </button>
        </div>

        {/* Global Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="relative md:col-span-2">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search Order ID, Customer, or Vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium shadow-sm"
            />
          </div>
          <div className="relative">
            <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-gray-700 shadow-sm appearance-none"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Preparing">Preparing</option>
              <option value="Ready">Ready</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Content Area */}
        {activeTab === 'admin' ? (
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left min-w-[800px]">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Order ID</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Customer</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Items</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Agent</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredSubOrders.length === 0 ? (
                  <tr><td colSpan="6" className="py-20 text-center text-gray-400 font-bold">No store orders found</td></tr>
                ) : (
                  filteredSubOrders.map((so) => (
                    <tr key={so._id} className="hover:bg-emerald-50/10 transition-colors">
                      <td className="px-6 py-5 font-bold text-gray-900">{so.subOrderId}</td>
                      <td className="px-6 py-5">
                        <div className="font-bold text-gray-800">{so.parentOrder?.customer?.name}</div>
                        <div className="text-[10px] text-gray-400 font-bold">{so.parentOrder?.customer?.phone}</div>
                      </td>
                      <td className="px-6 py-5 font-medium text-gray-600">{so.items.length} Products</td>
                      <td className="px-6 py-5">{renderStatusBadge(so.status)}</td>
                      <td className="px-6 py-5">
                        {so.assignedAgent ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-[10px] font-black">
                              {so.assignedAgent.name.charAt(0)}
                            </div>
                            <span className="text-sm font-bold text-gray-700">{so.assignedAgent.name}</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setSubOrderToAssign(so); setIsAssignModalOpen(true); }}
                            className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-700"
                          >
                            Assign Agent
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <button
                          onClick={() => { setSelectedSubOrder(so); setIsDetailModalOpen(true); }}
                          className="px-4 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:border-emerald-600 hover:text-emerald-600 transition-all"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Farmer Tab - Grouped View */
          <div className="space-y-8">
            {Object.entries(groupedFarmerOrders).length === 0 ? (
              <div className="bg-white rounded-3xl p-20 text-center text-gray-400 font-bold border border-gray-100">No farmer orders found</div>
            ) : (
              Object.entries(groupedFarmerOrders).map(([farmerName, orders]) => (
                <div key={farmerName} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
                  <div className="bg-emerald-50/50 px-8 py-4 border-b border-emerald-100/50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl"><FaStore /></div>
                      <h3 className="text-lg font-black text-emerald-900 tracking-tight">{farmerName}</h3>
                    </div>
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{orders.length} Active Orders</span>
                  </div>
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left min-w-[800px]">
                      <thead className="bg-gray-50/30">
                        <tr>
                          <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Sub Order</th>
                          <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Customer</th>
                          <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Delivery</th>
                          <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                          <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Agent</th>
                          <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {orders.map((so) => (
                          <tr key={so._id} className="hover:bg-emerald-50/5 transition-colors">
                            <td className="px-8 py-4">
                              <div className="font-black text-gray-900">{so.subOrderId}</div>
                              <div className="text-[9px] text-gray-400 font-bold">PO: {so.parentOrder?.parentOrderId}</div>
                            </td>
                            <td className="px-8 py-4">
                              <div className="font-bold text-gray-800">{so.parentOrder?.customer?.name}</div>
                              <div className="text-[10px] text-gray-400 font-bold">{so.parentOrder?.customer?.phone}</div>
                            </td>
                            <td className="px-8 py-4">{renderDeliveryBadge(so.deliveryType)}</td>
                            <td className="px-8 py-4">{renderStatusBadge(so.status)}</td>
                            <td className="px-8 py-4">
                              {so.deliveryType === 'selfPickup' || so.deliveryType === 'SELF_PICKUP' ? (
                                <span className="text-[10px] font-bold text-gray-400 italic">Self Pickup</span>
                              ) : so.assignedAgent ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-[10px] font-black">
                                    {so.assignedAgent.name.charAt(0)}
                                  </div>
                                  <span className="text-sm font-bold text-gray-700">{so.assignedAgent.name}</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => { setSubOrderToAssign(so); setIsAssignModalOpen(true); }}
                                  className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700"
                                >
                                  Assign Agent
                                </button>
                              )}
                            </td>
                            <td className="px-8 py-4">
                              <button
                                onClick={() => { setSelectedSubOrder(so); setIsDetailModalOpen(true); }}
                                className="px-4 py-1.5 border border-gray-100 rounded-lg text-xs font-bold text-gray-600 hover:border-emerald-600 hover:text-emerald-600 transition-all"
                              >
                                Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modals - Order Detail */}
      {isDetailModalOpen && selectedSubOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
          <div className="bg-white rounded-[3rem] max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-gray-100">
            <div className="px-10 py-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Order #{selectedSubOrder.subOrderId}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-gray-400 font-bold text-sm">Parent Order: {selectedSubOrder.parentOrder?.parentOrderId}</span>
                  {renderStatusBadge(selectedSubOrder.status)}
                </div>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="w-12 h-12 flex items-center justify-center bg-white border border-gray-200 rounded-2xl text-gray-400 hover:text-red-500 transition-all shadow-sm">
                <FiX size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Details Section */}
                <div className="space-y-8">
                  <div className="bg-gray-50 rounded-3xl p-6">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <FiUser /> Customer Information
                    </h4>
                    <p className="font-black text-gray-900 text-lg">{selectedSubOrder.parentOrder?.customer?.name}</p>
                    <p className="text-gray-500 font-bold text-sm mt-1">{selectedSubOrder.parentOrder?.customer?.phone}</p>
                    <div className="flex items-start gap-2 mt-4 text-gray-600 text-sm italic">
                      <FiMapPin className="mt-1 flex-shrink-0" />
                      <span>{selectedSubOrder.parentOrder?.customer?.address}</span>
                    </div>
                  </div>

                  <div className="bg-emerald-50/50 rounded-3xl p-6 border border-emerald-100 flex justify-between items-center">
                    <div>
                      <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-2">
                        <FiCreditCard /> Payment Status
                      </h4>
                      <p className={`font-black uppercase text-xs ${selectedSubOrder.paymentStatus === 'Paid' ? 'text-green-600' : 'text-orange-600'}`}>
                        {selectedSubOrder.paymentStatus || 'Unpaid'}
                      </p>
                    </div>
                    <select
                      value={selectedSubOrder.paymentStatus || 'Unpaid'}
                      onChange={(e) => updatePaymentStatus(selectedSubOrder._id, e.target.value)}
                      className="bg-white border border-emerald-200 rounded-xl px-3 py-1.5 text-[10px] font-black text-emerald-700 outline-none uppercase tracking-widest shadow-sm"
                    >
                      <option value="Unpaid">Unpaid</option>
                      <option value="Paid">Paid</option>
                      <option value="Failed">Failed</option>
                      <option value="Refunded">Refunded</option>
                    </select>
                  </div>

                  <div className="bg-emerald-50/50 rounded-3xl p-6 border border-emerald-100">
                    <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                      Vendor Details
                    </h4>
                    <p className="font-black text-emerald-900">{selectedSubOrder.vendor.vendorName}</p>
                    <div className="mt-2 text-[10px] font-black text-emerald-500 uppercase">{selectedSubOrder.vendor.vendorType} Fulfillment</div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Update Order Flow</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => updateStatus(selectedSubOrder._id, 'preparing')} className="py-3 bg-white border border-gray-200 rounded-2xl font-bold text-xs hover:bg-emerald-50 hover:border-emerald-600 transition-all">Prepare</button>
                      <button onClick={() => updateStatus(selectedSubOrder._id, 'ready')} className="py-3 bg-white border border-gray-200 rounded-2xl font-bold text-xs hover:bg-emerald-50 hover:border-emerald-600 transition-all">Ready</button>
                      <button onClick={() => updateStatus(selectedSubOrder._id, 'delivered')} className="py-3 bg-emerald-600 text-white rounded-2xl font-bold text-xs shadow-lg shadow-emerald-50">Complete</button>
                      <button onClick={() => updateStatus(selectedSubOrder._id, 'cancelled')} className="py-3 bg-red-50 text-red-600 rounded-2xl font-bold text-xs border border-red-100">Cancel</button>
                    </div>
                  </div>
                </div>

                {/* Items Section */}
                <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Order Items ({selectedSubOrder.items.length})</h4>
                  <div className="space-y-4">
                    {selectedSubOrder.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                            <FiPackage className="text-gray-400" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-sm">{item.name}</div>
                            <div className="text-[10px] text-gray-400 font-bold">Qty: {item.quantity}</div>
                          </div>
                        </div>
                        <div className="font-black text-emerald-700 italic">₹{item.price * item.quantity}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-10 pt-6 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400 font-bold text-sm">Delivery Mode</span>
                      {renderDeliveryBadge(selectedSubOrder.deliveryType)}
                    </div>
                    <div className="flex justify-between items-center text-xl font-black text-gray-900">
                      <span>Grand Total</span>
                      <span className="text-emerald-700">₹{selectedSubOrder.total}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-10 py-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setIsDetailModalOpen(false)} className="px-8 py-3 bg-white border border-gray-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-all">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Chart Modal */}
      <OrderChart
        isOpen={isChartModalOpen}
        onClose={() => setIsChartModalOpen(false)}
        getAuthHeaders={getAuthHeaders}
      />

      {/* Assign Modal - Wrap to handle subOrder specific update logic */}
      <AssignAgentModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        order={subOrderToAssign}
        onAgentAssigned={handleAgentAssigned}
      />
    </div>
  );
};

export default Orders;