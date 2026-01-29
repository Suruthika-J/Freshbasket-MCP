// backend/controllers/reviewController.js
import Review from '../models/reviewModel.js';
import Order from '../models/orderModel.js';

// Add a new review
export const addReview = async (req, res) => {
  try {
    const { orderId, rating, comment } = req.body;
    const userId = req.user._id;
    const userName = req.user.name;
    const userEmail = req.user.email;

    // Validate input
    if (!orderId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Order ID, rating, and comment are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify order belongs to user
    if (order.customer.email !== userEmail) {
      return res.status(403).json({
        success: false,
        message: 'You can only review your own orders'
      });
    }

    // Check if order is delivered
    if (order.status !== 'Delivered') {
      return res.status(400).json({
        success: false,
        message: 'You can only review delivered orders'
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ orderId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this order'
      });
    }

    // Create review
    const review = new Review({
      orderId,
      userId,
      userName,
      userEmail,
      rating,
      comment,
      items: order.items.map(item => ({
        productId: item.productId,
        name: item.name,
        imageUrl: item.imageUrl
      }))
    });

    await review.save();

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review
    });

  } catch (err) {
    console.error('Add review error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to submit review',
      error: err.message
    });
  }
};

// Get all reviews (with optional filters)
export const getReviews = async (req, res) => {
  try {
    const { userId, orderId, minRating, limit = 50, page = 1 } = req.query;

    const filter = {};
    
    if (userId) filter.userId = userId;
    if (orderId) filter.orderId = orderId;
    if (minRating) filter.rating = { $gte: parseInt(minRating) };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('orderId', 'orderId total status date');

    const total = await Review.countDocuments(filter);

    res.status(200).json({
      success: true,
      reviews,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (err) {
    console.error('Get reviews error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: err.message
    });
  }
};

// Get review by order ID
// backend/controllers/reviewController.js

// Get review by order ID
export const getReviewByOrderId = async (req, res) => {
  try {
    // This param is the Order's _id, sent from the frontend
    const { orderId } = req.params; 

    // Find the review directly. 
    // The Review schema's 'orderId' field holds the Order's _id.
    const review = await Review.findOne({ orderId: orderId });

    if (!review) {
      // This is now the *correct* 404, firing only if no *review* exists.
      return res.status(404).json({
        success: false,
        message: 'No review found for this order'
      });
    }

    // Success!
    res.status(200).json({
      success: true,
      review
    });

  } catch (err) {
    console.error('Get review by order error:', err);
    // Handle invalid ID formats (e.g., "abc")
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid Order ID format' });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review',
      error: err.message
    });
  }
};

// Get user's reviews
export const getUserReviews = async (req, res) => {
  try {
    const userId = req.user._id;

    const reviews = await Review.find({ userId })
      .sort({ createdAt: -1 })
      .populate('orderId', 'orderId total status date');

    res.status(200).json({
      success: true,
      reviews
    });

  } catch (err) {
    console.error('Get user reviews error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your reviews',
      error: err.message
    });
  }
};

// Update review
export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Verify review belongs to user
    if (review.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own reviews'
      });
    }

    if (rating) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }
      review.rating = rating;
    }

    if (comment) {
      review.comment = comment;
    }

    await review.save();

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      review
    });

  } catch (err) {
    console.error('Update review error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update review',
      error: err.message
    });
  }
};

// Delete review
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Verify review belongs to user
    if (review.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own reviews'
      });
    }

    await Review.findByIdAndDelete(reviewId);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (err) {
    console.error('Delete review error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: err.message
    });
  }
};