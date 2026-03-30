// backend/controllers/parentOrderController.js
// FIXED VERSION - Properly extracts farmer ID from products

import ParentOrder from '../models/ParentOrderModel.js';
import SubOrder from '../models/SubOrderModel.js';
import { Product } from '../models/productModel.js';
import User from '../models/userModel.js';
import Stripe from 'stripe';
import { geocodeAddress } from '../utils/geocoding.js';

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Helper: Calculate delivery charge per vendor
const calculateDeliveryCharge = (subtotal, deliveryOption, vendorType) => {
    // Admin products are free delivery. Self-pickup is free.
    if (vendorType === 'admin' || deliveryOption === 'SELF_PICKUP') {
        return 0;
    }
    // Delivery agent charge
    return subtotal >= 500 ? 0 : 40;
};

// Helper: Deduct stock
const deductStock = async (stockUpdates, session = null) => {
    for (const { product, quantity } of stockUpdates) {
        product.stock -= quantity;
        await product.save({ session });
    }
};

// ============================================
// CREATE PARENT ORDER (FIXED - Auto-groups by farmer)
// ============================================
export const createParentOrder = async (req, res) => {
    // Robust session start
    let session;
    try {
        session = await ParentOrder.startSession();
    } catch (sessionError) {
        console.error('❌ Failed to start DB session:', sessionError.message);
        return res.status(500).json({
            success: false,
            message: 'Database session error. Please ensure your MongoDB cluster supports transactions.'
        });
    }

    session.startTransaction();

    try {
        const { customer, paymentMethod, items } = req.body;
        const userId = req.user.id || req.user._id;

        console.log('📦 Creating multi-vendor parent order for user:', userId);
        console.log('Cart items count:', items?.length);

        // ============================================
        // Validation
        // ============================================
        if (!customer || !customer.name || !customer.email || !customer.phone || !customer.address) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: 'Customer information is incomplete'
            });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: 'No items in cart'
            });
        }

        if (!['Cash on Delivery', 'Online Payment'].includes(paymentMethod)) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: 'Invalid payment method'
            });
        }

        // ============================================
        // Fetch products and group by farmer
        // ============================================
        const productIds = items.map(item => item.productId).filter(Boolean);
        if (productIds.length !== items.length) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: 'Invalid product IDs in cart'
            });
        }

        const products = await Product.find({ _id: { $in: productIds } })
            .populate('farmerId', 'name district')
            .session(session);

        if (products.length === 0) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: 'None of the products were found'
            });
        }

        // ✅ Group items by vendor
        const vendorGroups = {};

        for (const item of items) {
            const product = products.find(p => p._id.toString() === item.productId.toString());

            if (!product) {
                console.error(`❌ Product not found: ${item.productId}`);
                await session.abortTransaction();
                return res.status(400).json({
                    success: false,
                    message: `Product ${item.productId} not found`
                });
            }

            // Check stock
            if (product.stock < item.quantity) {
                await session.abortTransaction();
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
                });
            }

            // Determine vendor ID and type
            let vendorId, vendorType, vendorName;

            if (product.adminUploaded || product.uploaderRole === 'admin') {
                vendorId = 'admin';
                vendorType = 'admin';
                vendorName = 'FreshBasket Admin';
            } else if (product.farmerId) {
                // Populate might fail if user was deleted
                vendorId = (product.farmerId._id || product.farmerId).toString();
                vendorType = 'farmer';
                vendorName = product.farmerId.name || 'Unknown Farmer';
            } else {
                console.error('❌ Product has no vendor:', product._id);
                await session.abortTransaction();
                return res.status(400).json({
                    success: false,
                    message: `Product ${product.name} has no valid vendor`
                });
            }

            // Group by vendor
            if (!vendorGroups[vendorId]) {
                const vendorDeliveryType = vendorType === 'admin' ? 'delivery_agent' : (item.deliveryType || item.deliveryOption?.toLowerCase() || 'delivery_agent');

                vendorGroups[vendorId] = {
                    vendorId,
                    vendorType,
                    vendorName,
                    items: [],
                    deliveryType: vendorDeliveryType,
                    deliveryOption: vendorDeliveryType === 'self_pickup' ? 'SELF_PICKUP' : 'DELIVERY_AGENT'
                };
            }

            vendorGroups[vendorId].items.push({
                productId: product._id.toString(),
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                imageUrl: product.imageUrl || '',
                product: product // Keep for stock updates
            });
        }

        console.log('✅ Grouped into', Object.keys(vendorGroups).length, 'vendors');

        // ============================================
        // Create sub-orders data
        // ============================================
        const subOrdersData = [];
        let totalAmount = 0;
        const allStockUpdates = [];

        for (const vendorGroup of Object.values(vendorGroups)) {
            const { vendorId, vendorType, vendorName, deliveryOption, deliveryType, items: vendorItems } = vendorGroup;

            let subtotal = 0;
            for (const item of vendorItems) {
                subtotal += item.price * item.quantity;
                allStockUpdates.push({
                    product: item.product,
                    quantity: item.quantity
                });
            }

            const deliveryCharge = calculateDeliveryCharge(subtotal, deliveryOption, vendorType);
            const vendorTotal = subtotal + deliveryCharge;

            const cleanItems = vendorItems.map(({ productId, name, price, quantity, imageUrl }) => ({
                productId,
                name,
                price,
                quantity,
                imageUrl
            }));

            subOrdersData.push({
                vendor: { vendorId, vendorType, vendorName },
                items: cleanItems,
                deliveryOption,
                deliveryType,
                deliveryRequired: deliveryType === 'delivery_agent',
                subtotal,
                deliveryCharge,
                total: vendorTotal
            });

            totalAmount += vendorTotal;
        }

        // ============================================
        // Deduct stock for COD
        // ============================================
        if (paymentMethod === 'Cash on Delivery') {
            await deductStock(allStockUpdates, session);
        }

        // ============================================
        // Create Parent Order
        // ============================================
        const parentOrderId = await ParentOrder.generateParentOrderId(session);

        const parentOrder = new ParentOrder({
            parentOrderId,
            user: userId,
            customer,
            totalAmount,
            paymentMethod,
            paymentStatus: 'Unpaid',
            orderStatus: 'pending',
            deliveryType: subOrdersData.length === 1 ? subOrdersData[0].deliveryType : 'mixed',
            deliveryRequired: subOrdersData.some(so => so.deliveryRequired)
        });

        await parentOrder.save({ session });

        // ============================================
        // Create Sub-Orders
        // ============================================
        const createdSubOrders = [];
        let deliveryLocation = null;
        try {
            const geocoded = await geocodeAddress(customer.address);
            if (geocoded) {
                deliveryLocation = {
                    latitude: geocoded.latitude,
                    longitude: geocoded.longitude,
                    address: customer.address
                };
            }
        } catch (geoError) {
            console.warn('⚠️ Geocoding failed:', geoError.message);
        }

        for (const subOrderData of subOrdersData) {
            const subOrderId = await SubOrder.generateSubOrderId(parentOrderId, session);

            const subOrder = new SubOrder({
                subOrderId,
                parentOrder: parentOrder._id,
                farmerId: subOrderData.vendor.vendorType === 'farmer' ? subOrderData.vendor.vendorId : null,
                vendor: subOrderData.vendor,
                items: subOrderData.items,
                subtotal: subOrderData.subtotal,
                deliveryOption: subOrderData.deliveryOption,
                deliveryType: subOrderData.deliveryType,
                deliveryRequired: subOrderData.deliveryRequired,
                deliveryCharge: subOrderData.deliveryCharge,
                total: subOrderData.total,
                paymentStatus: 'Unpaid',
                status: paymentMethod === 'Cash on Delivery' ? 'confirmed' : 'pending',
                deliveryLocation,
                trackingEnabled: subOrderData.deliveryOption === 'DELIVERY_AGENT'
            });

            await subOrder.save({ session });
            createdSubOrders.push(subOrder);
        }

        parentOrder.subOrders = createdSubOrders.map(so => so._id);
        await parentOrder.updateOverallStatus(session);

        // ============================================
        // Handle Online Payment
        // ============================================
        if (paymentMethod === 'Online Payment') {
            const lineItems = createdSubOrders.flatMap(subOrder =>
                subOrder.items.map(item => ({
                    price_data: {
                        currency: 'inr',
                        product_data: {
                            name: item.name,
                            description: `From: ${subOrder.vendor.vendorName}`
                        },
                        unit_amount: Math.round(item.price * 100)
                    },
                    quantity: item.quantity
                }))
            );

            createdSubOrders.forEach(subOrder => {
                if (subOrder.deliveryCharge > 0) {
                    lineItems.push({
                        price_data: {
                            currency: 'inr',
                            product_data: {
                                name: `Delivery Charge - ${subOrder.vendor.vendorName}`
                            },
                            unit_amount: Math.round(subOrder.deliveryCharge * 100)
                        },
                        quantity: 1
                    });
                }
            });

            const stripeSession = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: lineItems,
                mode: 'payment',
                success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/order-success/${parentOrder._id}`,
                cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout`,
                metadata: {
                    parentOrderId: parentOrder._id.toString(),
                    userId: userId.toString()
                }
            });

            parentOrder.sessionId = stripeSession.id;
            await parentOrder.save({ session });

            await session.commitTransaction();

            return res.status(201).json({
                success: true,
                message: 'Parent order created successfully',
                parentOrder: {
                    parentOrderId: parentOrder.parentOrderId,
                    _id: parentOrder._id,
                    totalAmount: parentOrder.totalAmount,
                    paymentMethod: parentOrder.paymentMethod,
                    paymentStatus: parentOrder.paymentStatus,
                    sessionId: stripeSession.id,
                    sessionUrl: stripeSession.url,
                    subOrders: createdSubOrders.map(so => ({
                        subOrderId: so.subOrderId,
                        vendorName: so.vendor.vendorName,
                        deliveryOption: so.deliveryOption,
                        total: so.total,
                        status: so.status
                    }))
                }
            });
        }

        await session.commitTransaction();

        return res.status(201).json({
            success: true,
            message: 'Parent order placed successfully',
            parentOrder: {
                parentOrderId: parentOrder.parentOrderId,
                _id: parentOrder._id,
                totalAmount: parentOrder.totalAmount,
                paymentMethod: parentOrder.paymentMethod,
                paymentStatus: parentOrder.paymentStatus,
                subOrders: createdSubOrders.map(so => ({
                    subOrderId: so.subOrderId,
                    vendorName: so.vendor.vendorName,
                    deliveryOption: so.deliveryOption,
                    total: so.total,
                    status: so.status
                }))
            }
        });

    } catch (error) {
        if (session) await session.abortTransaction();
        console.error('❌ Error creating parent order:', error);

        // Return a cleaner error message
        const message = error.name === 'ValidationError'
            ? Object.values(error.errors).map(val => val.message).join(', ')
            : error.message || 'An unexpected error occurred while placing your order';

        return res.status(500).json({
            success: false,
            message: message,
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        if (session) session.endSession();
    }
};

// ============================================
// CONFIRM PAYMENT
// ============================================
export const confirmParentOrderPayment = async (req, res) => {
    try {
        const { sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'Session ID is required'
            });
        }

        const parentOrder = await ParentOrder.findOne({ sessionId });

        if (!parentOrder) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (parentOrder.paymentStatus === 'Paid') {
            return res.status(200).json({
                success: true,
                message: 'Payment already confirmed',
                parentOrder
            });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status !== 'paid') {
            return res.status(400).json({
                success: false,
                message: 'Payment not completed'
            });
        }

        const mongoSession = await ParentOrder.startSession();
        mongoSession.startTransaction();

        try {
            const subOrders = await SubOrder.find({ parentOrder: parentOrder._id }).session(mongoSession);

            for (const subOrder of subOrders) {
                for (const item of subOrder.items) {
                    const product = await Product.findById(item.productId).session(mongoSession);
                    if (product) {
                        product.stock -= item.quantity;
                        await product.save({ session: mongoSession });
                    }
                }

                subOrder.status = 'confirmed';
                subOrder.paymentStatus = 'Paid';
                await subOrder.save({ session: mongoSession });
            }

            parentOrder.paymentStatus = 'Paid';
            parentOrder.paymentIntentId = session.payment_intent;
            await parentOrder.save({ session: mongoSession });

            await mongoSession.commitTransaction();

            console.log('✅ Payment confirmed for parent order:', parentOrder.parentOrderId);

            return res.status(200).json({
                success: true,
                message: 'Payment confirmed successfully',
                parentOrder
            });

        } catch (error) {
            await mongoSession.abortTransaction();
            throw error;
        } finally {
            mongoSession.endSession();
        }

    } catch (error) {
        console.error('❌ Error confirming payment:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to confirm payment'
        });
    }
};

