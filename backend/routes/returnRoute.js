// ============================================
// FILE: backend/routes/returnRoute.js
// Path: backend/routes/returnRoute.js
// ============================================

import express from 'express';
import {
    createReturnRequest,
    getUserReturnRequests,
    getReturnRequestByOrderId,
    getAllReturnRequests,
    updateReturnRequestStatus,
    deleteReturnRequest
} from '../controllers/returnController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// ============================================
// DEBUGGING MIDDLEWARE
// ============================================
router.use((req, res, next) => {
    console.log(`\n🔄 RETURN ROUTE: ${req.method} ${req.path}`);
    console.log(`   Full URL: ${req.originalUrl}`);
    next();
});

// ============================================
// USER ROUTES (Require Authentication)
// ============================================

// Create new return request
router.post('/', authMiddleware, createReturnRequest);

// Get current user's return requests
router.get('/my-requests', authMiddleware, getUserReturnRequests);

// Get return request by order ID
router.get('/order/:orderId', authMiddleware, getReturnRequestByOrderId);

// ============================================
// ADMIN ROUTES (Require Admin Authentication)
// ============================================

// Get all return requests (with filters)
router.get('/admin/all', authMiddleware, getAllReturnRequests);

// Update return request status
router.put('/admin/:id', authMiddleware, updateReturnRequestStatus);

// Delete return request
router.delete('/admin/:id', authMiddleware, deleteReturnRequest);

console.log('✅ Return request routes loaded successfully');

export default router;