import React, { useState } from 'react';
import axios from 'axios';
import { FiX, FiRotateCcw, FiAlertTriangle } from 'react-icons/fi';

const ReturnModal = ({ isOpen, onClose, order, onReturnSubmitted }) => {
  const [reason, setReason] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason.trim()) {
      setError('Please select a reason for return');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const returnRequest = {
        orderId: order._id,
        reason: reason,
        additionalNotes: additionalNotes.trim(),
        customerEmail: order.customer.email,
        customerName: order.customer.name,
        items: order.items,
        totalAmount: order.total
      };

      const token = localStorage.getItem('authToken');

      const response = await axios.post(
        'http://localhost:4000/api/returns',
        {
          orderId: order._id,
          reason: reason
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        onReturnSubmitted && onReturnSubmitted();
        onClose();
      } else {
        setError('Failed to submit return request. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting return request:', err);
      const errorMessage = err.response?.data?.message || 'Failed to submit return request. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-emerald-900 border border-emerald-700 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-emerald-100 flex items-center gap-2">
              <FiRotateCcw className="text-orange-400" />
              Return Order
            </h2>
            <button
              onClick={onClose}
              className="text-emerald-400 hover:text-emerald-200 transition-colors"
            >
              <FiX size={24} />
            </button>
          </div>

          <div className="mb-6">
            <div className="bg-emerald-800/50 border border-emerald-600/50 rounded-lg p-4">
              <h3 className="font-medium text-emerald-100 mb-2">Order Details</h3>
              <p className="text-emerald-300 text-sm">Order ID: {order.orderId}</p>
              <p className="text-emerald-300 text-sm">Total: ₹{order.total.toFixed(2)}</p>
              <p className="text-emerald-300 text-sm">Items: {order.items.length}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-emerald-100 font-medium mb-2">
                Reason for Return *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-emerald-800 border border-emerald-600 rounded-lg px-3 py-2 text-emerald-100 focus:outline-none focus:border-emerald-400"
                required
              >
                <option value="">Select a reason</option>
                <option value="Defective product">Defective product</option>
                <option value="Wrong item received">Wrong item received</option>
                <option value="Not as described">Not as described</option>
                <option value="Changed mind">Changed mind</option>
                <option value="Damaged packaging">Damaged packaging</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-emerald-100 font-medium mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Please provide any additional details..."
                className="w-full bg-emerald-800 border border-emerald-600 rounded-lg px-3 py-2 text-emerald-100 focus:outline-none focus:border-emerald-400 resize-none"
                rows={3}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2">
                <FiAlertTriangle className="text-red-400 flex-shrink-0" size={16} />
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 rounded-lg font-medium transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Return Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReturnModal;
