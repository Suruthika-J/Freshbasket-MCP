// backend/routes/farmerRouter.js
import express from 'express';
import {
    getFarmerSummary,
    getFarmerSalesPerformance,
    getFarmerProductAnalytics,
    getFarmerOrderStatusDistribution
} from '../controllers/farmerController.js';
import authMiddleware, { requireFarmer } from '../middleware/auth.js';

const router = express.Router();

// Protect all routes with auth + farmer role check
router.use(authMiddleware, requireFarmer);

// Analytics endpoints
router.get('/analytics/summary', getFarmerSummary);
router.get('/analytics/sales', getFarmerSalesPerformance);
router.get('/analytics/products', getFarmerProductAnalytics);
router.get('/analytics/order-status', getFarmerOrderStatusDistribution);

export default router;
