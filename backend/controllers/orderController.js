// ============================================
// FILE: backend/controllers/orderController.js - COMPLETE FILE
// ============================================
import Order from '../models/orderModel.js';
import { Product } from '../models/productModel.js';
import User from '../models/userModel.js';
import DeliveryAgent from '../models/deliveryAgentModel.js';
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';
import PDFDocument from 'pdfkit';
import { geocodeAddress, reverseGeocode } from '../utils/geocoding.js';
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Helper function to calculate delivery charge
const calculateShipping = (subtotal) => {
    return subtotal > 1000 ? 0 : 50;
};

// Helper function to validate and update stock
const validateAndUpdateStock = async (items, session = null) => {
    const stockUpdates = [];
    
    for (const item of items) {
        const product = await Product.findById(item.id);
        
        if (!product) {
            throw new Error(`Product ${item.name} not found`);
        }
        
        if (product.stock < item.quantity) {
            throw new Error(
                `Insufficient stock for ${item.name}. Only ${product.stock} items available`
            );
        }
        
        stockUpdates.push({
            product,
            quantity: item.quantity
        });
    }
    
    // Update all stock quantities
    for (const { product, quantity } of stockUpdates) {
        product.stock -= quantity;
        await product.save({ session });
    }
    
    return stockUpdates;
};

// Create a new order with stock management

// ============================================
// FILE: backend/controllers/orderController.js
// CRITICAL FIXES FOR REDIRECT URLS
// ============================================

// Replace the createOrder function with this corrected version:

