// frontend/src/components/RatingModal.jsx
import React, { useState } from 'react';
import { FiX, FiStar } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-toastify';

const RatingModal = ({ isOpen, onClose, order, onReviewSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Please select a rating');
      toast.error('Please select a rating');
      return;
    }

    if (!comment.trim()) {
      setError('Please write a comment');
      toast.error('Please write a comment');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('authToken');
      
      const response = await axios.post(
        'http://localhost:4000/api/reviews',
        {
          orderId: order._id,
          rating,
          comment: comment.trim()
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // Reset form
        setRating(0);
        setComment('');
        
        // Show success toast
        toast.success('Review submitted successfully! Thank you for your feedback.', {
          position: "bottom-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        
        // Notify parent component
        if (onReviewSubmitted) {
          onReviewSubmitted(response.data.review);
        }
        
        // Close modal
        onClose();
      }
    } catch (err) {
      console.error('Submit review error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to submit review. Please try again.';
      setError(errorMessage);
      
      // Show error toast
      toast.error(errorMessage, {
        position: "bottom-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => setRating(star)}
        onMouseEnter={() => setHoveredRating(star)}
        onMouseLeave={() => setHoveredRating(0)}
        className="focus:outline-none transition-transform hover:scale-110"
      >
        <FiStar
          size={40}
          className={`transition-colors ${
            star <= (hoveredRating || rating)
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-400'
          }`}
        />
      </button>
    ));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 rounded-2xl shadow-2xl max-w-md w-full border border-emerald-600/30">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-emerald-600/30">
          <h2 className="text-2xl font-bold text-emerald-100">
            Rate Your Order
          </h2>
          <button
            onClick={onClose}
            className="text-emerald-300 hover:text-emerald-100 transition-colors"
            disabled={isSubmitting}
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Order Info */}
          <div className="mb-6 p-4 bg-emerald-800/50 rounded-lg border border-emerald-700/50">
            <p className="text-emerald-200 text-sm mb-1">Order ID</p>
            <p className="text-emerald-100 font-medium">{order.orderId}</p>
          </div>

          {/* Star Rating */}
          <div className="mb-6">
            <label className="block text-emerald-200 font-medium mb-3">
              How would you rate this order?
            </label>
            <div className="flex justify-center gap-2 mb-2">
              {renderStars()}
            </div>
            <p className="text-center text-emerald-300 text-sm">
              {rating === 0 && 'Select a rating'}
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </p>
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label className="block text-emerald-200 font-medium mb-2">
              Share your experience
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience with this order..."
              className="w-full px-4 py-3 bg-emerald-800/50 border border-emerald-600/50 rounded-lg text-emerald-100 placeholder-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              rows="4"
              maxLength="1000"
              disabled={isSubmitting}
            />
            <p className="text-emerald-400 text-xs mt-1 text-right">
              {comment.length}/1000 characters
            </p>
          </div>

          {/* Error Message (optional inline error display) */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-700 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-emerald-500/50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RatingModal;

