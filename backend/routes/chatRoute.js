// backend/routes/chatRoute.js
// ============================================================
// UNIFIED CHAT ROUTES
// Routes for both Customer (recipe) and Farmer (market price) chatbots
// ============================================================

import express from 'express';
import {
    healthCheck,
    customerChat,
    farmerChat,
    clearChat,
} from '../controllers/chatController.js';

const router = express.Router();

// ── Health Check ────────────────────────────────────────────
// GET /api/chat/health
router.get('/health', healthCheck);

// ── Customer Routes ─────────────────────────────────────────
// POST /api/chat/customer
router.post('/customer', customerChat);

// ── Farmer Routes ───────────────────────────────────────────
// POST /api/chat/farmer
router.post('/farmer', farmerChat);

// ── Clear History ───────────────────────────────────────────
// POST /api/chat/clear
router.post('/clear', clearChat);

export default router;
