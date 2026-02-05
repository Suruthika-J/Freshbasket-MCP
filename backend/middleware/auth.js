// File: auth.js
// Path: backend/middleware/auth.js

import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import DeliveryAgent from '../models/deliveryAgentModel.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';

// ============================================
// MAIN AUTH MIDDLEWARE (COMPLETE FIXED VERSION)
// ============================================
const authMiddleware = async (req, res, next) => {
    try {
        // Extract token from multiple possible locations
        let token = null;

        // 1. Check Authorization header (Bearer token) - PRIORITY
        if (req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
            console.log('🔐 Token found in Authorization header (Bearer)');
        }
        // 2. Check custom token header
        else if (req.headers.token) {
            token = req.headers.token;
            console.log('🔐 Token found in custom header');
        }
        // 3. Check cookies
        else if (req.cookies?.token) {
            token = req.cookies.token;
            console.log('🔐 Token found in cookies');
        }

        console.log('🔐 Auth Middleware Check');
        console.log('Authorization Header:', req.headers.authorization ? 'Present' : 'Missing');
        console.log('Token extracted:', token ? 'Yes' : 'No');

        // No token found
        if (!token) {
            console.log('❌ No authentication token found in any location');
            return res.status(401).json({ 
                success: false, 
                message: 'No authentication token provided. Please log in.' 
            });
        }

        // ============================================
        // CRITICAL FIX: Admin Session Token Support
        // ============================================
        if (token.startsWith('admin-session-token-')) {
            console.log('✅ Admin session token detected');
            
            // Create a mock admin user object for session-based admin
            req.user = {
                _id: 'admin-001',
                id: 'admin-001',
                name: 'Admin User',
                email: 'qcommerceapp@gmail.com',
                role: 'admin',
                isActive: true
            };
            
            console.log('✅ Admin session authenticated:', req.user.email);
            return next();
        }

        // ============================================
        // Regular JWT Token Verification
        // ============================================
        console.log('✅ Token extracted, verifying JWT...');

        const decoded = jwt.verify(token, JWT_SECRET);
        
        console.log('✅ JWT verified:', {
            userId: decoded.id || decoded.userId,
            role: decoded.role
        });

        // ============================================
        // Load User Based on Role
        // ============================================
        let user = null;
        const userId = decoded.id || decoded.userId;
        
        if (decoded.role === 'agent') {
            // Load from DeliveryAgent collection
            console.log('🚚 Loading delivery agent from database...');
            user = await DeliveryAgent.findById(userId).select('-password');
            
            if (!user) {
                console.log('❌ Delivery agent not found in database');
                return res.status(401).json({ 
                    success: false, 
                    message: 'Delivery agent account not found. Please contact admin.' 
                });
            }
        } else {
            // Load from User collection (regular user, farmer, or admin)
            console.log('👤 Loading user from database...');
            user = await User.findById(userId).select('-password -otp');
            
            if (!user) {
                console.log('❌ User not found in database');
                return res.status(401).json({ 
                    success: false, 
                    message: 'User not found. Please log in again.' 
                });
            }
        }

        // ============================================
        // Account Status Check
        // ============================================
        if (user.isActive === false) {
            console.log('❌ User account is deactivated');
            return res.status(401).json({ 
                success: false, 
                message: 'Account is deactivated. Please contact support.' 
            });
        }

        console.log('✅ User authenticated:', {
            email: user.email,
            role: decoded.role || user.role || 'user',
            userId: user._id
        });

        // ============================================
        // Attach User to Request Object
        // ============================================
        req.user = {
            ...user.toObject(),
            _id: user._id,
            id: user._id,
            role: decoded.role || user.role || 'user'
        };
        
        next();

    } catch (err) {
        console.error('❌ Auth Middleware Error:', err.message);
        console.error('Error name:', err.name);
        
        let message = 'Authentication failed';
        let statusCode = 401;
        
        if (err.name === 'TokenExpiredError') {
            message = 'Token expired. Please log in again.';
            console.log('⏰ Token expired');
        } else if (err.name === 'JsonWebTokenError') {
            message = 'Invalid token. Please log in again.';
            console.log('🔒 Invalid JWT token');
        } else if (err.name === 'NotBeforeError') {
            message = 'Token not active yet';
            console.log('⏳ Token not yet active');
        } else {
            message = 'Authentication failed. Please try again.';
            statusCode = 500;
        }
        
        return res.status(statusCode).json({ 
            success: false, 
            message 
        });
    }
};

// ============================================
// ADMIN-ONLY MIDDLEWARE
// ============================================
export const requireAdmin = (req, res, next) => {
    console.log('👑 Admin Check - User:', req.user?.email, 'Role:', req.user?.role);
    
    if (!req.user) {
        console.log('❌ No user object found in request');
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    if (req.user.role !== 'admin') {
        console.log('❌ Access denied - User is not admin');
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }

    console.log('✅ Admin access granted to:', req.user.email);
    next();
};

// ============================================
// FARMER-ONLY MIDDLEWARE
// ============================================
export const requireFarmer = (req, res, next) => {
    console.log('🌾 Farmer Check - User:', req.user?.email, 'Role:', req.user?.role);
    
    if (!req.user) {
        console.log('❌ No user object found in request');
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    if (req.user.role !== 'farmer') {
        console.log('❌ Access denied - User is not a farmer');
        return res.status(403).json({
            success: false,
            message: 'Access denied. Farmer privileges required.'
        });
    }

    console.log('✅ Farmer access granted to:', req.user.email);
    next();
};

// ============================================
// DELIVERY AGENT-ONLY MIDDLEWARE
// ============================================
export const requireAgent = (req, res, next) => {
    console.log('🚚 Agent Check - User:', req.user?.email, 'Role:', req.user?.role);
    
    if (!req.user) {
        console.log('❌ No user object found in request');
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    if (req.user.role !== 'agent') {
        console.log('❌ Access denied - User is not a delivery agent');
        return res.status(403).json({
            success: false,
            message: 'Access denied. Delivery agent privileges required.'
        });
    }

    console.log('✅ Delivery agent access granted to:', req.user.email);
    next();
};

// ============================================
// CUSTOMER-ONLY MIDDLEWARE (Regular Users)
// ============================================
export const requireCustomer = (req, res, next) => {
    console.log('🛒 Customer Check - User:', req.user?.email, 'Role:', req.user?.role);
    
    if (!req.user) {
        console.log('❌ No user object found in request');
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    if (req.user.role !== 'user') {
        console.log('❌ Access denied - User is not a customer');
        return res.status(403).json({
            success: false,
            message: 'Access denied. Customer account required.'
        });
    }

    console.log('✅ Customer access granted to:', req.user.email);
    next();
};

export default authMiddleware;