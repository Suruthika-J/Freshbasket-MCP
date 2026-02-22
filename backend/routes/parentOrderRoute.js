// backend/routes/parentOrderRoute.js
// Parent Order Routes - Multi-vendor order management

import express from 'express';
import {
    createParentOrder,
    confirmParentOrderPayment,
    getParentOrderById,
    getCustomerParentOrders,
    getAllParentOrders
} from '../controllers/parentOrderController.js';
import authMiddleware, { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// CUSTOMER ROUTES (Authenticated)
// ============================================

// Create new parent order (multi-vendor checkout)
router.post('/', authMiddleware, createParentOrder);

// Confirm payment after Stripe checkout
router.post('/confirm-payment', authMiddleware, confirmParentOrderPayment);

// Get customer's own parent orders
router.get('/my-orders', authMiddleware, getCustomerParentOrders);

// Get specific parent order by ID
router.get('/:id', authMiddleware, getParentOrderById);

// ============================================
// ADMIN ROUTES
// ============================================

// Get all parent orders (admin only)
router.get('/admin/all', authMiddleware, requireAdmin, getAllParentOrders);

export default router;
