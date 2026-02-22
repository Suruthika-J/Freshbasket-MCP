// backend/routes/chatbot.js
// ============================================================
// LEGACY CHATBOT ROUTE (redirects to unified /api/chat routes)
// Kept for backward compatibility
// ============================================================

import express from 'express';
import { customerChat, healthCheck } from '../controllers/chatController.js';

const router = express.Router();

// Legacy health check → same handler
router.get('/health', healthCheck);

// Legacy /api/chatbot/recipe → same handler as /api/chat/customer
router.post('/recipe', customerChat);

export default router;
