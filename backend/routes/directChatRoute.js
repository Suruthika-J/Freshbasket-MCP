import express from 'express';
import {
    getAdminChatList,
    getChatMessages,
    getOrCreateFarmerConversation,
    markChatAsSeen,
    adminCreateConversation
} from '../controllers/directChatController.js';
import authMiddleware, { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// ── Admin Chat List ─────────────────────────────────────────
// GET /api/direct-chat/admin/conversations
router.get('/admin/conversations', authMiddleware, requireAdmin, getAdminChatList);

// ── Admin Create Conversation ────────────────────────────────
// POST /api/direct-chat/admin/create
router.post('/admin/create', authMiddleware, requireAdmin, adminCreateConversation);

// ── Messages for Chat ───────────────────────────────────────
// GET /api/direct-chat/messages/:chatId
router.get('/messages/:chatId', authMiddleware, getChatMessages);

// ── Farmer's Conversation ───────────────────────────────────
// GET /api/direct-chat/farmer/conversation
router.get('/farmer/conversation', authMiddleware, getOrCreateFarmerConversation);

// ── Mark Messages as Seen ────────────────────────────────────
// POST /api/direct-chat/seen/:chatId
router.post('/seen/:chatId', authMiddleware, markChatAsSeen);

export default router;
