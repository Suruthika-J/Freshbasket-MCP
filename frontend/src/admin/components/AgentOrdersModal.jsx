// admin/src/components/AgentOrdersModal.jsx
import React from 'react';
import { FiX, FiPackage, FiUser, FiPhone, FiMail, FiMapPin, FiCalendar, FiDollarSign } from 'react-icons/fi';

const AgentOrdersModal = ({ isOpen, onClose, agent, orders }) => {
  if (!isOpen) return null;

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Processing': 'bg-blue-100 text-blue-800 border-blue-200',
      'Shipped': 'bg-purple-100 text-purple-800 border-purple-200',
      'Delivered': 'bg-green-100 text-green-800 border-green-200',
      'Cancelled': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPaymentColor = (status) => {
    return status === 'Paid' 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-orange-100 text-orange-800 border-orange-200';
  };

  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center text-white">
            <div className="bg-white bg-opacity-20 rounded-full p-3 mr-4">
              <FiUser size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {agent?.name}'s Orders
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                {agent?.email} • {agent?.phone || 'No phone'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Stats Summary */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{orders.length}</p>
                </div>
                <div className="bg-blue-100 rounded-full p-3">
                  <FiPackage className="text-blue-600" size={20} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Delivered</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {orders.filter(o => o.status === 'Delivered').length}
                  </p>
                </div>
                <div className="bg-green-100 rounded-full p-3">
                  <FiPackage className="text-green-600" size={20} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {orders.filter(o => ['Pending', 'Processing', 'Shipped'].includes(o.status)).length}
                  </p>
                </div>
                <div className="bg-blue-100 rounded-full p-3">
                  <FiPackage className="text-blue-600" size={20} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    ₹{totalRevenue.toFixed(2)}
                  </p>
                </div>
                <div className="bg-purple-100 rounded-full p-3">
                  <FiDollarSign className="text-purple-600" size={20} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto p-6">
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <FiPackage className="text-gray-400" size={40} />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Orders Assigned</h3>
              <p className="text-gray-500">
                This agent hasn't been assigned any orders yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order._id}
                  className="bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow duration-200"
                >
                  {/* Order Header */}
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-100 rounded-lg p-3">
                        <FiPackage className="text-blue-600" size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          Order #{order.orderId}
                        </h3>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <FiCalendar className="mr-1" size={14} />
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPaymentColor(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                    </div>
                  </div>

                  {/* Order Content */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left Column - Customer Info */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                          <FiUser className="mr-2" />
                          Customer Details
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                          <div className="flex items-start">
                            <FiUser className="text-gray-400 mr-2 mt-1 flex-shrink-0" size={16} />
                            <div>
                              <p className="text-sm text-gray-600">Name</p>
                              <p className="font-medium text-gray-900">{order.customer?.name || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <FiPhone className="text-gray-400 mr-2 mt-1 flex-shrink-0" size={16} />
                            <div>
                              <p className="text-sm text-gray-600">Phone</p>
                              <p className="font-medium text-gray-900">{order.customer?.phone || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <FiMail className="text-gray-400 mr-2 mt-1 flex-shrink-0" size={16} />
                            <div>
                              <p className="text-sm text-gray-600">Email</p>
                              <p className="font-medium text-gray-900 break-all">{order.customer?.email || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <FiMapPin className="text-gray-400 mr-2 mt-1 flex-shrink-0" size={16} />
                            <div>
                              <p className="text-sm text-gray-600">Address</p>
                              <p className="font-medium text-gray-900">{order.customer?.address || 'N/A'}</p>
                            </div>
                          </div>
                        </div>

                        {order.notes && (
                          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-blue-900 mb-2">Delivery Notes</h4>
                            <p className="text-sm text-blue-800">{order.notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Right Column - Order Items & Payment */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                          <FiPackage className="mr-2" />
                          Order Items ({order.items?.length || 0})
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-3 max-h-64 overflow-y-auto">
                          {order.items?.map((item, index) => (
                            <div key={index} className="flex items-center space-x-3 bg-white p-3 rounded-lg border border-gray-200">
                              {item.imageUrl ? (
                                <img
                                  src={`http://localhost:4000${item.imageUrl}`}
                                  alt={item.name}
                                  className="w-12 h-12 object-cover rounded-lg"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                  <FiPackage className="text-gray-400" size={20} />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">{item.name}</p>
                                <p className="text-sm text-gray-600">
                                  ₹{item.price?.toFixed(2)} × {item.quantity}
                                </p>
                              </div>
                              <div className="font-semibold text-gray-900">
                                ₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Payment Summary */}
                        <div className="mt-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Payment Method:</span>
                              <span className="font-medium text-gray-900">{order.paymentMethod || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Subtotal:</span>
                              <span className="font-medium text-gray-900">₹{order.total?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Shipping:</span>
                              <span className="font-medium text-green-600">
                                {order.shipping > 0 ? `₹${order.shipping.toFixed(2)}` : 'Free'}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Tax (5%):</span>
                              <span className="font-medium text-gray-900">
                                ₹{((order.total || 0) * 0.05).toFixed(2)}
                              </span>
                            </div>
                            <div className="pt-2 border-t border-gray-300 flex justify-between">
                              <span className="text-base font-bold text-gray-900">Total:</span>
                              <span className="text-lg font-bold text-blue-600">
                                ₹{((order.total || 0) * 1.05).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentOrdersModal;