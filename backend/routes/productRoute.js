// backend/routes/productRoute.js
import express from 'express';
import multer from 'multer';
import {
    getProducts,
    getProductsForDownload,
    createProduct,
    updateProduct,
    deleteProduct,
    getLowStockProducts,
    getOutOfStockProducts,
    getFarmerProducts,
    updateProductStock,  // ✅ ADDED THIS IMPORT
    getProductsByFarmerId,
} from '../controllers/productController.js';
import auth, { requireAdmin } from '../middleware/auth.js';

// Import Twilio service for test endpoints
import { sendSMS, sendOutOfStockAlert, sendLowStockAlert } from '../services/twilioService.js';

const itemrouter = express.Router();

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, 'uploads/'),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

// File filter: only allow image files
const imageFileFilter = (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files (JPG, PNG, GIF, WebP) are allowed'), false);
    }
};

const upload = multer({
    storage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB max
});

// ====== EXISTING ROUTES ======

// GET all products
itemrouter.get('/', getProducts);

// GET products for CSV download (must be before /:id routes)
itemrouter.get('/download', getProductsForDownload);

// GET low stock products
itemrouter.get('/low-stock', getLowStockProducts);

// GET out of stock products
itemrouter.get('/out-of-stock', getOutOfStockProducts);

// GET /api/product/farmer-products - Get products for logged-in farmer
itemrouter.get('/farmer-products', auth, getFarmerProducts);

// ====== NEW ADMIN-ONLY ROUTE ======
// GET /api/items/admin/farmer/:farmerId/products - Get all products by a specific farmer (Admin only)
itemrouter.get('/admin/farmer/:farmerId/products', auth, requireAdmin, getProductsByFarmerId);

// POST create a new product (with optional image upload)
itemrouter.post('/', auth, upload.single('image'), createProduct);

// PUT update a product by ID (Protected for authenticated users) - WITH IMAGE UPLOAD
itemrouter.put('/:id', auth, upload.single('image'), updateProduct);

// PATCH update product stock (Inline Stock Adjuster) ✅ NOW CORRECTLY ROUTED
itemrouter.patch('/:id/stock', auth, updateProductStock);

// DELETE a product by ID
itemrouter.delete('/:id', auth, deleteProduct);

// ====== TEST ROUTES (Remove in Production) ======

// Test basic SMS functionality
itemrouter.post('/test-sms', async (req, res) => {
    try {
        console.log('🧪 Testing SMS functionality...');
        const result = await sendSMS('✅ Test message from RushBasket! Your SMS notifications are working correctly. 🛒');
        
        if (result.success) {
            res.json({ 
                success: true, 
                message: 'SMS sent successfully! Check your phone.',
                details: result 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'SMS failed to send',
                error: result.error 
            });
        }
    } catch (error) {
        console.error('Test SMS error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Test out of stock alert
itemrouter.post('/test-out-of-stock-alert', async (req, res) => {
    try {
        console.log('🧪 Testing out of stock alert...');
        const testProduct = {
            name: 'Test Product - Organic Tomatoes',
            category: 'Vegetables',
            stock: 0
        };
        const result = await sendOutOfStockAlert(testProduct);
        
        if (result.success) {
            res.json({ 
                success: true, 
                message: 'Out of stock alert sent! Check your phone.',
                details: result 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Alert failed to send',
                error: result.error 
            });
        }
    } catch (error) {
        console.error('Test alert error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Test low stock alert
itemrouter.post('/test-low-stock-alert', async (req, res) => {
    try {
        console.log('🧪 Testing low stock alert...');
        const testProduct = {
            name: 'Test Product - Fresh Milk',
            category: 'Dairy',
            stock: 3
        };
        const result = await sendLowStockAlert(testProduct);
        
        if (result.success) {
            res.json({ 
                success: true, 
                message: 'Low stock alert sent! Check your phone.',
                details: result 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Alert failed to send',
                error: result.error 
            });
        }
    } catch (error) {
        console.error('Test alert error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

export default itemrouter;