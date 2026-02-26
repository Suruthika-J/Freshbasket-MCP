import React, { useState } from 'react';
import axios from 'axios';
import { FiRotateCcw, FiAlertTriangle, FiPackage } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Modal from './Modal';

const ReturnModal = ({ isOpen, onClose, order, onReturnSubmitted }) => {
  const [reason, setReason] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason.trim()) {
      setError('Please select a reason for return');
      toast.error('Please select a reason for return');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken');

      const response = await axios.post(
        `${apiUrl}/api/returns`,
        {
          orderId: order._id,
          reason: reason,
          additionalNotes: additionalNotes.trim()
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success('Return request submitted successfully');
        onReturnSubmitted && onReturnSubmitted();
        onClose();
      } else {
        setError('Failed to submit return request. Please try again.');
        toast.error('Failed to submit return request');
      }
    } catch (err) {
      console.error('Error submitting return request:', err);
      const errorMessage = err.response?.data?.message || 'Failed to submit return request. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Return Order"
      size="sm"
    >
      <form onSubmit={handleSubmit}>
        {/* Order Details Summary */}
        <div className="mb-6 p-4 fb-primary-subtle rounded-xl border fb-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 fb-surface rounded-lg">
              <FiPackage className="fb-text-primary" />
            </div>
            <h3 className="font-bold fb-text">Order Details</h3>
          </div>
          <div className="space-y-1">
            <p className="fb-text-secondary text-sm flex justify-between">
              <span>Order ID:</span>
              <span className="font-mono font-medium">{order.orderId}</span>
            </p>
            <p className="fb-text-secondary text-sm flex justify-between">
              <span>Total Amount:</span>
              <span className="font-semibold fb-text-primary">₹{order.total.toFixed(2)}</span>
            </p>
            <p className="fb-text-secondary text-sm flex justify-between">
              <span>Items count:</span>
              <span>{order.items.length} units</span>
            </p>
          </div>
        </div>

        {/* Reason Selection */}
        <div className="mb-4">
          <label className="block fb-text-secondary font-semibold mb-2">
            Reason for Return <span className="text-red-500">*</span>
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="fb-input"
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

        {/* Notes */}
        <div className="mb-6">
          <label className="block fb-text-secondary font-semibold mb-2">
            Additional Notes (Optional)
          </label>
          <textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Please provide any additional details that might help us..."
            className="fb-input resize-none h-24"
          />
        </div>

        {/* Inline Error */}
        {error && (
          <div className="mb-4 p-3 fb-badge-error rounded-lg flex items-center gap-2 border border-red-200">
            <FiAlertTriangle className="flex-shrink-0" size={16} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 fb-btn-secondary py-2.5 text-sm"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 fb-btn-primary py-2.5 text-sm shadow-lg overflow-hidden relative"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </div>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <FiRotateCcw />
                Submit Request
              </span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ReturnModal;
