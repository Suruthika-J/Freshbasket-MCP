// backend/server.js - COMPLETE UPDATED VERSION
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';

// Pre-load all models to avoid population/registration issues
import './models/userModel.js';
import './models/productModel.js';
import './models/ParentOrderModel.js';
import './models/SubOrderModel.js';
import './models/deliveryAgentModel.js';

import returnRouter from './routes/returnRoute.js';

// Middleware
import authMiddleware from './middleware/auth.js';

// Routers
import cartRouter from './routes/cartRoute.js';
import chatbotRouter from './routes/chatbot.js';
import chatRouter from './routes/chatRoute.js';
import deliveryAgentRouter from './routes/deliveryAgentRoute.js';
import orderRouter from './routes/orderRoute.js';
import productRouter from './routes/productRoute.js';
import userRouter from './routes/userRoute.js';
import reviewRouter from './routes/reviewRoute.js';

// Multi-vendor order routes
import parentOrderRouter from './routes/parentOrderRoute.js';
import subOrderRouter from './routes/subOrderRoute.js';

// Voice transcription route
import voiceRouter from './routes/voiceRoute.js';

// ============================================
// INITIAL ENVIRONMENT CHECK
// ============================================
console.log('\n🔍 Environment Check:');
console.log('  - GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Found' : '❌ Missing');
console.log('  - JWT_SECRET:', process.env.JWT_SECRET ? '✅ Found' : '❌ Missing');
console.log('  - MONGODB_URI:', (process.env.MONGODB_URI || process.env.MONGO_USER) ? '✅ Found' : '❌ Missing');
console.log('  - PORT:', process.env.PORT || 4000);
console.log('  - NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('');

// ============================================
// APP & SERVER CONFIGURATION
// ============================================
const app = express();
const port = process.env.PORT || 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// CORE MIDDLEWARE (Order is important)
// ============================================

// 1. CORS Configuration (Handles cross-origin requests first)
app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);

            const allowedOrigins = [
                'http://localhost:5173',
                'http://localhost:5174',
                'http://localhost:3000',
                'https://accounts.google.com',
            ];

            if (process.env.NODE_ENV !== 'production') {
                console.log('✅ CORS: Allowing development origin:', origin);
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                console.log('⚠️ CORS blocked origin:', origin);
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'token', 'X-Requested-With', 'Accept', 'Origin'],
        optionsSuccessStatus: 204,
        exposedHeaders: ['Cross-Origin-Opener-Policy']
    })
);

// Add COOP header middleware
app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    next();
});

// 2. Body Parsers (To parse JSON payloads)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. Global Loggers (BEFORE routes are mounted)
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`📨 ${req.method} ${req.path}`);
        if (req.body && Object.keys(req.body).length > 0) {
            console.log('  Body:', JSON.stringify(req.body).substring(0, 150) + '...');
        }
        next();
    });
}

// Global logger specifically for order routes
app.use((req, res, next) => {
    if (req.url.includes('/orders')) {
        console.log(`🌐 ${req.method} ${req.url}`);
    }
    next();
});

// ============================================
// DATABASE CONNECTION (Handled in startServer)
// ============================================

// ============================================
// STATIC FILE SERVING
// ============================================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// API ROUTES (Order matters for overlapping paths)
// ============================================

// User authentication routes
app.use("/api/user", userRouter);

// Product routes (dual mounting for compatibility)
app.use('/api/items', productRouter);
app.use('/api/products', productRouter);

// Multi-vendor order routes (NEW)
app.use('/api/parent-orders', parentOrderRouter);
app.use('/api/sub-orders', subOrderRouter);

// Legacy order routes (maintained for backward compatibility)
app.use('/api/orders', orderRouter);

// Chatbot routes (legacy)
app.use('/api/chatbot', chatbotRouter);

// New unified chat routes (customer + farmer)
app.use('/api/chat', chatRouter);

// Review routes
app.use('/api/reviews', reviewRouter);

// Voice transcription routes
app.use('/api/voice', voiceRouter);

// Return routes
app.use('/api/returns', returnRouter);

// Delivery Agent routes
app.use('/api', deliveryAgentRouter);

// Protected cart routes (require auth)
app.use('/api/cart', authMiddleware, cartRouter);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'RushBasket API is running smoothly',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            users: '/api/user',
            products: '/api/products',
            orders: '/api/orders',
            cart: '/api/cart',
            agents: '/api/agents',
            reviews: '/api/reviews',
            chat: '/api/chat',
            chatbot: '/api/chatbot (legacy)',
            returns: '/api/returns'
        }
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is healthy',
        timestamp: new Date().toISOString()
    });
});

// 404 Handler (runs if no other route matches)
app.use((req, res) => {
    console.log('❌ 404 Not Found:', req.method, req.path);
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.path} not found`
    });
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
    console.error('❌ Global Error Handler:', err.message);
    console.error('Stack:', err.stack);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'An internal server error occurred',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// ============================================
// START SERVER
// ============================================
const startServer = async () => {
    try {
        await connectDB();

        app.listen(port, '0.0.0.0', () => {
            console.log('\n🚀 ========================================');
            console.log(`✅ Server running on http://localhost:${port}`);
            console.log(`🌐 Also accessible on http://0.0.0.0:${port} (for mobile testing)`);
            console.log(`📍 API Base: http://localhost:${port}/api`);
            console.log(`📦 Products: http://localhost:${port}/api/items`);
            console.log(`🛒 Cart: http://localhost:${port}/api/cart`);
            console.log(`📋 Orders: http://localhost:${port}/api/orders`);
            console.log(`🚚 Agents: http://localhost:${port}/api/agents`);
            console.log('========================================\n');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

startServer();

export default app;