export const createOrder = async (req, res) => {
    try {
        const { customer, items, paymentMethod, notes, deliveryDate } = req.body;
        
        if (!Array.isArray(items) || !items.length) {
            return res.status(400).json({ message: 'Invalid or empty items array' });
        }

        const normalizedPM =
            paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment';

        const orderItems = items.map(i => ({
            id: i.id,
            name: i.name,
            price: Number(i.price),
            quantity: Number(i.quantity),
            imageUrl: i.imageUrl
        }));

        // Validate stock availability before processing
        for (const item of orderItems) {
            const product = await Product.findById(item.id);
            if (!product) {
                return res.status(404).json({ 
                    message: `Product ${item.name} not found` 
                });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({ 
                    message: `Insufficient stock for ${item.name}. Only ${product.stock} items available`,
                    availableStock: product.stock,
                    productId: item.id
                });
            }
        }

        // Calculate subtotal
        const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

        // Calculate shipping based on subtotal
        const shipping = calculateShipping(subtotal);

        // Geocode customer delivery address
        let deliveryLocation = null;
        try {
            console.log('🗺️ Geocoding customer address:', customer.address);
            deliveryLocation = await geocodeAddress(customer.address);
            console.log('✅ Customer location geocoded:', deliveryLocation);
        } catch (geocodeError) {
            console.warn('⚠️ Failed to geocode customer address, using default location');
            deliveryLocation = {
                latitude: 9.1700,
                longitude: 77.8700,
                address: 'Kovilpatti, Tamil Nadu, India'
            };
        }

        const orderId = `ORD-${uuidv4()}`;
        let newOrder;

        if (normalizedPM === 'Online Payment') {
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                mode: 'payment',
                line_items: orderItems.map(o => ({
                    price_data: {
                        currency: 'inr',
                        product_data: { name: o.name },
                        unit_amount: Math.round(o.price * 100)
                    },
                    quantity: o.quantity
                })),
                ...(shipping > 0 && {
                    shipping_options: [{
                        shipping_rate_data: {
                            type: 'fixed_amount',
                            fixed_amount: {
                                amount: shipping * 100,
                                currency: 'inr'
                            },
                            display_name: 'Delivery Charge'
                        }
                    }]
                }),
                customer_email: customer.email,
                // ✅ CRITICAL FIX: Use FRONTEND_URL (port 5174) for user-facing pages
                success_url: `${process.env.FRONTEND_URL}/myorders/verify?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.FRONTEND_URL}/checkout?payment_status=cancel`,
                metadata: { orderId }
            });

            newOrder = new Order({
                orderId,
                user: req.user._id,
                customer,
                items: orderItems,
                shipping: shipping,
                paymentMethod: normalizedPM,
                paymentStatus: 'Unpaid',
                sessionId: session.id,
                paymentIntentId: session.payment_intent,
                notes,
                deliveryDate
            });

            await newOrder.save();
            
            console.log('✅ Stripe checkout created');
            console.log('   Checkout URL:', session.url);
            console.log('   Success redirect:', session.success_url);
            console.log('   Cancel redirect:', session.cancel_url);
            
            return res.status(201).json({ 
                order: newOrder, 
                checkoutUrl: session.url,
                message: 'Order created. Stock will be updated after payment confirmation.'
            });
        }

        // Cash on Delivery - Update stock immediately
        try {
            await validateAndUpdateStock(orderItems);
            
            newOrder = new Order({
                orderId,
                user: req.user._id,
                customer,
                items: orderItems,
                shipping: shipping,
                paymentMethod: normalizedPM,
                paymentStatus: 'Unpaid',
                deliveryLocation,
                notes,
                deliveryDate
            });

            await newOrder.save();
            
            // ✅ CRITICAL FIX: Redirect to FRONTEND verify page (port 5174)
            const successUrl = `${process.env.FRONTEND_URL}/myorders/verify?order_id=${newOrder._id}`;
            
            console.log('✅ COD Order created');
            console.log('   Order ID:', newOrder.orderId);
            console.log('   Success redirect:', successUrl);
            
            res.status(201).json({ 
                order: newOrder, 
                checkoutUrl: successUrl,
                message: 'Order placed successfully. Stock updated.'
            });
        } catch (stockError) {
            return res.status(400).json({ 
                message: stockError.message 
            });
        }
    } catch (err) {
        console.error('❌ createOrder error:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};
// Confirm Stripe payment and update stock
export const confirmPayment = async (req, res) => {
    try {
        const { session_id } = req.query;
        if (!session_id) return res.status(400).json({ message: 'session_id required' });

        const session = await stripe.checkout.sessions.retrieve(session_id);
        if (session.payment_status !== 'paid') {
            return res.status(400).json({ message: 'Payment not completed' });
        }

        const order = await Order.findOne({ sessionId: session_id });
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (order.paymentStatus === 'Paid') {
            return res.json(order);
        }

        try {
            await validateAndUpdateStock(order.items);
            
            order.paymentStatus = 'Paid';
            await order.save();
            
            res.json({
                ...order.toObject(),
                message: 'Payment confirmed and stock updated successfully'
            });
        } catch (stockError) {
            console.error('CRITICAL: Payment confirmed but stock update failed:', stockError);
            
            order.paymentStatus = 'Paid';
            order.notes = `${order.notes || ''}\n[ADMIN ACTION REQUIRED: Stock update failed - ${stockError.message}]`;
            await order.save();
            
            return res.status(500).json({ 
                message: 'Payment confirmed but stock update failed. Admin will process manually.',
                order: order,
                error: stockError.message
            });
        }
    } catch (err) {
        console.error('confirmPayment error:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

// GET /api/orders — returns all orders
export const getOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({})
            .populate('assignedTo', 'name email phone')
            .sort({ createdAt: -1 })
            .lean();
        res.json(orders);
    } catch (err) {
        console.error('getOrders error:', err);
        next(err);
    }
};

// GET /api/orders/:id — returns one order
export const getOrderById = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('assignedTo', 'name email phone')
            .lean();
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.json(order);
    } catch (err) {
        console.error('getOrderById error:', err);
        next(err);
    }
};

// PUT /api/orders/:id — updates allowed fields
export const updateOrder = async (req, res, next) => {
    try {
        const allowed = ['status', 'paymentStatus', 'deliveryDate', 'notes'];
        const updateData = {};
        
        allowed.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        const currentOrder = await Order.findById(req.params.id);
        if (!currentOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (updateData.status) {
            const newStatus = updateData.status;
            const paymentMethod = currentOrder.paymentMethod;

            if (paymentMethod === 'Cash on Delivery') {
                if (newStatus === 'Delivered') {
                    updateData.paymentStatus = 'Paid';
                } else {
                    updateData.paymentStatus = 'Unpaid';
                }
            } else if (paymentMethod === 'Online Payment') {
                updateData.paymentStatus = 'Paid';
            }
        }

        const updated = await Order.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        )
        .populate('assignedTo', 'name email phone')
        .lean();

        if (!updated) {
            return res.status(404).json({ message: 'Order not found' });
        }

        console.log(`✅ Order ${updated.orderId} updated:`, {
            status: updated.status,
            paymentStatus: updated.paymentStatus,
            paymentMethod: updated.paymentMethod
        });

        res.json(updated);
    } catch (err) {
        console.error('updateOrder error:', err);
        next(err);
    }
};

// DELETE /api/orders/:id — deletes order and restores stock
export const deleteOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.paymentStatus === 'Paid') {
            for (const item of order.items) {
                const product = await Product.findById(item.id);
                if (product) {
                    product.stock += item.quantity;
                    await product.save();
                }
            }
        }

        await Order.findByIdAndDelete(req.params.id);
        res.json({ 
            message: 'Order deleted successfully',
            stockRestored: order.paymentStatus === 'Paid'
        });
    } catch (err) {
        console.error('deleteOrder error:', err);
        next(err);
    }
};

