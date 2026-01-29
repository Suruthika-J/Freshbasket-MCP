// backend/controllers/cartController.js
import { CartItem } from '../models/cartModel.js';
import { Product } from '../models/productModel.js';
import createError from 'http-errors';

// GET /api/cart
export const getCart = async (req, res, next) => {
    try {
        const items = await CartItem.find({ user: req.user._id })
            .populate({
                path: 'product',
                model: 'Product',
                select: 'name price imageUrl description stock'
            })
            .lean();
        
        // Filter out items with deleted products
        const validItems = items.filter(item => item.product !== null);
        
        const formatted = validItems.map(ci => ({
            _id: ci._id.toString(),
            id: ci._id.toString(),
            productId: ci.product._id.toString(),
            product: {
                _id: ci.product._id.toString(),
                name: ci.product.name,
                price: ci.product.price,
                imageUrl: ci.product.imageUrl,
                description: ci.product.description,
                stock: ci.product.stock
            },
            quantity: ci.quantity,
            price: ci.product.price,
            name: ci.product.name,
            imageUrl: ci.product.imageUrl
        }));
        
        console.log('📦 Cart items sent:', formatted.length);
        res.json(formatted);
    } catch (err) {
        console.error('❌ Error in getCart:', err);
        next(err);
    }
};

// POST /api/cart
export const addToCart = async (req, res, next) => {
    try {
        const { productId, itemId, quantity = 1 } = req.body;
        const pid = productId || itemId;
        
        // Enhanced validation with detailed messages
        if (!pid) {
            throw createError(400, 'Product identifier (productId or itemId) is required');
        }
        
        if (typeof quantity !== 'number' || quantity < 1) {
            throw createError(400, 'Quantity must be a positive number');
        }
        
        // Verify product exists
        const product = await Product.findById(pid);
        if (!product) {
            throw createError(404, 'Product not found');
        }
        
        /*
        // STOCK CHECK DISABLED: This check for initial add is now commented out.
        if (product.stock < quantity) {
            throw createError(400, `Only ${product.stock} items available in stock`);
        }
        */

        // Check if item already exists in cart
        let cartItem = await CartItem.findOne({ 
            user: req.user._id, 
            product: pid 
        });

        if (cartItem) {
            // Update existing cart item
            const newQuantity = cartItem.quantity + quantity;
            
            /*
            // STOCK CHECK DISABLED: This check for updating quantity is now commented out.
            if (newQuantity > product.stock) {
                throw createError(400, `Cannot add more. Only ${product.stock} items available`);
            }
            */
            
            // Support for quantity decrease with auto-delete
            const finalQuantity = Math.max(1, newQuantity);
            
            if (finalQuantity < 1 || (quantity < 0 && Math.abs(quantity) >= cartItem.quantity)) {
                await cartItem.deleteOne();
                console.log('✅ Cart item auto-removed (quantity < 1)');
                return res.status(200).json({ 
                    message: 'Item removed from cart', 
                    _id: cartItem._id.toString() 
                });
            }
            
            cartItem.quantity = finalQuantity;
            await cartItem.save();
            await cartItem.populate('product');
            
            console.log('✅ Cart item updated:', cartItem.product.name, '- Quantity:', finalQuantity);
            
            return res.status(200).json({
                _id: cartItem._id.toString(),
                id: cartItem._id.toString(),
                productId: cartItem.product._id.toString(),
                product: cartItem.product,
                quantity: cartItem.quantity,
                price: cartItem.product.price,
                name: cartItem.product.name,
                imageUrl: cartItem.product.imageUrl
            });
        }

        // Create new cart item
        cartItem = await CartItem.create({
            user: req.user._id,
            product: pid,
            quantity: Math.max(1, quantity)
        });
        
        await cartItem.populate('product');
        
        console.log('✅ New item added to cart:', cartItem.product.name, '- Quantity:', quantity);
        
        res.status(201).json({
            _id: cartItem._id.toString(),
            id: cartItem._id.toString(),
            productId: cartItem.product._id.toString(),
            product: cartItem.product,
            quantity: cartItem.quantity,
            price: cartItem.product.price,
            name: cartItem.product.name,
            imageUrl: cartItem.product.imageUrl
        });
    } catch (err) {
        console.error('❌ Error in addToCart:', err);
        next(err);
    }
};

// PUT /api/cart/:id
export const updateCartItem = async (req, res, next) => {
    try {
        const { quantity } = req.body;
        
        // Validate quantity
        if (typeof quantity !== 'number' || quantity < 1) {
            throw createError(400, 'Quantity must be a positive number');
        }
        
        const cartItem = await CartItem.findOne({ 
            _id: req.params.id, 
            user: req.user._id 
        }).populate('product');
        
        if (!cartItem) {
            throw createError(404, 'Cart item not found');
        }
        
        /*
        // STOCK CHECK DISABLED: This check for direct quantity update is now commented out.
        if (quantity > cartItem.product.stock) {
            throw createError(400, `Only ${cartItem.product.stock} items available in stock`);
        }
        */
        
        // Apply Math.max to ensure minimum quantity of 1
        cartItem.quantity = Math.max(1, quantity);
        await cartItem.save();
        
        console.log('✅ Cart item quantity updated:', cartItem.product.name, '- New quantity:', cartItem.quantity);
        
        res.json({
            _id: cartItem._id.toString(),
            id: cartItem._id.toString(),
            productId: cartItem.product._id.toString(),
            product: cartItem.product,
            quantity: cartItem.quantity,
            price: cartItem.product.price,
            name: cartItem.product.name,
            imageUrl: cartItem.product.imageUrl
        });
    } catch (err) {
        console.error('❌ Error in updateCartItem:', err);
        next(err);
    }
};

// DELETE /api/cart/:id
export const deleteCartItem = async (req, res, next) => {
    try {
        const cartItem = await CartItem.findOne({ 
            _id: req.params.id, 
            user: req.user._id 
        });
        
        if (!cartItem) {
            throw createError(404, 'Cart item not found');
        }
        
        await cartItem.deleteOne();
        
        console.log('✅ Cart item deleted:', req.params.id);
        
        res.json({ 
            message: 'Item removed from cart', 
            _id: req.params.id 
        });
    } catch (err) {
        console.error('❌ Error in deleteCartItem:', err);
        next(err);
    }
};

// POST /api/cart/clear
export const clearCart = async (req, res, next) => {
    try {
        const result = await CartItem.deleteMany({ user: req.user._id });
        
        console.log('✅ Cart cleared:', result.deletedCount, 'items removed');
        
        res.json({ 
            message: 'Cart cleared successfully',
            deletedCount: result.deletedCount
        });
    } catch (err) {
        console.error('❌ Error in clearCart:', err);
        next(err);
    }
};