// backend/routes/returnRoute.js
import express from 'express';
import {
    requestReturn,
    requestLegacyReturn,
    getReturnRequests,
    getAllReturnRequests,
    updateReturnStatus,
    updateLegacyReturnStatus,
    getMyReturns
} from '../controllers/returnController.js';
import authMiddleware, { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// ============ Customer Routes ============

// Request return for SubOrder (multi-vendor)
router.post('/request', authMiddleware, requestReturn);

// Request return for Legacy Order
router.post('/', authMiddleware, requestLegacyReturn);

// Get my returns (both SubOrder + Legacy combined)
router.get('/my-returns', authMiddleware, getMyReturns);

// ============ Admin Routes ============

// Get SubOrder returns only (farmer/admin via role check in controller)
router.get('/admin/all', authMiddleware, getReturnRequests);

// Get ALL returns combined (SubOrder + Legacy) for admin dashboard
router.get('/admin/all-combined', authMiddleware, getAllReturnRequests);

// Update SubOrder return status
router.patch('/:returnId/status', authMiddleware, updateReturnStatus);

// Update Legacy return status
router.patch('/legacy/:returnId/status', authMiddleware, updateLegacyReturnStatus);

export default router;