// ============================================
// GET PARENT ORDER BY ID (No changes needed)
// ============================================
export const getParentOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const parentOrder = await ParentOrder.findById(id)
            .populate('user', 'name email')
            .populate({
                path: 'subOrders',
                populate: {
                    path: 'assignedAgent',
                    select: 'name phone'
                }
            });

        if (!parentOrder) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (userRole !== 'admin' && parentOrder.user._id.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        return res.status(200).json({
            success: true,
            parentOrder
        });

    } catch (error) {
        console.error('❌ Error fetching parent order:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch order'
        });
    }
};

// ============================================
// GET CUSTOMER'S PARENT ORDERS (No changes needed)
// ============================================
export const getCustomerParentOrders = async (req, res) => {
    try {
        const userId = req.user.id;

        const parentOrders = await ParentOrder.find({ user: userId })
            .populate({
                path: 'subOrders',
                select: 'subOrderId vendor status deliveryOption total items deliveryStatus deliveryDate paymentStatus updatedAt'
            })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: parentOrders.length,
            parentOrders
        });

    } catch (error) {
        console.error('❌ Error fetching customer orders:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch orders'
        });
    }
};

// ============================================
// GET ALL PARENT ORDERS (Admin Only - No changes needed)
// ============================================
export const getAllParentOrders = async (req, res) => {
    try {
        const parentOrders = await ParentOrder.find()
            .populate('user', 'name email phone')
            .populate({
                path: 'subOrders',
                select: 'subOrderId vendor status items deliveryOption deliveryStatus deliveryDate total assignedAgent paymentStatus updatedAt'
            })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: parentOrders.length,
            parentOrders
        });

    } catch (error) {
        console.error('❌ Error fetching all parent orders:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch orders'
        });
    }
};