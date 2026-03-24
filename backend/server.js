// backend/server.js - COMPLETE UPDATED VERSION WITH SOCKET.IO
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { connectDB } from './config/db.js';

// Pre-load all models to avoid population/registration issues
import './models/userModel.js';
import './models/productModel.js';
import './models/ParentOrderModel.js';
import './models/SubOrderModel.js';
import './models/deliveryAgentModel.js';
import Conversation from './models/Conversation.js';
import Message from './models/Message.js';

// Pre-load return models
import './models/returnRequestModel.js';
import './models/ReturnModel.js';

import returnRouter from './routes/returnRoute.js';

// Middleware
import authMiddleware from './middleware/auth.js';

// Routers
import cartRouter from './routes/cartRoute.js';
import chatbotRouter from './routes/chatbot.js';
import chatRouter from './routes/chatRoute.js';
import directChatRouter from './routes/directChatRoute.js';
import deliveryAgentRouter from './routes/deliveryAgentRoute.js';
import orderRouter from './routes/orderRoute.js';
import productRouter from './routes/productRoute.js';
import userRouter from './routes/userRoute.js';
import User from './models/userModel.js';
import reviewRouter from './routes/reviewRoute.js';

// Multi-vendor order routes
import parentOrderRouter from './routes/parentOrderRoute.js';
import subOrderRouter from './routes/subOrderRoute.js';

// Farmer specific routes
import farmerRouter from './routes/farmerRouter.js';

// Voice transcription route
import voiceRouter from './routes/voiceRoute.js';

// ============================================
// APP & SERVER CONFIGURATION
// ============================================
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: [
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:3000',
        ],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: true
    }
});
const port = process.env.PORT || 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// CORE MIDDLEWARE (Order is important)
// ============================================

// 1. CORS Configuration
app.use(
    cors({
        origin: function (origin, callback) {
            // Allow all origins in development
            if (process.env.NODE_ENV !== 'production') {
                return callback(null, true);
            }

            if (!origin) return callback(null, true);

            const allowedOrigins = [
                'http://localhost:5173',
                'http://localhost:5174',
                'http://localhost:3000',
                'https://accounts.google.com',
            ];

            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'token', 'X-Requested-With', 'Accept', 'Origin'],
        optionsSuccessStatus: 204
    })
);

app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    next();
});

// 2. Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. Static File Serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// SOCKET.IO LOGIC
// ============================================
io.use(async (socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.token;
    if (!token) {
        return next(new Error('Authentication error: No token provided'));
    }

    try {
        if (typeof token === 'string' && token.startsWith('admin-session-token-')) {
            // Find a real admin user from DB for mock session
            const admin = await User.findOne({ role: 'admin' });
            if (admin) {
                socket.user = { id: admin._id.toString(), role: 'admin' };
            } else {
                // Fallback if no admin in DB - must be a valid 24-char hex string
                socket.user = { id: '507f1f77bcf86cd799439011', role: 'admin' };
            }
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_here');
        socket.user = { id: decoded.id || decoded.userId, role: decoded.role };
        next();
    } catch (err) {
        return next(new Error('Authentication error: Invalid token'));
    }
});

io.on('connection', (socket) => {
    console.log(`🔌 New socket connection: ${socket.id} (User: ${socket.user.id}, Role: ${socket.user.role})`);

    socket.on('joinChat', (chatId) => {
        socket.join(chatId);
        console.log(`👤 User ${socket.user.id} joined chat room: ${chatId}`);
    });

    socket.on('sendMessage', async (data) => {
        if (!data || typeof data !== 'object') {
            console.error('❌ Socket Error: Malformed data in sendMessage');
            return;
        }

        const { chatId, text } = data;
        const senderId = socket.user?.id;
        const senderRole = socket.user?.role;

        try {
            const newMessage = await Message.create({
                chatId,
                senderId,
                senderRole,
                text
            });

            const conversation = await Conversation.findByIdAndUpdate(chatId, {
                lastMessage: newMessage._id,
                $inc: senderRole === 'admin' ? { unreadCountFarmer: 1 } : { unreadCountAdmin: 1 }
            }, { new: true });

            // Emit to the room
            io.to(chatId).emit('receiveMessage', newMessage);

            // Also emit an update to the chat list (for admin)
            if (senderRole === 'farmer') {
                io.emit('chatListUpdate', { chatId, lastMessage: newMessage, unreadCountAdmin: conversation.unreadCountAdmin });
            } else {
                io.to(chatId).emit('chatListUpdate', { chatId, lastMessage: newMessage, unreadCountFarmer: conversation.unreadCountFarmer });
            }

        } catch (error) {
            console.error('Error in sendMessage socket event:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
});

// ============================================
// API ROUTES
// ============================================
app.use("/api/user", userRouter);
app.use('/api/items', productRouter);
app.use('/api/products', productRouter);
app.use('/api/parent-orders', parentOrderRouter);
app.use('/api/sub-orders', subOrderRouter);
app.use('/api/orders', orderRouter);
app.use('/api/farmer', farmerRouter);
app.use('/api/chatbot', chatbotRouter);
app.use('/api/chat', chatRouter);
app.use('/api/direct-chat', directChatRouter); // Added
app.use('/api/reviews', reviewRouter);
app.use('/api/voice', voiceRouter);
app.use('/api/returns', returnRouter);
app.use('/api', deliveryAgentRouter);
app.use('/api/cart', authMiddleware, cartRouter);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'RushBasket API is running smoothly',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Server is healthy', timestamp: new Date().toISOString() });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
    const errorMsg = err?.message || err || 'Internal Server Error';
    console.error('❌ Global Error Handler:', errorMsg);
    res.status(err?.status || 500).json({
        success: false,
        message: errorMsg,
    });
});

// ============================================
// START SERVER
// ============================================
const startServer = async () => {
    try {
        await connectDB();

        // Handle port conflicts gracefully
        httpServer.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`\n❌ ERROR: Port ${port} is already in use.`);
                console.error(`👉 Run 'npx kill-port ${port}' or end the process using port ${port}.\n`);
                process.exit(1);
            } else {
                console.error('❌ Server error:', err);
            }
        });

        httpServer.listen(port, () => {
            console.log(`\n🚀 SERVER RUNNING AT: http://localhost:${port}`);
            console.log(`📡 Socket.io path: http://localhost:${port}/socket.io/`);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

startServer();

export default app;
