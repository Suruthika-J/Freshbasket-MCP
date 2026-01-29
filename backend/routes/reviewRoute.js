// backend/routes/reviewRoute.js
import express from 'express';
import {
  addReview,
  getReviews,
  getReviewByOrderId,
  getUserReviews,
  updateReview,
  deleteReview
} from '../controllers/reviewController.js';
import authMiddleware from '../middleware/auth.js';

const reviewRouter = express.Router();

// Public routes
reviewRouter.get('/', getReviews); // Get all reviews with filters

// Protected routes (require authentication)
reviewRouter.post('/', authMiddleware, addReview); // Submit a review
reviewRouter.get('/my-reviews', authMiddleware, getUserReviews); // Get user's reviews
reviewRouter.get('/order/:orderId', getReviewByOrderId); // Get review for specific order
reviewRouter.put('/:reviewId', authMiddleware, updateReview); // Update a review
reviewRouter.delete('/:reviewId', authMiddleware, deleteReview); // Delete a review

export default reviewRouter;