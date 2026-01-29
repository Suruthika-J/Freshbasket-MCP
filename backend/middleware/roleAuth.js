// backend/middleware/roleAuth.js
// Role-based authorization middleware

// Check if user is admin
/*export const isAdmin = (req, res, next) => {
    try {
        // authMiddleware should have already attached req.user
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin role required.'
            });
        }

        next();
    } catch (error) {
        console.error('isAdmin middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Check if user is delivery agent
export const isAgent = (req, res, next) => {
    try {
        // authMiddleware should have already attached req.user
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (req.user.role !== 'agent') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Delivery agent role required.'
            });
        }

        next();
    } catch (error) {
        console.error('isAgent middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Check if user is admin OR agent
export const isAdminOrAgent = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (req.user.role !== 'admin' && req.user.role !== 'agent') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin or agent role required.'
            });
        }

        next();
    } catch (error) {
        console.error('isAdminOrAgent middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};*/

// backend/middleware/roleAuth.js
export const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Access denied. Admin role required.'
        });
    }
};

export const isAgent = (req, res, next) => {
    if (req.user && req.user.role === 'agent') {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Access denied. Agent role required.'
        });
    }
};