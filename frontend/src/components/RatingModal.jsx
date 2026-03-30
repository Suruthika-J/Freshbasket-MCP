// frontend/src/components/RatingModal.jsx
import React, { useState } from 'react';
import { FiX, FiStar } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-toastify';
import Modal from './Modal';

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
        `${import.meta.env.VITE_API_URL}/api/reviews`,
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
          className={`transition-colors ${star <= (hoveredRating || rating)
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-400'
            }`}
        />
      </button>
    ));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rate Your Order"
      size="sm"
    >
      <form onSubmit={handleSubmit}>
        {/* Order Info */}
        <div className="mb-6 p-4 fb-primary-subtle rounded-xl border fb-border text-center">
          <p className="fb-text-secondary text-xs uppercase tracking-widest mb-1">Order ID</p>
          <p className="fb-text font-bold text-base tracking-wider">{order.orderId}</p>
        </div>

        {/* Star Rating */}
        <div className="mb-6">
          <label className="block text-center fb-text-secondary font-semibold mb-4">
            How would you rate this order?
          </label>
          <div className="flex justify-center items-center gap-3 mb-3">
            {renderStars()}
          </div>
          <p className="text-center fb-text-muted text-sm font-medium min-h-[20px]">
            {rating === 0 && 'Select a rating'}
            {rating === 1 && '⭐ Poor'}
            {rating === 2 && '⭐⭐ Fair'}
            {rating === 3 && '⭐⭐⭐ Good'}
            {rating === 4 && '⭐⭐⭐⭐ Very Good'}
            {rating === 5 && '⭐⭐⭐⭐⭐ Excellent!'}
          </p>
        </div>

        {/* Comment */}
        <div className="mb-6">
          <label className="block fb-text-secondary font-semibold mb-2">
            Share your experience
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us about your experience with this order..."
            className="fb-input resize-none h-32 w-full"
            maxLength="1000"
            disabled={isSubmitting}
          />
          <p className="fb-text-muted text-xs mt-1 text-right">
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
          className="fb-btn-primary w-full py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 text-base font-semibold tracking-wide mt-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Submitting...
            </>
          ) : 'Submit Review'}
        </button>
      </form>
    </Modal>
  );
};

export default RatingModal;

