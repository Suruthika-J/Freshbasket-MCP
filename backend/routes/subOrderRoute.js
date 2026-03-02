// backend/routes/subOrderRoute.js
// Sub Order Routes - Vendor-specific order management

import express from 'express';
import {
    getSubOrderById,
    getFarmerSubOrders,
    getAgentSubOrders,
    updateSubOrderStatus,
    updateSubOrderPaymentStatus,
    getAllSubOrders,
    getPendingDeliveryRequests,
    assignDeliveryAgent,
    unassignDeliveryAgent,
    updateAgentLocation
} from '../controllers/subOrderController.js';
import authMiddleware, { requireAdmin, requireFarmer, requireAgent } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// FARMER ROUTES
// ============================================

// Get farmer's sub-orders
router.get('/farmer/my-orders', authMiddleware, requireFarmer, getFarmerSubOrders);

// ============================================
// DELIVERY AGENT ROUTES
// ============================================

// Requested API: Fetch assigned sub-orders for delivery agent
router.get('/delivery-agent', authMiddleware, requireAgent, getAgentSubOrders);

// Legacy: Get agent's assigned sub-orders
router.get('/agent/my-deliveries', authMiddleware, requireAgent, getAgentSubOrders);

// Update agent location for tracking
router.post('/agent/update-location', authMiddleware, requireAgent, updateAgentLocation);

// ============================================
// ADMIN ROUTES
// ============================================

// Requested API: Assign delivery agent to farmer sub-order
router.patch('/:subOrderId/assign-delivery-agent', authMiddleware, requireAdmin, assignDeliveryAgent);

// Get all sub-orders with optional filters
router.get('/admin/all', authMiddleware, requireAdmin, getAllSubOrders);

// Get pending delivery requests (unassigned)
router.get('/admin/pending-deliveries', authMiddleware, requireAdmin, getPendingDeliveryRequests);

// Legacy: Assign delivery agent to sub-order
router.post('/admin/assign-agent', authMiddleware, requireAdmin, assignDeliveryAgent);

// Unassign delivery agent from sub-order
router.delete('/admin/unassign-agent/:id', authMiddleware, requireAdmin, unassignDeliveryAgent);

// ============================================
// COMMON ROUTES (Role-based access within controller)
// ============================================

// Get specific sub-order by ID (role-based access)
router.get('/:id', authMiddleware, getSubOrderById);

// Update sub-order status (role-based: farmer/agent/admin)
router.patch('/:id/status', authMiddleware, updateSubOrderStatus);

// Update sub-order payment status (role-based)
router.patch('/:id/payment-status', authMiddleware, updateSubOrderPaymentStatus);

export default router;
