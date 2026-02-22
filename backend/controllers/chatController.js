// backend/controllers/chatController.js
// ============================================================
// CHAT CONTROLLERS — Customer (Recipe) & Farmer (Market Price)
// Both use the shared AI service with role-based system prompts
// ============================================================

import { chat, clearSession, getServiceStatus } from '../services/grokService.js';

// ── Helper: Generate session ID ─────────────────────────────
const getSessionId = (req) => {
    // Use token-based session if authenticated, fallback to IP
    return req.headers.token || req.headers.authorization || req.ip || 'anonymous';
};

// ── Health Check ────────────────────────────────────────────
export const healthCheck = (req, res) => {
    const status = getServiceStatus();
    res.json({
        status: status.isReady ? 'healthy' : 'unhealthy',
        hasApiKey: status.hasApiKey,
        provider: status.provider,
        error: status.error,
        roles: ['customer', 'farmer'],
        timestamp: new Date().toISOString(),
    });
};

// ============================================================
// CUSTOMER CHAT — Recipe Assistant
// POST /api/chat/customer
// ============================================================
export const customerChat = async (req, res) => {
    console.log('\n🍳 ===== CUSTOMER RECIPE CHAT =====');
    console.log('⏰ Time:', new Date().toISOString());

    try {
        const status = getServiceStatus();
        if (!status.isReady) {
            return res.status(503).json({
                success: false,
                error: 'AI service is not available.',
                details: status.error,
                hint: 'Check if GROK_API_KEY is set in .env file',
            });
        }

        const { message } = req.body;

        // Validate
        if (!message || typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Message is required and must be a non-empty string.',
            });
        }

        const sessionId = getSessionId(req);
        console.log('📝 Customer message:', message.substring(0, 100));
        console.log('🔗 Session:', sessionId.substring(0, 20) + '...');

        const result = await chat('customer', message.trim(), sessionId);

        if (result.success) {
            return res.json({
                success: true,
                response: result.response,
                role: 'customer',
                timestamp: new Date().toISOString(),
            });
        } else {
            return res.status(result.statusCode || 500).json({
                success: false,
                error: result.error,
                hint: result.hint,
            });
        }
    } catch (error) {
        console.error('❌ Customer chat error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to process your request. Please try again.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

// ============================================================
// FARMER CHAT — Market Price Assistant
// POST /api/chat/farmer
// ============================================================
export const farmerChat = async (req, res) => {
    console.log('\n🌾 ===== FARMER MARKET PRICE CHAT =====');
    console.log('⏰ Time:', new Date().toISOString());

    try {
        const status = getServiceStatus();
        if (!status.isReady) {
            return res.status(503).json({
                success: false,
                error: 'AI service is not available.',
                details: status.error,
                hint: 'Check if GROK_API_KEY is set in .env file',
            });
        }

        const { message, language } = req.body;

        // Validate
        if (!message || typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Message is required and must be a non-empty string.',
            });
        }

        const sessionId = getSessionId(req);

        // Enhance the message with language context if voice input detected
        let enhancedMessage = message.trim();
        if (language && language !== 'en-IN') {
            enhancedMessage = `[Language: ${language}] ${enhancedMessage}`;
        }

        console.log('📝 Farmer message:', enhancedMessage.substring(0, 100));
        console.log('🗣️ Language:', language || 'auto');
        console.log('🔗 Session:', sessionId.substring(0, 20) + '...');

        const result = await chat('farmer', enhancedMessage, sessionId);

        if (result.success) {
            return res.json({
                success: true,
                response: result.response,
                role: 'farmer',
                language: language || 'auto',
                timestamp: new Date().toISOString(),
            });
        } else {
            return res.status(result.statusCode || 500).json({
                success: false,
                error: result.error,
                hint: result.hint,
            });
        }
    } catch (error) {
        console.error('❌ Farmer chat error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to process your request. Please try again.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

// ============================================================
// CLEAR CHAT HISTORY
// POST /api/chat/clear
// ============================================================
export const clearChat = (req, res) => {
    const { role } = req.body;
    const sessionId = getSessionId(req);

    if (role) {
        clearSession(role, sessionId);
    } else {
        clearSession('customer', sessionId);
        clearSession('farmer', sessionId);
    }

    res.json({
        success: true,
        message: 'Chat history cleared.',
    });
};
