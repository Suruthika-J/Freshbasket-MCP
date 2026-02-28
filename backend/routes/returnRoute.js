// backend/routes/returnRoute.js
import express from 'express';
import {
    requestReturn,
    getReturnRequests,
    updateReturnStatus,
    getMyReturns
} from '../controllers/returnController.js';
import authMiddleware, { requireAdmin, requireFarmer } from '../middleware/auth.js';

const router = express.Router();

// Customer routes
router.post('/request', authMiddleware, requestReturn);
router.get('/my-returns', authMiddleware, getMyReturns);

// Admin/Farmer routes
router.get('/admin/all', authMiddleware, getReturnRequests); // both admin and farmer work through controller role check
router.patch('/:returnId/status', authMiddleware, updateReturnStatus);

export default router;