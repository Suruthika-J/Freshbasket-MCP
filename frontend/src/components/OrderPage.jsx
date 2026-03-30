
// frontend/src/components/OrderPage.jsx - COMPLETE WITH TRACKING
import React, { useEffect, useState } from 'react';
import {
  FiX, FiTruck, FiPackage,
  FiCreditCard, FiUser, FiMapPin, FiPhone, FiMail, FiArrowLeft, FiSearch, FiAlertTriangle, FiStar, FiRotateCcw
} from 'react-icons/fi';
import { ordersPageStyles } from "../assets/dummyStyles.js";
import axios from 'axios';
import RatingModal from './RatingModal';
import UserOrderTracking from './UserOrderTracking';
import ReturnModal from './ReturnModal';
import Modal from './Modal';

// ── Vivid, theme-aware status badge helper ──────────────────────────────────
const StatusBadge = ({ status, size = 'sm' }) => {
  const getBadgeClass = (status) => {
    const map = {
      'Delivered': 'fb-badge-success',
      'Processing': 'fb-badge-warning',
      'Shipped': 'fb-badge-info',
      'Cancelled': 'fb-badge-error',
      'Pending': 'fb-badge-warning',
      'Paid': 'fb-badge-success',
      'Unpaid': 'fb-badge-error',
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <span className={`inline-flex items-center font-bold rounded-full border border-current bg-opacity-10 ${size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm'} ${getBadgeClass(status)}`}>
      {status}
    </span>
  );
};

// ── Return status badge with color coding ───────────────────────────────────
const ReturnStatusBadge = ({ status }) => {
  if (!status || status === 'None') return null;
  const styles = {
    'Requested': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'Approved': 'bg-blue-100 text-blue-800 border-blue-300',
    'Rejected': 'bg-red-100 text-red-800 border-red-300',
    'Completed': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full border ${styles[status] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
      <FiRotateCcw size={11} />
      {status}
    </span>
  );
};

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

  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [orderToReturn, setOrderToReturn] = useState(null);

  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const userEmail = userData.email || '';

  const fetchAndFilterOrders = async () => {
    try {
      const resp = await axios.get(`${import.meta.env.VITE_API_URL}/api/orders`);
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
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/reviews/order/${order._id}`);
        reviewsMap[order._id] = (response.data.success && response.data.review) ? response.data.review : null;
      } catch (err) {
        console.error('Error fetching review for order:', order._id, err);
        reviewsMap[order._id] = null;
      }
    }
    setOrderReviews(reviewsMap);
  };

  useEffect(() => { fetchAndFilterOrders(); }, []);

  useEffect(() => {
    setFilteredOrders(
      orders.filter(o =>
        o.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.items.some(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    );
  }, [orders, searchTerm]);

  const viewOrderDetails = (order) => { setSelectedOrder(order); setIsDetailModalOpen(true); };
  const closeModal = () => { setIsDetailModalOpen(false); setSelectedOrder(null); };
  const openRatingModal = (order) => { setOrderToRate(order); setIsRatingModalOpen(true); };
  const closeRatingModal = () => { setIsRatingModalOpen(false); setOrderToRate(null); };
  const handleReviewSubmitted = (review) => {
    setOrderReviews(prev => ({ ...prev, [review.orderId]: review }));
    fetchAndFilterOrders();
  };
  const canReviewOrder = (order) => order.status === 'Delivered' && !orderReviews[order._id];
  const canReturnOrder = (order) => {
    if (order.status !== 'Delivered') return false;
    if (order.returnStatus && order.returnStatus !== 'None') return false;
    const daysSince = Math.floor((new Date() - new Date(order.date)) / (1000 * 60 * 60 * 24));
    return daysSince <= 7;
  };
  const hasReturnStatus = (order) => order.returnStatus && order.returnStatus !== 'None';
  const getReviewForOrder = (orderId) => orderReviews[orderId];
  const openTrackingModal = (order) => { setOrderToTrack(order); setIsTrackingModalOpen(true); };
  const closeTrackingModal = () => { setIsTrackingModalOpen(false); setOrderToTrack(null); };
  const canTrackOrder = (order) => ['Processing', 'Shipped'].includes(order.status);
  const openReturnModal = (order) => { setOrderToReturn(order); setIsReturnModalOpen(true); };
  const closeReturnModal = () => { setIsReturnModalOpen(false); setOrderToReturn(null); };

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
            <div className={ordersPageStyles.dividerLine} style={{ backgroundColor: 'var(--color-primary)' }}></div>
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
                  <th className={ordersPageStyles.tableHeaderCell}>Return</th>
                  <th className={ordersPageStyles.tableHeaderCell}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y fb-border">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <FiPackage className="fb-text-muted text-4xl mb-4" />
                        <h3 className="text-lg font-medium fb-text mb-1">No orders found</h3>
                        <p className="fb-text-secondary">Try adjusting your search criteria</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr key={order._id} className={ordersPageStyles.tableRow}>
                      {/* Order ID */}
                      <td className={`${ordersPageStyles.tableCell} font-medium fb-text-primary text-sm`}>
                        {order.orderId}
                      </td>

                      {/* Date */}
                      <td className={`${ordersPageStyles.tableCell} fb-text-secondary text-sm`}>
                        {order.date}
                      </td>

                      {/* Items count */}
                      <td className={ordersPageStyles.tableCell}>
                        <span className="inline-flex items-center gap-1 font-medium fb-text">
                          <FiPackage size={14} className="fb-text-primary" />
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </span>
                      </td>

                      {/* Total */}
                      <td className={`${ordersPageStyles.tableCell} font-semibold fb-text`}>
                        ₹{order.total.toFixed(2)}
                      </td>

                      {/* Status badge — vivid & readable */}
                      <td className={ordersPageStyles.tableCell}>
                        <StatusBadge status={order.status} />
                      </td>

                      {/* Return Status */}
                      <td className={ordersPageStyles.tableCell}>
                        <ReturnStatusBadge status={order.returnStatus} />
                      </td>

                      {/* Actions */}
                      <td className={ordersPageStyles.tableCell}>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => viewOrderDetails(order)}
                            className={ordersPageStyles.actionButton}
                          >
                            View Details
                          </button>

                          {canTrackOrder(order) && (
                            <button
                              onClick={() => openTrackingModal(order)}
                              className="px-3 py-1.5 rounded-full text-white text-sm font-medium transition-opacity hover:opacity-90 flex items-center gap-1"
                              style={{ backgroundColor: 'var(--color-info)' }}
                            >
                              <FiTruck size={13} />
                              Track
                            </button>
                          )}

                          {canReturnOrder(order) && (
                            <button
                              onClick={() => openReturnModal(order)}
                              className="px-3 py-1.5 rounded-full text-white text-sm font-medium transition-opacity hover:opacity-90 flex items-center gap-1"
                              style={{ backgroundColor: 'var(--color-warning)' }}
                            >
                              <FiRotateCcw size={13} />
                              Return
                            </button>
                          )}

                          {hasReturnStatus(order) && !canReturnOrder(order) && (
                            <ReturnStatusBadge status={order.returnStatus} />
                          )}

                          {canReviewOrder(order) && (
                            <button
                              onClick={() => openRatingModal(order)}
                              className="px-4 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-all hover:shadow-md flex items-center gap-1.5"
                            >
                              <FiStar size={14} />
                              Rate Order
                            </button>
                          )}

                          {getReviewForOrder(order._id) && (
                            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium fb-primary-subtle fb-text-primary border fb-border-primary">
                              <FiStar className="fill-yellow-400 text-yellow-500" size={13} />
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

      {/* ── Order Detail Modal ─────────────────────────────────────────────── */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={closeModal}
        title={`Order Details: ${selectedOrder?.orderId}`}
        size="xl"
      >
        {selectedOrder && (
          <>
            <div className="fb-text-secondary mb-6 text-sm">
              Ordered on {selectedOrder.date}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div>
                {/* Customer Info */}
                <div className="mb-6">
                  <h3 className="flex items-center text-lg font-bold fb-text mb-4">
                    <FiUser className="mr-2 fb-text-primary" />
                    My Information
                  </h3>
                  <div className="fb-surface-alt rounded-xl p-4 border fb-border">
                    <div className="mb-3">
                      <div className="font-semibold fb-text">{selectedOrder.customer.name}</div>
                      <div className="fb-text-secondary flex items-center mt-2 text-sm">
                        <FiMail className="mr-2 flex-shrink-0 fb-text-primary" />
                        {selectedOrder.customer.email || 'No email provided'}
                      </div>
                      <div className="fb-text-secondary flex items-center mt-2 text-sm">
                        <FiPhone className="mr-2 flex-shrink-0 fb-text-primary" />
                        {selectedOrder.customer.phone}
                      </div>
                    </div>
                    <div className="flex items-start mt-3">
                      <FiMapPin className="fb-text-primary mr-2 mt-1 flex-shrink-0" />
                      <div className="fb-text-secondary text-sm">{selectedOrder.customer.address}</div>
                    </div>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div className="mb-6">
                    <h3 className="flex items-center text-lg font-bold fb-text mb-4">Delivery Notes</h3>
                    <div className="fb-primary-subtle border-l-4 p-4 rounded-lg" style={{ borderColor: 'var(--color-primary)' }}>
                      <p className="fb-text-secondary text-sm">{selectedOrder.notes}</p>
                    </div>
                  </div>
                )}

                {getReviewForOrder(selectedOrder._id) && (
                  <div className="mb-6">
                    <h3 className="flex items-center text-lg font-bold fb-text mb-4">
                      <FiStar className="mr-2 text-yellow-500" />
                      Your Review
                    </h3>
                    <div className="fb-surface-alt border fb-border p-4 rounded-xl">
                      <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FiStar
                            key={star}
                            className={star <= getReviewForOrder(selectedOrder._id).rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'fb-text-muted'}
                            size={18}
                          />
                        ))}
                      </div>
                      <p className="fb-text text-sm">{getReviewForOrder(selectedOrder._id).comment}</p>
                      <p className="fb-text-muted text-xs mt-2">
                        Reviewed on {new Date(getReviewForOrder(selectedOrder._id).createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div>
                <div className="mb-6">
                  <h3 className="flex items-center text-lg font-bold fb-text mb-4">
                    <FiPackage className="mr-2 fb-text-primary" />
                    Order Summary
                  </h3>
                  <div className="border fb-border rounded-xl overflow-hidden">
                    {selectedOrder.items.map((item, index) => (
                      <div
                        key={item._id || index}
                        className={`flex items-center p-4 fb-surface ${index !== selectedOrder.items.length - 1 ? 'border-b fb-border' : ''}`}
                      >
                        {item.imageUrl ? (
                          <img
                            src={`${import.meta.env.VITE_API_URL}${item.imageUrl}`}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-lg mr-4"
                          />
                        ) : (
                          <div className="fb-surface-alt border-2 border-dashed fb-border rounded-xl w-16 h-16 mr-4 flex items-center justify-center">
                            <FiPackage className="fb-text-muted" />
                          </div>
                        )}
                        <div className="flex-grow">
                          <div className="font-medium fb-text">{item.name}</div>
                          <div className="fb-text-secondary text-sm">₹{item.price.toFixed(2)} × {item.quantity}</div>
                          {item.stock !== undefined && (
                            <div className="mt-1">
                              {item.stock > 0 ? (
                                <span className={`text-xs font-medium ${item.stock <= 5 ? 'text-amber-600' : 'text-green-600'}`}>
                                  {item.stock <= 5 ? `Only ${item.stock} left` : `${item.stock} in stock`}
                                </span>
                              ) : (
                                <div className="flex items-center text-xs text-red-600">
                                  <FiAlertTriangle className="mr-1" size={12} />
                                  Out of stock
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="font-semibold fb-text-primary">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}

                    {/* Totals */}
                    <div className="p-4 fb-surface-alt border-t fb-border">
                      <div className="flex justify-between py-1.5 text-sm">
                        <span className="fb-text-secondary">Subtotal</span>
                        <span className="font-medium fb-text">₹{selectedOrder.total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-1.5 text-sm">
                        <span className="fb-text-secondary">Shipping</span>
                        <span className="font-medium fb-text-primary">Free</span>
                      </div>
                      <div className="flex justify-between py-1.5 text-sm">
                        <span className="fb-text-secondary">Tax (5%)</span>
                        <span className="font-medium fb-text">₹{(selectedOrder.total * 0.05).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-3 mt-1 border-t fb-border">
                        <span className="text-base font-bold fb-text">Total</span>
                        <span className="text-base font-bold fb-text-primary">₹{(selectedOrder.total * 1.05).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Payment */}
                  <div>
                    <h3 className="flex items-center text-base font-bold fb-text mb-3">
                      <FiCreditCard className="mr-2 fb-text-primary" />
                      Payment
                    </h3>
                    <div className="fb-surface-alt rounded-xl p-4 border fb-border space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="fb-text-secondary">Method:</span>
                        <span className="font-medium fb-text">{selectedOrder.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between text-sm items-center">
                        <span className="fb-text-secondary">Status:</span>
                        <StatusBadge status={selectedOrder.paymentStatus} />
                      </div>
                    </div>
                  </div>

                  {/* Shipping */}
                  <div>
                    <h3 className="flex items-center text-base font-bold fb-text mb-3">
                      <FiTruck className="mr-2 fb-text-primary" />
                      Shipping
                    </h3>
                    <div className="fb-surface-alt rounded-xl p-4 border fb-border space-y-2">
                      <div className="flex justify-between text-sm items-center">
                        <span className="fb-text-secondary">Status:</span>
                        <StatusBadge status={selectedOrder.status} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Return Status Info */}
            {hasReturnStatus(selectedOrder) && (
              <div className="mt-6 p-4 rounded-xl border" style={{
                backgroundColor: selectedOrder.returnStatus === 'Completed' ? 'rgb(236, 253, 245)' :
                  selectedOrder.returnStatus === 'Rejected' ? 'rgb(254, 242, 242)' :
                    selectedOrder.returnStatus === 'Approved' ? 'rgb(239, 246, 255)' : 'rgb(254, 252, 232)',
                borderColor: selectedOrder.returnStatus === 'Completed' ? 'rgb(167, 243, 208)' :
                  selectedOrder.returnStatus === 'Rejected' ? 'rgb(254, 202, 202)' :
                    selectedOrder.returnStatus === 'Approved' ? 'rgb(191, 219, 254)' : 'rgb(253, 230, 138)'
              }}>
                <div className="flex items-center gap-3 mb-2">
                  <FiRotateCcw size={18} />
                  <h3 className="font-bold text-base">Return Request</h3>
                  <ReturnStatusBadge status={selectedOrder.returnStatus} />
                </div>
                {selectedOrder.returnReason && (
                  <p className="text-sm mt-1"><strong>Reason:</strong> {selectedOrder.returnReason}</p>
                )}
                {selectedOrder.returnRequestedAt && (
                  <p className="text-sm mt-1 opacity-75">Requested on {new Date(selectedOrder.returnRequestedAt).toLocaleDateString()}</p>
                )}
                {selectedOrder.refundAmount > 0 && (
                  <p className="text-sm mt-1"><strong>Refund Amount:</strong> ₹{selectedOrder.refundAmount.toFixed(2)} — <em>{selectedOrder.refundStatus}</em></p>
                )}
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 pt-4 mt-4 border-t fb-border">
              {canTrackOrder(selectedOrder) && (
                <button
                  onClick={() => { closeModal(); openTrackingModal(selectedOrder); }}
                  className="px-4 py-2 rounded-full text-white font-medium transition-opacity hover:opacity-90 flex items-center gap-2 text-sm"
                  style={{ backgroundColor: 'var(--color-info)' }}
                >
                  <FiTruck size={15} /> Track Order
                </button>
              )}
              {canReturnOrder(selectedOrder) && (
                <button
                  onClick={() => { closeModal(); openReturnModal(selectedOrder); }}
                  className="px-4 py-2 rounded-full text-white font-medium transition-opacity hover:opacity-90 flex items-center gap-2 text-sm"
                  style={{ backgroundColor: 'var(--color-warning)' }}
                >
                  <FiRotateCcw size={15} /> Return Order
                </button>
              )}
              {canReviewOrder(selectedOrder) && (
                <button
                  onClick={() => { closeModal(); openRatingModal(selectedOrder); }}
                  className="px-5 py-2 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-bold transition-all hover:shadow-md flex items-center gap-2 text-sm"
                >
                  <FiStar size={15} /> Rate This Order
                </button>
              )}
              <button
                onClick={closeModal}
                className="px-5 py-2 fb-btn-secondary rounded-full text-sm font-medium"
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

      {/* Tracking Modal */}
      <UserOrderTracking
        isOpen={isTrackingModalOpen}
        onClose={closeTrackingModal}
        order={orderToTrack}
      />

      {/* Return Modal */}
      <ReturnModal
        isOpen={isReturnModalOpen}
        onClose={closeReturnModal}
        order={orderToReturn}
        onReturnSubmitted={() => { fetchAndFilterOrders(); }}
      />
    </div>
  );
};

export default UserOrdersPage;