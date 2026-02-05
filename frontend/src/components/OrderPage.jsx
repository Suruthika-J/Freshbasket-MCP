
// frontend/src/components/OrderPage.jsx - COMPLETE WITH TRACKING
import React, { useEffect, useState } from 'react';
import {
  FiX, FiTruck, FiPackage,
  FiCreditCard, FiUser, FiMapPin, FiPhone, FiMail, FiArrowLeft, FiSearch, FiAlertTriangle, FiStar, FiRotateCcw
} from 'react-icons/fi';
import { ordersPageStyles } from "../assets/dummyStyles.js";
import axios from 'axios';
import RatingModal from './RatingModal';
import UserOrderTracking from './UserOrderTracking'; // NEW IMPORT
import ReturnModal from './ReturnModal'; // NEW IMPORT
import Modal from './Modal';

const UserOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [orderToRate, setOrderToRate] = useState(null);
  const [orderReviews, setOrderReviews] = useState({});
  
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [orderToTrack, setOrderToTrack] = useState(null);

  // NEW: Return modal state
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [orderToReturn, setOrderToReturn] = useState(null);
  // NEW: Tracking modal state

  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const userEmail = userData.email || '';

  const fetchAndFilterOrders = async () => {
    try {
      const resp = await axios.get('http://localhost:4000/api/orders');
      const allOrders = resp.data;

      const mine = allOrders.filter(o =>
        o.customer?.email?.toLowerCase() === userEmail.toLowerCase()
      );

      setOrders(mine);
      await checkOrderReviews(mine);
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  const checkOrderReviews = async (orders) => {
    const reviewsMap = {};

    for (const order of orders) {
      try {
        const response = await axios.get(
          `http://localhost:4000/api/reviews/order/${order._id}`
        );
        if (response.data.success) {
          reviewsMap[order._id] = response.data.review;
        } else {
          reviewsMap[order._id] = null;
        }
      } catch (err) {
        // Only log if it's not a 404 (which is expected for orders without reviews)
        if (err.response?.status !== 404) {
          console.error('Error fetching review for order:', order._id, err);
        }
        reviewsMap[order._id] = null;
      }
    }

    setOrderReviews(reviewsMap);
  };

  useEffect(() => {
    fetchAndFilterOrders();
  }, []);

  useEffect(() => {
    setFilteredOrders(
      orders.filter(o =>
        o.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.items.some(i =>
          i.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    );
  }, [orders, searchTerm]);

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const closeModal = () => {
    setIsDetailModalOpen(false);
    setSelectedOrder(null);
  };

  const openRatingModal = (order) => {
    setOrderToRate(order);
    setIsRatingModalOpen(true);
  };

  const closeRatingModal = () => {
    setIsRatingModalOpen(false);
    setOrderToRate(null);
  };

  const handleReviewSubmitted = (review) => {
    setOrderReviews(prev => ({
      ...prev,
      [review.orderId]: review
    }));
    fetchAndFilterOrders();
  };

  const canReviewOrder = (order) => {
    return order.status === 'Delivered' && !orderReviews[order._id];
  };

  const canReturnOrder = (order) => {
    if (order.status !== 'Delivered') return false;

    // Check if order is within 7 days of delivery
    const deliveryDate = new Date(order.date);
    const currentDate = new Date();
    const daysSinceDelivery = Math.floor((currentDate - deliveryDate) / (1000 * 60 * 60 * 24));

    return daysSinceDelivery <= 7;
  };

  const getReviewForOrder = (orderId) => {
    return orderReviews[orderId];
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
    return ['Processing', 'Shipped'].includes(order.status);
  };

  // NEW: Return functions
  const openReturnModal = (order) => {
    setOrderToReturn(order);
    setIsReturnModalOpen(true);
  };

  const closeReturnModal = () => {
    setIsReturnModalOpen(false);
    setOrderToReturn(null);
  };
  
  return (
    <div className={ordersPageStyles.page}>
      <div className={ordersPageStyles.container}>
        {/* Header */}
        <div className={ordersPageStyles.header}>
          <a href="#" className={ordersPageStyles.backLink}>
            <FiArrowLeft className="mr-2" /> Back to Account
          </a>
          <h1 className={ordersPageStyles.mainTitle}>
            My <span className={ordersPageStyles.titleSpan}>Orders</span>
          </h1>
          <p className={ordersPageStyles.subtitle}>
            View your order history and track current orders
          </p>
          <div className={ordersPageStyles.titleDivider}>
            <div className={ordersPageStyles.dividerLine}></div>
          </div>
        </div>

        {/* Search */}
        <div className={ordersPageStyles.searchContainer}>
          <div className={ordersPageStyles.searchForm}>
            <input
              type="text"
              placeholder="Search orders or products..."
              className={ordersPageStyles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className={ordersPageStyles.searchButton}>
              <FiSearch size={18} />
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className={ordersPageStyles.ordersTable}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={ordersPageStyles.tableHeader}>
                <tr>
                  <th className={ordersPageStyles.tableHeaderCell}>Order ID</th>
                  <th className={ordersPageStyles.tableHeaderCell}>Date</th>
                  <th className={ordersPageStyles.tableHeaderCell}>Items</th>
                  <th className={ordersPageStyles.tableHeaderCell}>Total</th>
                  <th className={ordersPageStyles.tableHeaderCell}>Status</th>
                  <th className={ordersPageStyles.tableHeaderCell}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-700/50">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <FiPackage className="text-emerald-400 text-4xl mb-4" />
                        <h3 className="text-lg font-medium text-emerald-100 mb-1">No orders found</h3>
                        <p className="text-emerald-300">Try adjusting your search criteria</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr key={order._id} className={ordersPageStyles.tableRow}>
                      <td className={`${ordersPageStyles.tableCell} font-medium text-emerald-200`}>
                        {order.orderId}
                      </td>
                      <td className={`${ordersPageStyles.tableCell} text-sm`}>
                        {order.date}
                      </td>
                      <td className={ordersPageStyles.tableCell}>
                        <div className="text-emerald-100">
                          {order.items.length} items
                        </div>
                      </td>
                      <td className={`${ordersPageStyles.tableCell} font-medium`}>
                        ₹{order.total.toFixed(2)}
                      </td>
                      <td className={ordersPageStyles.tableCell}>
                        <span className={`${ordersPageStyles.statusBadge} ${
                          order.status === 'Delivered' ? 'bg-emerald-500/20 text-emerald-200' :
                          order.status === 'Processing' ? 'bg-amber-500/20 text-amber-200' :
                          order.status === 'Shipped' ? 'bg-blue-500/20 text-blue-200' :
                          'bg-red-500/20 text-red-200'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className={ordersPageStyles.tableCell}>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => viewOrderDetails(order)}
                            className={ordersPageStyles.actionButton}
                          >
                            View Details
                          </button>


                          
                          {/* NEW: Track Order Button */}
                          {canTrackOrder(order) && (
                            <button
                              onClick={() => openTrackingModal(order)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-1"
                            >
                              <FiTruck size={14} />
                              Track Order
                            </button>
                          )}
                          
                          {canReturnOrder(order) && (
                            <button
                              onClick={() => openReturnModal(order)}
                              className="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-1"
                            >
                              <FiRotateCcw size={14} />
                              Return Order
                            </button>
                          )}

                          {canReviewOrder(order) && (
                            <button
                              onClick={() => openRatingModal(order)}
                              className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-1"
                            >
                              <FiStar size={14} />
                              Rate Order
                            </button>
                          )}

                          {getReviewForOrder(order._id) && (
                            <div className="flex items-center gap-1 px-3 py-1 bg-emerald-600/30 text-emerald-200 rounded-lg text-sm">
                              <FiStar className="fill-yellow-400 text-yellow-400" size={14} />
                              Reviewed
                            </div>
                          )}
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

      {/* Order Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={closeModal}
        title={`Order Details: ${selectedOrder?.orderId}`}
        size="xl"
      >
        {selectedOrder && (
          <>
            <div className="text-emerald-300 mb-6">
              Ordered on {selectedOrder.date}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div>
                {/* Customer Info */}
                <div className="mb-6">
                  <h3 className="flex items-center text-lg font-bold text-emerald-100 mb-4">
                    <FiUser className="mr-2 text-emerald-300" />
                    My Information
                  </h3>
                  <div className="bg-emerald-800/50 rounded-xl p-4 border border-emerald-700/50">
                    <div className="mb-3">
                      <div className="font-medium text-emerald-100">{selectedOrder.customer.name}</div>
                      <div className="text-emerald-300 flex items-center mt-2">
                        <FiMail className="mr-2 flex-shrink-0" />
                        {selectedOrder.customer.email || 'No email provided'}
                      </div>
                      <div className="text-emerald-300 flex items-center mt-2">
                        <FiPhone className="mr-2 flex-shrink-0" />
                        {selectedOrder.customer.phone}
                      </div>
                    </div>
                    <div className="flex items-start mt-3">
                      <FiMapPin className="text-emerald-400 mr-2 mt-1 flex-shrink-0" />
                      <div className="text-emerald-300">{selectedOrder.customer.address}</div>
                    </div>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div className="mb-6">
                    <h3 className="flex items-center text-lg font-bold text-emerald-100 mb-4">
                      Delivery Notes
                    </h3>
                    <div className="bg-emerald-800/50 border-l-4 border-emerald-400 p-4 rounded-lg">
                      <p className="text-emerald-200">{selectedOrder.notes}</p>
                    </div>
                  </div>
                )}

                {getReviewForOrder(selectedOrder._id) && (
                  <div className="mb-6">
                    <h3 className="flex items-center text-lg font-bold text-emerald-100 mb-4">
                      <FiStar className="mr-2 text-yellow-400" />
                      Your Review
                    </h3>
                    <div className="bg-emerald-800/50 border border-emerald-600/50 p-4 rounded-lg">
                      <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FiStar
                            key={star}
                            className={`${
                              star <= getReviewForOrder(selectedOrder._id).rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-500'
                            }`}
                            size={18}
                          />
                        ))}
                      </div>
                      <p className="text-emerald-200">
                        {getReviewForOrder(selectedOrder._id).comment}
                      </p>
                      <p className="text-emerald-400 text-xs mt-2">
                        Reviewed on {new Date(getReviewForOrder(selectedOrder._id).createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div>
                <div className="mb-6">
                  <h3 className="flex items-center text-lg font-bold text-emerald-100 mb-4">
                    <FiPackage className="mr-2 text-emerald-300" />
                    Order Summary
                  </h3>
                  <div className="border border-emerald-700 rounded-xl overflow-hidden">
                    {selectedOrder.items.map((item, index) => (
                      <div
                        key={item._id || index}
                        className={`flex items-center p-4 bg-emerald-900/30 ${index !== selectedOrder.items.length - 1 ? 'border-b border-emerald-700' : ''}`}
                      >
                        {item.imageUrl ? (
                          <img
                            src={`http://localhost:4000${item.imageUrl}`}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-lg mr-4"
                          />
                        ) : (
                          <div className="bg-emerald-800 border-2 border-dashed border-emerald-700 rounded-xl w-16 h-16 mr-4 flex items-center justify-center">
                            <FiPackage className="text-emerald-500" />
                          </div>
                        )}
                        <div className="flex-grow">
                          <div className="font-medium text-emerald-100">{item.name}</div>
                          <div className="text-emerald-400">₹{item.price.toFixed(2)} × {item.quantity}</div>
                          {item.stock !== undefined && (
                            <div className="mt-1">
                              {item.stock > 0 ? (
                                <div className="flex items-center text-xs">
                                  <span className={`${item.stock <= 5 ? 'text-amber-300' : 'text-green-400'}`}>
                                    {item.stock <= 5 ? `Only ${item.stock} left in stock` : `${item.stock} in stock`}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center text-xs text-red-400">
                                  <FiAlertTriangle className="mr-1" size={12} />
                                  <span>Currently out of stock</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="font-medium text-emerald-100">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}

                    <div className="p-4 bg-emerald-800/50">
                      <div className="flex justify-between py-2">
                        <span className="text-emerald-300">Subtotal</span>
                        <span className="font-medium text-emerald-100">₹{selectedOrder.total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-emerald-300">Shipping</span>
                        <span className="font-medium text-emerald-400">Free</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-emerald-300">Tax</span>
                        <span className="font-medium text-emerald-100">₹{(selectedOrder.total * 0.05).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-4 mt-2 border-t border-emerald-700">
                        <span className="text-lg font-bold text-emerald-100">Total</span>
                        <span className="text-lg font-bold text-emerald-300">
                          ₹{(selectedOrder.total * 1.05).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="flex items-center text-lg font-bold text-emerald-100 mb-4">
                      <FiCreditCard className="mr-2 text-emerald-300" />
                      Payment
                    </h3>
                    <div className="bg-emerald-800/50 rounded-xl p-4 border border-emerald-700/50">
                      <div className="flex justify-between mb-3">
                        <span className="text-emerald-300">Method:</span>
                        <span className="font-medium text-emerald-100">{selectedOrder.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-300">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${selectedOrder.paymentStatus === 'Paid' ? 'bg-emerald-500/20 text-emerald-200' : 'bg-red-500/20 text-red-200'}`}>
                          {selectedOrder.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="flex items-center text-lg font-bold text-emerald-100 mb-4">
                      <FiTruck className="mr-2 text-emerald-300" />
                      Shipping
                    </h3>
                    <div className="bg-emerald-800/50 rounded-xl p-4 border border-emerald-700/50">
                      <div className="flex justify-between mb-3">
                        <span className="text-emerald-300">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${selectedOrder.status === 'Delivered' ? 'bg-emerald-500/20 text-emerald-200' :
                          selectedOrder.status === 'Shipped' ? 'bg-blue-500/20 text-blue-200' :
                          selectedOrder.status === 'Cancelled' ? 'bg-red-500/20 text-red-200' :
                          'bg-amber-500/20 text-amber-200'}`}>
                          {selectedOrder.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              {/* NEW: Track Order button in modal footer */}
              {canTrackOrder(selectedOrder) && (
                <button
                  onClick={() => {
                    closeModal();
                    openTrackingModal(selectedOrder);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                >
                  <FiTruck size={16} />
                  Track Order
                </button>
              )}

              {canReviewOrder(selectedOrder) && (
                <button
                  onClick={() => {
                    closeModal();
                    openRatingModal(selectedOrder);
                  }}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                >
                  <FiStar size={16} />
                  Rate This Order
                </button>
              )}
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-emerald-700/50 hover:bg-emerald-700 text-emerald-100 rounded-full transition"
              >
                Close
              </button>
            </div>
          </>
        )}
      </Modal>
      
      {/* Rating Modal */}
      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={closeRatingModal}
        order={orderToRate}
        onReviewSubmitted={handleReviewSubmitted}
      />

      {/* NEW: Tracking Modal */}
      <UserOrderTracking
        isOpen={isTrackingModalOpen}
        onClose={closeTrackingModal}
        order={orderToTrack}
      />

      {/* NEW: Return Modal */}
      <ReturnModal
        isOpen={isReturnModalOpen}
        onClose={closeReturnModal}
        order={orderToReturn}
        onReturnSubmitted={() => {
          fetchAndFilterOrders(); // Refresh orders after return submission
        }}
      />
    </div>
  );
};

export default UserOrdersPage;