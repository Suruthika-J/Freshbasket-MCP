// backend/routes/deliveryAgentRoute.js - CORRECTED
import express from 'express';
import {
    createDeliveryAgent,
    getAllAgents,
    getAgentById,
    updateAgentStatus,
    deleteAgent,
    agentLogin,
    getAgentOrders,
    updateDeliveryStatus
} from '../controllers/deliveryAgentController.js';
import authMiddleware, { requireAgent } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// PUBLIC ROUTES
// ============================================

// Agent login
router.post('/agents/login', agentLogin);

// ============================================
// ADMIN ROUTES (NO JWT - Admin panel has its own session-based auth)
// ============================================

// Create new delivery agent (Admin panel only)
router.post('/agents', createDeliveryAgent);

// Get all delivery agents
router.get('/agents', getAllAgents);

// Get single agent by ID with assigned orders
router.get('/agents/:id', getAgentById);

// Update agent status (activate/deactivate)
router.patch('/agents/:id/status', updateAgentStatus);

// Delete delivery agent
router.delete('/agents/:id', deleteAgent);

// ============================================
// AGENT PROTECTED ROUTES (Require JWT Auth + Agent Role)
// ============================================

// FIXED: Changed from /agents/me/orders to /agent/orders
router.get('/agent/orders', authMiddleware, requireAgent, getAgentOrders);

// FIXED: Changed from /agents/orders/:orderId/status to /agent/orders/:orderId/status
router.patch('/agent/orders/:orderId/status', authMiddleware, requireAgent, updateDeliveryStatus);

export default router;