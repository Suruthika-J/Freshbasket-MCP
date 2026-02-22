// ============================================
// FILE: backend/routes/orderRoute.js - COMPLETE WITH TRACKING
// ============================================
import express from 'express';
import {
    createOrder,
    getOrders,
    getOrderById,
    updateOrder,
    deleteOrder,
    confirmPayment,
    getOrderStats,
    assignOrderToAgent,
    generateInvoice,
    getOrderTracking,      // NEW - Tracking function
    updateAgentLocation     // NEW - Location update function
} from '../controllers/orderController.js';
import { getFarmerSubOrders } from '../controllers/subOrderController.js';
import authMiddleware, { requireFarmer } from '../middleware/auth.js';
import { requireAgent } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// GLOBAL DEBUGGING FOR ALL ORDER ROUTES - MOVED TO TOP
// ============================================
router.use((req, res, next) => {
    console.log(`\n🔍 ORDER ROUTE: ${req.method} ${req.path}`);
    console.log(`   Full URL: ${req.originalUrl}`);
    console.log(`   Params:`, req.params);
    console.log(`   Query:`, req.query);
    next();
});

// ============================================
// STATIC ROUTES - MUST BE DEFINED BEFORE PARAMETERIZED ROUTES
// ============================================

// Get farmer orders (ALIASED from sub-orders)
// This MUST be defined BEFORE /:id to prevent "farmer" being treated as an ID
router.get('/farmer', authMiddleware, requireFarmer, getFarmerSubOrders);

// Get order statistics (Admin only)
router.get('/stats', authMiddleware, getOrderStats);

// Confirm payment verification (Public - used after Stripe redirect)
router.get('/verify', confirmPayment);

// ============================================
// NEW: TRACKING ROUTES - BEFORE ID ROUTES
// ============================================

// Update agent location (Agent only - requires auth)
router.post('/agent/location', authMiddleware, requireAgent, updateAgentLocation);

// ============================================
// ROUTES WITH ID + ACTION SUFFIX - BEFORE GENERIC :id
// ============================================

// 🗺️ TRACKING ROUTE - Must come BEFORE generic /:id routes
// PUBLIC route - allows tracking without auth
router.get('/:id/track', (req, res, next) => {
    console.log('🗺️ Tracking route hit for order:', req.params.id);
    next();
}, getOrderTracking);

// 📄 INVOICE ROUTE - Must come BEFORE generic /:id routes
// Public route - allows download without auth
router.get('/:id/invoice', (req, res, next) => {
    console.log('📄 Invoice route hit for order:', req.params.id);
    next();
}, generateInvoice);

// ============================================
// ADMIN-SPECIFIC ROUTES
// ============================================

// Assign agent to order (Admin only)
router.put('/admin/:orderId/assign', (req, res, next) => {
    console.log('🎯 Assign agent route hit');
    console.log('   Order ID:', req.params.orderId);
    console.log('   Agent ID:', req.body.agentId);
    next();
}, authMiddleware, assignOrderToAgent);

// ============================================
// GENERIC CRUD ROUTES - LOWEST PRIORITY
// ============================================

// Create new order (Requires auth)
router.post('/', authMiddleware, createOrder);

// Get all orders - PUBLIC (filtering happens client-side by email)
router.get('/', getOrders);

// Update order by ID (Requires auth)
router.put('/:id', authMiddleware, updateOrder);

// Delete order by ID (Requires auth)
router.delete('/:id', authMiddleware, deleteOrder);

// Get single order by ID (Requires auth)
// IMPORTANT: This route uses the Order model (not SubOrder)
// The /farmer route above must match first!
router.get('/:id', authMiddleware, getOrderById);

console.log('✅ Order routes with tracking loaded successfully');

export default router;
