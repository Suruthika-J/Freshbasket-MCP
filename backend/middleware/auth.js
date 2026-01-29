// backend/middleware/auth.js - FIXED VERSION WITH ADMIN SESSION SUPPORT
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import DeliveryAgent from '../models/deliveryAgentModel.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';

// Main authentication middleware
const authMiddleware = async (req, res, next) => {
    try {
        // Extract token from multiple possible locations
        let token = null;

        // 1. Check Authorization header (Bearer token)
        if (req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }
        // 2. Check custom token header
        else if (req.headers.token) {
            token = req.headers.token;
        }
        // 3. Check cookies
        else if (req.cookies?.token) {
            token = req.cookies.token;
        }

        // No token found
        if (!token) {
            console.log('❌ No token found in request');
            return res.status(401).json({ 
                success: false, 
                message: 'Not authorized – token missing' 
            });
        }

        // ✅ CRITICAL FIX: Check if it's an admin session token
        if (token.startsWith('admin-session-token-')) {
            console.log('✅ Admin session token detected');
            
            // Create a mock admin user object
            req.user = {
                _id: 'admin-001',
                id: 'admin-001',
                name: 'Admin User',
                email: 'qcommerceapp@gmail.com',
                role: 'admin',
                isActive: true
            };
            
            return next();
        }

        // Regular JWT token verification
        const decoded = jwt.verify(token, JWT_SECRET);

        // Determine if user is an agent or regular user based on role in token
        let user = null;
        
        if (decoded.role === 'agent') {
            // Load from DeliveryAgent collection
            user = await DeliveryAgent.findById(decoded.id).select('-password');
        } else {
            // Load from User collection
            user = await User.findById(decoded.id).select('-password -otp');
        }
        
        if (!user) {
            console.log('❌ User not found for token');
            return res.status(401).json({ 
                success: false, 
                message: 'User no longer exists' 
            });
        }

        // Check if user/agent is active
        if (!user.isActive) {
            console.log('❌ User account is deactivated');
            return res.status(401).json({ 
                success: false, 
                message: 'Account is deactivated' 
            });
        }

        // Attach user to request object with role information
        req.user = {
            ...user.toObject(),
            role: decoded.role || user.role || 'user'
        };
        
        next();

    } catch (err) {
        console.error('❌ Auth middleware error:', err.message);
        
        let message = 'Invalid token';
        
        if (err.name === 'TokenExpiredError') {
            message = 'Token expired';
        } else if (err.name === 'JsonWebTokenError') {
            message = 'Invalid token';
        }
        
        return res.status(401).json({ 
            success: false, 
            message 
        });
    }
};

// Role-based middleware: Admin only
export const requireAdmin = (req, res, next) => {
    console.log('🔐 Checking admin privileges for user:', req.user?.email);
    
    if (req.user?.role !== 'admin') {
        console.log('❌ Access denied - not an admin');
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }
    
    console.log('✅ Admin access granted');
    next();
};

// Role-based middleware: Agent only
export const requireAgent = (req, res, next) => {
    if (req.user?.role !== 'agent') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Delivery agent privileges required.'
        });
    }
    next();
};

export default authMiddleware;