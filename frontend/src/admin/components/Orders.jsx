// /frontend/src/admin/src/components/Orders.jsx - COMPLETE WITH TRACKING
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiCheck, FiX, FiTruck, FiPackage, FiCreditCard, FiUser, FiMapPin, FiPhone, FiMail, FiEdit, FiClock, FiRefreshCw, FiBarChart2 } from 'react-icons/fi';
import { BsCurrencyRupee } from "react-icons/bs";
import { FaShip } from 'react-icons/fa';
import { ordersPageStyles as styles } from '../assets/adminStyles';
import OrderChart from './OrderChart';
import AssignAgentModal from './AssignAgentModal';
import OrderTrackingMap from './OrderTrackingMap'; // NEW IMPORT

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [activeCardFilter, setActiveCardFilter] = useState('total');
  const [isLoading, setIsLoading] = useState(false);
  
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedOrderForAssign, setSelectedOrderForAssign] = useState(null);

  // NEW: Tracking modal state
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [orderToTrack, setOrderToTrack] = useState(null);

  const statusOptions = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

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

  const getDisplayPaymentStatus = (order) => {
    if (order.paymentMethod === 'Cash on Delivery') {
      return order.status === 'Delivered' ? 'Paid' : 'Unpaid';
    } else if (order.paymentMethod === 'Online Payment') {
      return 'Paid';
    }
    return order.paymentStatus || 'Unpaid';
  };

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get('http://localhost:4000/api/orders', {
        headers: getAuthHeaders()
      });
      setOrders(data);
      setFilteredOrders(data);
      console.log('✅ Fetched orders successfully:', data.length);
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      
      if (error.response?.status === 401) {
        console.error('Admin authentication failed - redirecting to login');
        localStorage.removeItem('adminSession');
        window.location.href = '/admin/login';
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let result = [...orders];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(order =>
        order.orderId?.toLowerCase().includes(term) ||
        order.customer?.name?.toLowerCase().includes(term) ||
        order.customer?.phone?.includes(term) ||
        (order.customer?.email && order.customer.email.toLowerCase().includes(term))
      );
    }

    if (statusFilter !== 'All') {
      result = result.filter(order => order.status === statusFilter);
    }

    if (paymentFilter !== 'All') {
      result = result.filter(order => getDisplayPaymentStatus(order) === paymentFilter);
    }

    setFilteredOrders(result);
  }, [orders, searchTerm, statusFilter, paymentFilter]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await axios.put(
        `http://localhost:4000/api/orders/${orderId}`,
        { status: newStatus },
        { headers: getAuthHeaders() }
      );

      setOrders(prev =>
        prev.map(order =>
          order._id === orderId ? response.data : order
        )
      );

      setFilteredOrders(prev =>
        prev.map(order =>
          order._id === orderId ? response.data : order
        )
      );

      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder(response.data);
      }

      console.log('✅ Order updated successfully:', response.data);
    } catch (error) {
      console.error('❌ Error updating order status:', error);
      
      if (error.response?.status === 401) {
        console.error('Admin authentication failed');
        localStorage.removeItem('adminSession');
        window.location.href = '/admin/login';
      }
    }
  };

  const cancelOrder = (orderId) => {
    updateOrderStatus(orderId, 'Cancelled');
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const closeModal = () => {
    setIsDetailModalOpen(false);
    setSelectedOrder(null);
  };

  const handleAssignAgent = (order) => {
    setSelectedOrderForAssign(order);
    setIsAssignModalOpen(true);
  };

  const handleAgentAssigned = (updatedOrder) => {
    setOrders(prev =>
      prev.map(order =>
        order._id === updatedOrder._id ? updatedOrder : order
      )
    );

    setFilteredOrders(prev =>
      prev.map(order =>
        order._id === updatedOrder._id ? updatedOrder : order
      )
    );

    if (selectedOrder && selectedOrder._id === updatedOrder._id) {
      setSelectedOrder(updatedOrder);
    }

    setIsAssignModalOpen(false);
  };

  // NEW: Tracking functions
  const openTrackingModal = (order) => {
    setOrderToTrack(order);
    setIsTrackingModalOpen(true);
  };

  const closeTrackingModal = () => {
    setIsTrackingModalOpen(false);
    setOrderToTrack(null);
  };

  const canTrackOrder = (order) => {
    return ['Processing', 'Shipped'].includes(order.status) && order.assignedTo;
  };

  const handleCardFilter = (filterType) => {
    setActiveCardFilter(filterType);
    setSearchTerm('');
    setPaymentFilter('All');

    switch (filterType) {
      case 'total':
        setStatusFilter('All');
        break;
      case 'pending':
        setStatusFilter('Pending');
        break;
      case 'processing':
        setStatusFilter('Processing');
        break;
      case 'shipped':
        setStatusFilter('Shipped');
        break;
      case 'delivered':
        setStatusFilter('Delivered');
        break;
      case 'unpaid':
        setStatusFilter('All');
        setPaymentFilter('Unpaid');
        break;
      default:
        setStatusFilter('All');
    }
  };

  // Stats calculations
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;
  const processingOrders = orders.filter(o => o.status === 'Processing').length;
  const shippedOrders = orders.filter(o => o.status === 'Shipped').length;
  const deliveredOrders = orders.filter(o => o.status === 'Delivered').length;
  const unpaidOrders = orders.filter(o => getDisplayPaymentStatus(o) === 'Unpaid').length;

  const statsCards = [
    {
      id: 'total',
      title: 'Total Orders',
      value: totalOrders,
      icon: FiPackage,
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-500',
      activeBg: 'bg-blue-50'
    },
    {
      id: 'pending',
      title: 'Pending Orders',
      value: pendingOrders,
      icon: FiClock,
      color: 'yellow',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-600',
      borderColor: 'border-yellow-500',
      activeBg: 'bg-yellow-50'
    },
    {
      id: 'processing',
      title: 'Processing Orders',
      value: processingOrders,
      icon: FiTruck,
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-500',
      activeBg: 'bg-blue-50'
    },
    {
      id: 'shipped',
      title: 'Shipped Orders',
      value: shippedOrders,
      icon: FaShip,
      color: 'purple',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
      borderColor: 'border-purple-500',
      activeBg: 'bg-purple-50'
    },
    {
      id: 'delivered',
      title: 'Delivered Orders',
      value: deliveredOrders,
      icon: FiCheck,
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
      borderColor: 'border-green-500',
      activeBg: 'bg-green-50'
    },
    {
      id: 'unpaid',
      title: 'Unpaid Orders',
      value: unpaidOrders,
      icon: BsCurrencyRupee,
      color: 'red',
      bgColor: 'bg-red-100',
      textColor: 'text-red-600',
      borderColor: 'border-red-500',
      activeBg: 'bg-red-50'
    }
  ];

  return (
    <div className={styles.pageContainer}>
      <div className={styles.innerContainer}>
        {/* Header */}
        <div className={styles.headerContainer}>
          <div className="flex justify-between items-center">
            <div>
              <h1 className={styles.headerTitle}>Order Management</h1>
              <p className={styles.headerSubtitle}>
                View, manage, and track customer orders
              </p>
            </div>
            <button
              onClick={fetchOrders}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FiRefreshCw className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Interactive Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {statsCards.map((card) => {
            const IconComponent = card.icon;
            const isActive = activeCardFilter === card.id;

            return (
              <div
                key={card.id}
                onClick={() => handleCardFilter(card.id)}
                className={`
                  relative cursor-pointer transition-all duration-200 transform hover:scale-105
                  ${isActive
                    ? `${card.activeBg} ${card.borderColor} border-2 shadow-lg`
                    : 'bg-white border border-gray-200 hover:shadow-md'
                  }
                  rounded-xl p-4
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isActive ? card.textColor : 'text-gray-600'}`}>
                      {card.title}
                    </p>
                    <p className={`text-2xl font-bold mt-1 ${isActive ? card.textColor : 'text-gray-900'}`}>
                      {card.value}
                    </p>
                  </div>
                  <div className={`
                    p-3 rounded-lg
                    ${isActive ? card.bgColor : 'bg-gray-100'}
                  `}>
                    <IconComponent className={`w-6 h-6 ${isActive ? card.textColor : 'text-gray-600'}`} />
                  </div>
                </div>
                {isActive && (
                  <div className={`absolute inset-0 rounded-xl ${card.borderColor} border-2 pointer-events-none`} />
                )}
              </div>
            );
          })}
        </div>

        {/* View Interpretation Button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setIsChartModalOpen(true)}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            <FiBarChart2 className="mr-2" size={20} />
            View Interpretation
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by Order ID, customer name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setActiveCardFilter(e.target.value === 'All' ? 'total' : e.target.value.toLowerCase());
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                if (e.target.value === 'Unpaid') {
                  setActiveCardFilter('unpaid');
                }
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="All">All Payments</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className={styles.contentContainer}>
          <div className="overflow-x-auto">
            <table className={styles.table}>
              <thead className={styles.tableHead}>
                <tr>
                  <th className={styles.tableHeaderCell}>Order ID</th>
                  <th className={styles.tableHeaderCell}>Customer</th>
                  <th className={styles.tableHeaderCell}>Date</th>
                  <th className={styles.tableHeaderCell}>Items</th>
                  <th className={styles.tableHeaderCell}>Total</th>
                  <th className={styles.tableHeaderCell}>Status</th>
                  <th className={styles.tableHeaderCell}>Payment</th>
                  <th className={styles.tableHeaderCell}>Assigned To</th>
                  <th className={styles.tableHeaderCell}>Actions</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="9" className={styles.emptyStateCell}>
                      <div className={styles.emptyStateContainer}>
                        <FiPackage className={styles.emptyStateIcon} />
                        <h3 className={styles.emptyStateTitle}>No orders found</h3>
                        <p className={styles.emptyStateText}>
                          {searchTerm || statusFilter !== 'All' || paymentFilter !== 'All'
                            ? 'Try changing your filters'
                            : 'No orders have been placed yet'
                          }
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr key={order._id} className={styles.tableRowHover}>
                      <td className={`${styles.tableDataCell} ${styles.orderId}`}>
                        {order.orderId}
                      </td>
                      <td className={styles.tableDataCell}>
                        <div className="font-medium">{order.customer?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{order.customer?.phone || 'N/A'}</div>
                      </td>
                      <td className={`${styles.tableDataCell} text-sm text-gray-500`}>
                        {order.date}
                      </td>
                      <td className={`${styles.tableDataCell} text-sm text-gray-500`}>
                        {order.items?.length || 0} items
                      </td>
                      <td className={`${styles.tableDataCell} font-medium`}>
                        ₹{order.total?.toFixed(2) || '0.00'}
                      </td>
                      <td className={styles.tableDataCell}>
                        <span className={styles.statusBadge(order.status)}>
                          {order.status}
                        </span>
                      </td>
                      <td className={styles.tableDataCell}>
                        <span className={styles.paymentBadge(getDisplayPaymentStatus(order))}>
                          {getDisplayPaymentStatus(order)}
                        </span>
                      </td>
                      <td className={styles.tableDataCell}>
                        <div className="flex flex-col">
                          {order.assignedTo ? (
                            <>
                              <span className="text-sm font-medium text-gray-900">
                                {order.assignedTo.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {order.assignedTo.email}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-500 italic">Unassigned</span>
                          )}
                          <button
                            onClick={() => handleAssignAgent(order)}
                            className="mt-1 text-xs text-blue-600 hover:text-blue-800 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                            disabled={order.status === 'Delivered' || order.status === 'Cancelled'}
                          >
                            {order.assignedTo ? 'Reassign' : 'Assign Agent'}
                          </button>
                        </div>
                      </td>
                      <td className={styles.tableDataCell}>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => viewOrderDetails(order)}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                          >
                            View
                          </button>
                          
                          {/* NEW: Track Button */}
                          {canTrackOrder(order) && (
                            <button
                              onClick={() => openTrackingModal(order)}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                            >
                              Track
                            </button>
                          )}
                          
                          <button
                            onClick={() => cancelOrder(order._id)}
                            className={`px-3 py-1 text-sm rounded transition-colors ${order.status === 'Cancelled' || order.status === 'Delivered'
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-red-600 text-white hover:bg-red-700'
                              }`}
                            disabled={order.status === 'Cancelled' || order.status === 'Delivered'}
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Order Chart Modal */}
      <OrderChart
        isOpen={isChartModalOpen}
        onClose={() => setIsChartModalOpen(false)}
        getAuthHeaders={getAuthHeaders}
      />

      {/* Assign Agent Modal */}
      <AssignAgentModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        order={selectedOrderForAssign}
        onAgentAssigned={handleAgentAssigned}
      />

      {/* NEW: Tracking Modal */}
      <OrderTrackingMap
        isOpen={isTrackingModalOpen}
        onClose={closeTrackingModal}
        order={orderToTrack}
      />

      {/* Order Detail Modal */}
      {isDetailModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Order Details: {selectedOrder.orderId}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Ordered on {selectedOrder.date}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiX size={24} />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                        <FiUser className="mr-2" />
                        Customer Information
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <div className="font-medium text-gray-900">{selectedOrder.customer?.name || 'N/A'}</div>
                          <div className="text-gray-600 flex items-center mt-1">
                            <FiMail className="mr-2 flex-shrink-0" />
                            {selectedOrder.customer?.email || 'No email provided'}
                          </div>
                          <div className="text-gray-600 flex items-center mt-1">
                            <FiPhone className="mr-2 flex-shrink-0" />
                            {selectedOrder.customer?.phone || 'No phone provided'}
                          </div>
                        </div>
                        <div className="flex items-start">
                          <FiMapPin className="text-gray-500 mr-2 mt-1 flex-shrink-0" />
                          <div className="text-gray-600">{selectedOrder.customer?.address || 'No address provided'}</div>
                        </div>
                      </div>
                    </div>

                    {selectedOrder.notes && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-3">
                          <FiEdit className="mr-2" />
                          Delivery Notes
                        </h3>
                        <p className="text-gray-700">{selectedOrder.notes}</p>
                      </div>
                    )}

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Update Order Status
                      </h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Order Status
                        </label>
                        <select
                          value={selectedOrder.status}
                          onChange={(e) => {
                            const newStatus = e.target.value;
                            setSelectedOrder({ ...selectedOrder, status: newStatus });
                            updateOrderStatus(selectedOrder._id, newStatus);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {statusOptions.filter(o => o !== 'All').map(option => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                        <FiCreditCard className="mr-2" />
                        Payment Information
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Payment Method:</span>
                          <span className="font-medium">{selectedOrder.paymentMethod || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Payment Status:</span>
                          <span className={styles.paymentBadge(getDisplayPaymentStatus(selectedOrder))}>
                            {getDisplayPaymentStatus(selectedOrder)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                        <FiPackage className="mr-2" />
                        Order Summary
                      </h3>
                      <div className="space-y-4">
                        {selectedOrder.items?.map((item, index) => (
                          <div
                            key={item._id || index}
                            className={`flex items-center space-x-4 ${index < selectedOrder.items.length - 1 ? 'pb-4 border-b border-gray-100' : ''}`}
                          >
                            {item.imageUrl ? (
                              <img
                                src={`http://localhost:4000${item.imageUrl}`}
                                alt={item.name}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                <FiPackage className="text-gray-400" />
                              </div>
                            )}
                            <div className="flex-grow">
                              <div className="font-medium text-gray-900">{item.name}</div>
                              <div className="text-gray-600">₹{item.price?.toFixed(2) || '0.00'} × {item.quantity || 0}</div>
                            </div>
                            <div className="font-medium text-gray-900">
                              ₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                            </div>
                          </div>
                        )) || (
                            <div className="text-center text-gray-500 py-4">No items found</div>
                          )}

                        <div className="border-t border-gray-200 pt-4 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="font-medium">₹{selectedOrder.total?.toFixed(2) || '0.00'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Shipping</span>
                            <span className="font-medium text-green-600">Free</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tax (5%)</span>
                            <span className="font-medium">₹{((selectedOrder.total || 0) * 0.05).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                            <span>Total</span>
                            <span className="text-green-700">
                              ₹{((selectedOrder.total || 0) * 1.05).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              {/* NEW: Track button in detail modal */}
              {canTrackOrder(selectedOrder) && (
                <button
                  onClick={() => {
                    closeModal();
                    openTrackingModal(selectedOrder);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <FiTruck />
                  Track Order
                </button>
              )}
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Orders;