// ============================================
// ✅ FIXED: GET /api/orders/stats - Get order statistics
// ============================================
// backend/controllers/orderController.js - REPLACE getOrderStats function

export const getOrderStats = async (req, res, next) => {
    try {
        console.log('📊 Stats endpoint hit');
        console.log('Query params:', req.query);
        
        const { startDate, endDate } = req.query;
        
        let dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                dateFilter.createdAt.$gte = start;
                console.log('✅ Start date filter applied:', start);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                dateFilter.createdAt.$lte = end;
                console.log('✅ End date filter applied:', end);
            }
        } else {
            console.log('ℹ️ No date filter - showing all orders');
        }

        const allOrders = await Order.find(dateFilter).lean();
        console.log(`\n📦 Found ${allOrders.length} orders matching filter\n`);

        // ✅ HELPER FUNCTION - Same logic as frontend
        const getDisplayPaymentStatus = (order) => {
            if (order.paymentMethod === 'Cash on Delivery') {
                return order.status === 'Delivered' ? 'Paid' : 'Unpaid';
            } else if (order.paymentMethod === 'Online Payment') {
                return 'Paid';
            }
            return order.paymentStatus || 'Unpaid';
        };

        // Initialize stats
        const stats = {
            Pending: 0,
            Processing: 0,
            Shipped: 0,
            Delivered: 0,
            Cancelled: 0,
            Unpaid: 0
        };

        let totalRevenue = 0;
        let totalDeliveredOrders = 0;

        // Count orders with corrected logic
        allOrders.forEach(order => {
            // Count by status
            if (order.status && stats.hasOwnProperty(order.status)) {
                stats[order.status]++;
            }
            
            // ✅ FIX: Use display payment status logic
            const displayPaymentStatus = getDisplayPaymentStatus(order);
            if (displayPaymentStatus === 'Unpaid') {
                stats.Unpaid++;
                console.log(`📝 Counted as Unpaid: ${order.orderId} (${order.paymentMethod}, Status: ${order.status})`);
            }

            // Calculate revenue from paid orders
            if (displayPaymentStatus === 'Paid') {
                const orderTotal = order.total || 0;
                totalRevenue += orderTotal;
            }

            // Count delivered orders
            if (order.status === 'Delivered') {
                totalDeliveredOrders++;
            }
        });

        const totalOrders = allOrders.length;
        totalRevenue = parseFloat(totalRevenue.toFixed(2));

        const response = {
            stats,
            totalOrders,
            totalRevenue,
            totalDeliveredOrders,
            totalReviews: 0,
            dateRange: {
                startDate: startDate || null,
                endDate: endDate || null
            }
        };

        console.log('\n✅ Final Stats Response:');
        console.log('   Total Orders:', totalOrders);
        console.log('   Unpaid Count:', stats.Unpaid);
        console.log('   Pending:', stats.Pending);
        console.log('   Processing:', stats.Processing);
        console.log('   Shipped:', stats.Shipped);
        console.log('   Delivered:', stats.Delivered);
        console.log('   Cancelled:', stats.Cancelled);
        console.log('   Total Revenue: ₹' + totalRevenue);
        
        res.status(200).json(response);
    } catch (err) {
        console.error('❌ getOrderStats error:', err);
        console.error('Error stack:', err.stack);
        
        res.status(500).json({ 
            message: 'Failed to fetch order statistics',
            error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
        });
    }
};
// ============================================
// ADMIN: Assign Order to Delivery Agent
// ============================================
export const assignOrderToAgent = async (req, res) => {
    try {
        console.log('🚀 assignOrderToAgent called');
        console.log('   Full URL:', req.originalUrl);
        console.log('   Path:', req.path);
        console.log('   Method:', req.method);
        console.log('   Params:', req.params);
        console.log('   Body:', req.body);

        const { orderId } = req.params;
        const { agentId } = req.body;

        // Validate orderId from params
        if (!orderId) {
            console.log('❌ Order ID missing from params');
            return res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
        }

        // Validate agentId from body
        if (!agentId) {
            console.log('❌ Agent ID missing from body');
            return res.status(400).json({
                success: false,
                message: 'Agent ID is required'
            });
        }

        console.log(`✅ Attempting to assign order ${orderId} to agent ${agentId}`);

        // Find the delivery agent
        const agent = await DeliveryAgent.findById(agentId);
        
        if (!agent) {
            console.log('❌ Agent not found or invalid role');
            return res.status(404).json({
                success: false,
                message: 'Agent not found or invalid agent ID'
            });
        }

        console.log(`✅ Agent found: ${agent.name} (${agent.email})`);

        // Verify agent is active
        if (!agent.isActive) {
            console.log('❌ Agent is inactive');
            return res.status(400).json({
                success: false,
                message: 'Cannot assign to inactive agent'
            });
        }

        // Find order
        const order = await Order.findById(orderId);
        if (!order) {
            console.log('❌ Order not found');
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        console.log(`✅ Order found: ${order.orderId} (Status: ${order.status})`);

        // Check if order is already delivered or cancelled
        if (order.status === 'Delivered' || order.status === 'Cancelled') {
            console.log(`❌ Cannot assign ${order.status.toLowerCase()} order`);
            return res.status(400).json({
                success: false,
                message: `Cannot assign ${order.status.toLowerCase()} orders`
            });
        }

        // Assign agent to order
        order.assignedTo = agentId;
        order.assignedAt = new Date();

        // Enable tracking when agent is assigned
        order.trackingEnabled = true;

        await order.save();
        console.log('✅ Order saved with agent assignment');

        // Populate agent details for response
        await order.populate('assignedTo', 'name email phone');

        console.log(`✅ Order ${order.orderId} assigned to agent ${agent.name} successfully`);

        res.status(200).json({
            success: true,
            message: `Order assigned to ${agent.name} successfully`,
            order
        });

    } catch (error) {
        console.error('❌ Assign order to agent error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// ============================================
// Generate PDF Invoice
// ============================================
// ============================================

export const generateInvoice = async (req, res) => {
    try {
        const orderId = req.params.id;
        
        console.log('📄 Generating invoice for order ID:', orderId);
        
        // Fetch order from database
        const order = await Order.findById(orderId)
            .populate('user', 'name email')
            .lean();

        if (!order) {
            console.error('❌ Order not found:', orderId);
            return res.status(404).json({ 
                success: false,
                message: 'Order not found' 
            });
        }

        console.log('✅ Order found:', order.orderId);
        console.log('   Items:', order.items?.length || 0);

        // ==================== CALCULATE TOTALS ====================
        // Calculate subtotal from items
        const subtotal = order.items.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);

        // Get shipping from order or calculate
        const shipping = order.shipping || 0;

        // Calculate tax (5% of subtotal)
        const tax = subtotal * 0.05;

        // Calculate total
        const total = subtotal + tax + shipping;

        console.log('💰 Calculated totals:');
        console.log('   Subtotal:', subtotal);
        console.log('   Tax:', tax);
        console.log('   Shipping:', shipping);
        console.log('   Total:', total);

        // Create PDF document
        const doc = new PDFDocument({ 
            size: 'A4',
            margin: 50 
        });

        // Set response headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Invoice_${order.orderId}.pdf`);

        // Pipe PDF to response
        doc.pipe(res);

        // ==================== HEADER ====================
        doc.fontSize(28)
           .fillColor('#10b981')
           .text('RUSHBASKET', 50, 50)
           .fontSize(10)
           .fillColor('#666')
           .text('Fresh Groceries Delivered to Your Door', 50, 85);

        // Invoice Title
        doc.fontSize(24)
           .fillColor('#000')
           .text('INVOICE', 400, 50, { align: 'right' });

        // Horizontal line
        doc.moveTo(50, 110)
           .lineTo(550, 110)
           .strokeColor('#10b981')
           .lineWidth(2)
           .stroke();

        // ==================== ORDER INFO ====================
        let yPos = 140;
        
        doc.fontSize(10)
           .fillColor('#666')
           .text('Order ID:', 50, yPos)
           .fillColor('#000')
           .font('Helvetica-Bold')
           .text(order.orderId, 150, yPos);

        yPos += 20;
        doc.font('Helvetica')
           .fillColor('#666')
           .text('Order Date:', 50, yPos)
           .fillColor('#000')
           .text(new Date(order.createdAt || order.date).toLocaleDateString('en-IN', {
               year: 'numeric',
               month: 'long',
               day: 'numeric',
               hour: '2-digit',
               minute: '2-digit'
           }), 150, yPos);

        yPos += 20;
        doc.fillColor('#666')
           .text('Payment Method:', 50, yPos)
           .fillColor('#000')
           .text(order.paymentMethod || 'N/A', 150, yPos);

        yPos += 20;
        doc.fillColor('#666')
           .text('Payment Status:', 50, yPos)
           .fillColor(order.paymentStatus === 'Paid' ? '#10b981' : '#ef4444')
           .font('Helvetica-Bold')
           .text(order.paymentStatus || 'Pending', 150, yPos);

        // ==================== CUSTOMER INFO ====================
        yPos = 140;
        doc.font('Helvetica-Bold')
           .fontSize(12)
           .fillColor('#000')
           .text('BILL TO:', 350, yPos);

        yPos += 25;
        doc.font('Helvetica')
           .fontSize(10)
           .fillColor('#000')
           .text(order.customer?.name || 'N/A', 350, yPos);

        yPos += 15;
        doc.fillColor('#666')
           .text(order.customer?.email || 'N/A', 350, yPos);

        yPos += 15;
        doc.text(order.customer?.phone || 'N/A', 350, yPos);

        yPos += 20;
        const address = order.customer?.address || 'N/A';
        const addressLines = address.match(/.{1,35}/g) || [address];
        addressLines.forEach(line => {
            doc.text(line.trim(), 350, yPos);
            yPos += 15;
        });

        // ==================== ITEMS TABLE ====================
        yPos = 300;

        // Table header
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .fillColor('#fff')
           .rect(50, yPos, 500, 25)
           .fillAndStroke('#10b981', '#10b981');

        doc.fillColor('#fff')
           .text('Item', 60, yPos + 8)
           .text('Qty', 320, yPos + 8, { width: 50, align: 'center' })
           .text('Price', 380, yPos + 8, { width: 70, align: 'right' })
           .text('Total', 460, yPos + 8, { width: 80, align: 'right' });

        yPos += 25;

        // Table rows
        doc.font('Helvetica')
           .fontSize(10);

        if (!order.items || order.items.length === 0) {
            doc.fillColor('#666')
               .text('No items found', 60, yPos + 10);
            yPos += 30;
        } else {
            order.items.forEach((item, index) => {
                const bgColor = index % 2 === 0 ? '#f9fafb' : '#ffffff';
                doc.rect(50, yPos, 500, 30)
                   .fillAndStroke(bgColor, '#e5e7eb');

                const itemTotal = (item.price || 0) * (item.quantity || 0);

                doc.fillColor('#000')
                   .text(item.name || 'Unknown Item', 60, yPos + 10, { width: 240 })
                   .text((item.quantity || 0).toString(), 320, yPos + 10, { width: 50, align: 'center' })
                   .text(`₹${(item.price || 0).toFixed(2)}`, 380, yPos + 10, { width: 70, align: 'right' })
                   .text(`₹${itemTotal.toFixed(2)}`, 460, yPos + 10, { width: 80, align: 'right' });

                yPos += 30;
            });
        }

        // ==================== TOTALS ====================
        yPos += 20;

        // Subtotal
        doc.fontSize(10)
           .fillColor('#666')
           .text('Subtotal:', 380, yPos)
           .fillColor('#000')
           .text(`₹${subtotal.toFixed(2)}`, 460, yPos, { width: 80, align: 'right' });

        yPos += 20;

        // Tax
        doc.fillColor('#666')
           .text('Tax (5%):', 380, yPos)
           .fillColor('#000')
           .text(`₹${tax.toFixed(2)}`, 460, yPos, { width: 80, align: 'right' });

        yPos += 20;

        // Shipping
        doc.fillColor('#666')
           .text('Shipping:', 380, yPos)
           .fillColor('#000')
           .text(shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`, 460, yPos, { width: 80, align: 'right' });

        yPos += 5;

        // Total line
        doc.moveTo(380, yPos)
           .lineTo(550, yPos)
           .strokeColor('#000')
           .lineWidth(1)
           .stroke();

        yPos += 15;

        // Grand Total
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor('#10b981')
           .text('Total Amount:', 380, yPos)
           .fontSize(14)
           .text(`₹${total.toFixed(2)}`, 460, yPos, { width: 80, align: 'right' });

        // ==================== FOOTER ====================
        doc.fontSize(9)
           .fillColor('#999')
           .text('Thank you for shopping with RushBasket!', 50, 750, { 
               align: 'center',
               width: 500 
           })
           .text('For any queries, contact us at support@rushbasket.com', 50, 765, {
               align: 'center',
               width: 500
           });

        // Finalize PDF
        doc.end();

        console.log(`✅ Invoice generated successfully for order: ${order.orderId}`);

    } catch (error) {
        console.error('❌ Generate invoice error:', error);
        console.error('Error stack:', error.stack);
        
        // Make sure response hasn't been sent yet
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Failed to generate invoice',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
            });
        }
    }
};

// backend/controllers/orderController.js - ADD THESE FUNCTIONS AT THE END

// ... [Keep ALL existing functions from your orderController.js] ...

// ============================================
// NEW: GET ORDER TRACKING (PUBLIC)
// ============================================
export const getOrderTracking = async (req, res) => {
    try {
        const orderId = req.params.id;
        
        console.log('🗺️ Fetching tracking for order:', orderId);
        
        const order = await Order.findById(orderId)
            .populate('assignedTo', 'name email phone')
            .lean();

        if (!order) {
            console.error('❌ Order not found:', orderId);
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Build tracking response
        const trackingData = {
            success: true,
            orderId: order.orderId,
            status: order.status,
            trackingEnabled: order.trackingEnabled || false,
            storeLocation: order.storeLocation || {
                latitude: 9.1700,
                longitude: 77.8700,
                address: 'Kovilpatti, Tamil Nadu, India'
            },
            deliveryLocation: order.deliveryLocation || null,
            agentLocation: order.agentLocation || null,
            assignedAgent: order.assignedTo ? {
                name: order.assignedTo.name,
                phone: order.assignedTo.phone,
                email: order.assignedTo.email
            } : null,
            customer: {
                name: order.customer.name,
                phone: order.customer.phone,
                address: order.customer.address
            }
        };

        console.log('✅ Tracking data retrieved successfully');
        res.status(200).json(trackingData);

    } catch (error) {
        console.error('❌ Get tracking error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tracking information',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
        });
    }
};

// ============================================
// NEW: UPDATE AGENT LOCATION (AGENT ONLY)
// ============================================
export const updateAgentLocation = async (req, res) => {
    try {
        const { orderId, latitude, longitude } = req.body;
        const agentId = req.user._id;

        console.log('📍 Agent location update:', {
            agentId,
            orderId,
            latitude,
            longitude
        });

        // Validate input
        if (!orderId || !latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Order ID, latitude, and longitude are required'
            });
        }

        // Validate coordinates
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return res.status(400).json({
                success: false,
                message: 'Invalid coordinates'
            });
        }

        // Find order assigned to this agent
        const order = await Order.findOne({
            _id: orderId,
            assignedTo: agentId
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found or not assigned to you'
            });
        }

        // Don't update location if order is delivered or cancelled
        if (order.status === 'Delivered' || order.status === 'Cancelled') {
            return res.status(400).json({
                success: false,
                message: `Cannot update location for ${order.status.toLowerCase()} orders`
            });
        }

        // Optional: Reverse geocode to get address
        let address = `${latitude}, ${longitude}`;
        try {
            const { reverseGeocode } = await import('../utils/geocoding.js');
            address = await reverseGeocode(latitude, longitude);
        } catch (err) {
            console.warn('⚠️ Reverse geocoding failed, using coordinates');
        }

        // Update agent location
        order.agentLocation = {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            address,
            updatedAt: new Date()
        };

        // Enable tracking if not already enabled
        if (!order.trackingEnabled) {
            order.trackingEnabled = true;
        }

        await order.save();

        console.log('✅ Agent location updated successfully');

        res.status(200).json({
            success: true,
            message: 'Location updated successfully',
            agentLocation: order.agentLocation
        });

    } catch (error) {
        console.error('❌ Update agent location error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update location',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
        });
    }
};

// NOTE: Add these two functions to your existing orderController.js file
// Make sure to import the geocoding utility at the top:
// 