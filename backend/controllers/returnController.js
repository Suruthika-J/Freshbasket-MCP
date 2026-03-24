// backend/controllers/returnController.js
import mongoose from 'mongoose';
import Return from '../models/ReturnModel.js';
import ReturnRequest from '../models/returnRequestModel.js';
import Order from '../models/orderModel.js';
import SubOrder from '../models/SubOrderModel.js';
import ParentOrder from '../models/ParentOrderModel.js';
import { Product } from '../models/productModel.js';
import { differenceInDays, isSameDay } from 'date-fns';

// ============================================
// CUSTOMER: REQUEST RETURN (SubOrder - Multi-vendor)
// ============================================
export const requestReturn = async (req, res) => {
    try {
        const { subOrderId, items, overallReason, description, images, refundMethod } = req.body;
        const userId = req.user.id || req.user._id;

        // 1. Find the sub-order
        const subOrder = await SubOrder.findById(subOrderId).populate('parentOrder');
        if (!subOrder) {
            return res.status(404).json({ success: false, message: 'Sub-order not found' });
        }

        // 2. Validate user owner
        if (subOrder.parentOrder.user.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        // 3. Check delivery status (must be delivered)
        if (subOrder.status !== 'delivered' && subOrder.deliveryStatus !== 'DELIVERED') {
            return res.status(400).json({ success: false, message: 'Returns can only be requested for delivered orders.' });
        }

        // 4. Validate return policy (Time based)
        const deliveryDate = subOrder.deliveryDate || subOrder.updatedAt;
        const today = new Date();

        // Check if any items are perishable
        const hasPerishable = items.some(item => item.isPerishable);

        if (hasPerishable && !isSameDay(new Date(deliveryDate), today)) {
            return res.status(400).json({
                success: false,
                message: 'Perishable items can only be returned on the same day of delivery.'
            });
        }

        if (differenceInDays(today, new Date(deliveryDate)) > 2) {
            return res.status(400).json({
                success: false,
                message: 'Return window (2 days) has expired for this order.'
            });
        }

        // 5. Calculate refund amount for selected items
        const refundAmount = items.reduce((total, item) => total + (item.price * item.quantity), 0);

        // 6. Create Return Request
        const returnId = await Return.generateReturnId();
        const newReturn = new Return({
            returnId,
            parentOrder: subOrder.parentOrder._id,
            subOrder: subOrder._id,
            user: userId,
            farmerId: subOrder.farmerId,
            items,
            images,
            overallReason,
            description,
            refundDetails: {
                amount: refundAmount,
                method: refundMethod || 'original'
            }
        });

        await newReturn.save();

        // Update sub-order state to indicate return is pending
        subOrder.status = 'returning';
        await subOrder.save();

        // Update parent order overall status
        const parentOrder = await ParentOrder.findById(subOrder.parentOrder._id);
        if (parentOrder && typeof parentOrder.updateOverallStatus === 'function') {
            await parentOrder.updateOverallStatus();
        }

        return res.status(201).json({
            success: true,
            message: 'Return request submitted successfully',
            returnRequest: newReturn
        });

    } catch (error) {
        console.error('❌ Error requesting return:', error);
        return res.status(500).json({ success: false, message: 'Failed to submit return request', error: error.message });
    }
};

// ============================================
// CUSTOMER: REQUEST RETURN (Legacy Order)
// ============================================
export const requestLegacyReturn = async (req, res) => {
    try {
        const { orderId, reason, additionalNotes } = req.body;
        const userId = req.user.id || req.user._id;

        if (!orderId || !reason) {
            return res.status(400).json({ success: false, message: 'Order ID and reason are required.' });
        }

        // 1. Find the legacy order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        // 2. Check ownership — match by user ref OR customer email
        const userData = req.user;
        const isOwner = (order.user && order.user.toString() === userId.toString()) ||
            (order.customer?.email?.toLowerCase() === userData.email?.toLowerCase());

        if (!isOwner) {
            return res.status(403).json({ success: false, message: 'You are not authorized to return this order.' });
        }

        // 3. Only delivered orders can be returned
        if (order.status !== 'Delivered') {
            return res.status(400).json({ success: false, message: 'Only delivered orders can be returned.' });
        }

        // 4. Check if return already requested
        if (order.returnStatus && order.returnStatus !== 'None') {
            return res.status(400).json({
                success: false,
                message: `A return has already been ${order.returnStatus.toLowerCase()} for this order.`
            });
        }

        // 5. Enforce 7-day return window
        const deliveryDate = order.deliveryDate || order.updatedAt || order.date;
        const daysSince = differenceInDays(new Date(), new Date(deliveryDate));
        if (daysSince > 7) {
            return res.status(400).json({
                success: false,
                message: 'Return window (7 days) has expired for this order.'
            });
        }

        // 6. Also create a ReturnRequest document for rich tracking
        const returnRequest = new ReturnRequest({
            orderId: order._id,
            userId,
            reason: reason.trim(),
            collectionAddress: order.customer?.address,
            collectionNotes: additionalNotes || '',
            refundAmount: order.total,
            refundMethod: order.paymentMethod === 'Online Payment' ? 'Original Payment Method' : 'Store Credit'
        });
        await returnRequest.save();

        // 7. Update the order document with return fields
        order.returnStatus = 'Requested';
        order.returnReason = reason.trim();
        order.returnRequestedAt = new Date();
        order.refundAmount = order.total;
        order.refundStatus = 'Pending';
        await order.save();

        return res.status(201).json({
            success: true,
            message: 'Return request submitted successfully. Our team will review it shortly.',
            returnRequest: {
                _id: returnRequest._id,
                orderId: order.orderId,
                reason: reason.trim(),
                status: 'Pending',
                requestedAt: returnRequest.requestedAt,
                refundAmount: order.total
            }
        });

    } catch (error) {
        console.error('❌ Error requesting legacy return:', error);

        // Handle duplicate return request
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'A return request already exists for this order.'
            });
        }

        return res.status(500).json({ success: false, message: 'Failed to submit return request.', error: error.message });
    }
};

// ============================================
// ADMIN/FARMER: GET RETURN REQUESTS (SubOrder returns)
// ============================================
export const getReturnRequests = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const userRole = req.user.role;

        let query = {};
        if (userRole === 'farmer') {
            query.farmerId = userId;
        }

        const returns = await Return.find(query)
            .populate('user', 'name email phone')
            .populate('subOrder', 'subOrderId')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: returns.length,
            returns
        });
    } catch (error) {
        console.error('❌ Error fetching returns:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch returns' });
    }
};

// ============================================
// ADMIN: GET ALL RETURN REQUESTS (Both legacy + SubOrder)
// ============================================
export const getAllReturnRequests = async (req, res) => {
    try {
        // 1. Get SubOrder returns (multi-vendor)
        const subOrderReturns = await Return.find()
            .populate('user', 'name email phone')
            .populate('subOrder', 'subOrderId')
            .sort({ createdAt: -1 });

        // 2. Get legacy order returns
        const legacyReturns = await ReturnRequest.find()
            .populate('orderId', 'orderId total items customer paymentMethod paymentStatus')
            .populate('userId', 'name email phone')
            .populate('handledBy', 'name email')
            .sort({ createdAt: -1 });

        // 3. Normalize them into a unified format
        const normalizedSubOrderReturns = subOrderReturns.map(ret => ({
            _id: ret._id,
            type: 'suborder',
            returnId: ret.returnId,
            orderId: ret.subOrder?.subOrderId || 'N/A',
            user: ret.user ? { name: ret.user.name, email: ret.user.email, phone: ret.user.phone } : null,
            reason: ret.overallReason,
            description: ret.description,
            status: ret.status,
            adminRemarks: ret.adminRemarks,
            items: ret.items,
            refundAmount: ret.refundDetails?.amount || 0,
            refundMethod: ret.refundDetails?.method || 'original',
            images: ret.images,
            createdAt: ret.createdAt,
            updatedAt: ret.updatedAt
        }));

        const normalizedLegacyReturns = legacyReturns.map(ret => ({
            _id: ret._id,
            type: 'legacy',
            returnId: `LR-${ret._id.toString().slice(-8).toUpperCase()}`,
            orderId: ret.orderId?.orderId || 'N/A',
            orderRef: ret.orderId?._id,
            user: ret.userId ? { name: ret.userId.name, email: ret.userId.email, phone: ret.userId.phone } : null,
            reason: ret.reason,
            description: ret.collectionNotes || '',
            status: ret.status === 'Pending' ? 'requested' :
                ret.status === 'Approved' ? 'approved' :
                    ret.status === 'Rejected' ? 'rejected' :
                        ret.status === 'Collected' ? 'picked-up' :
                            ret.status === 'Returned' ? 'refunded' : ret.status.toLowerCase(),
            adminRemarks: ret.adminResponse || '',
            items: ret.orderId?.items || [],
            refundAmount: ret.refundAmount || ret.orderId?.total || 0,
            refundMethod: ret.refundMethod || 'Original Payment Method',
            images: [],
            orderTotal: ret.orderId?.total,
            customer: ret.orderId?.customer,
            paymentMethod: ret.orderId?.paymentMethod,
            createdAt: ret.createdAt,
            updatedAt: ret.updatedAt
        }));

        // Combine and sort by date
        const allReturns = [...normalizedSubOrderReturns, ...normalizedLegacyReturns]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return res.status(200).json({
            success: true,
            count: allReturns.length,
            returns: allReturns
        });

    } catch (error) {
        console.error('❌ Error fetching all returns:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch return requests.' });
    }
};

// ============================================
// ADMIN/FARMER: UPDATE RETURN STATUS (SubOrder returns)
// ============================================
export const updateReturnStatus = async (req, res) => {
    try {
        const { returnId } = req.params;
        const { status, adminRemarks, reusable } = req.body;
        const userRole = req.user.role;

        const returnRequest = await Return.findById(returnId);
        if (!returnRequest) {
            return res.status(404).json({ success: false, message: 'Return request not found' });
        }

        returnRequest.status = status;
        if (adminRemarks) returnRequest.adminRemarks = adminRemarks;
        if (reusable !== undefined) returnRequest.reusable = reusable;

        // Logic for specific status transitions
        if (status === 'received') {
            // Logic for stock management
            if (reusable) {
                for (const item of returnRequest.items) {
                    const product = await Product.findById(item.productId);
                    if (product) {
                        product.stock += item.quantity;
                        await product.save();
                    }
                }
            }
        }

        if (status === 'refunded') {
            returnRequest.refundDetails.processedAt = new Date();

            // 1. Process Wallet Refund if method is wallet
            if (returnRequest.refundDetails.method === 'wallet') {
                const User = mongoose.model('user');
                const user = await User.findById(returnRequest.user);
                if (user) {
                    user.walletBalance = (user.walletBalance || 0) + returnRequest.refundDetails.amount;
                    await user.save();
                }
            } else {
                // Mock: Stripe refund placeholder
                console.log(`💰 REFUND PROCESSED: ₹${returnRequest.refundDetails.amount} → original payment method`);
                console.log(`   Transaction ID: REF-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`);
            }

            // 2. Mark sub-order as refunded
            const subOrder = await SubOrder.findById(returnRequest.subOrder).populate('parentOrder');
            if (subOrder) {
                subOrder.status = 'refunded';
                await subOrder.save();

                // Update parent order overall status
                const parentOrder = await ParentOrder.findById(subOrder.parentOrder._id);
                if (parentOrder && typeof parentOrder.updateOverallStatus === 'function') {
                    await parentOrder.updateOverallStatus();
                }
            }
        }

        await returnRequest.save();

        return res.status(200).json({
            success: true,
            message: `Return status updated to ${status}`,
            returnRequest
        });

    } catch (error) {
        console.error('❌ Error updating return status:', error);
        return res.status(500).json({ success: false, message: 'Failed to update return status' });
    }
};

// ============================================
// ADMIN: UPDATE LEGACY RETURN STATUS
// ============================================
export const updateLegacyReturnStatus = async (req, res) => {
    try {
        const { returnId } = req.params;
        const { status, adminRemarks } = req.body;
        const adminId = req.user.id || req.user._id;

        // 1. Find the return request
        const returnRequest = await ReturnRequest.findById(returnId);
        if (!returnRequest) {
            return res.status(404).json({ success: false, message: 'Return request not found.' });
        }

        // 2. Map incoming status to ReturnRequest model enum
        let mappedStatus;
        switch (status) {
            case 'approved':
                mappedStatus = 'Approved';
                returnRequest.approvedAt = new Date();
                break;
            case 'rejected':
                mappedStatus = 'Rejected';
                break;
            case 'picked-up':
            case 'received':
                mappedStatus = 'Collected';
                returnRequest.collectedAt = new Date();
                break;
            case 'refunded':
                mappedStatus = 'Returned';
                returnRequest.completedAt = new Date();
                returnRequest.refundStatus = 'Completed';
                break;
            default:
                return res.status(400).json({ success: false, message: `Invalid status: ${status}` });
        }

        returnRequest.status = mappedStatus;
        returnRequest.handledBy = adminId;
        if (adminRemarks) returnRequest.adminResponse = adminRemarks;

        await returnRequest.save();

        // 3. Update the legacy Order document
        const order = await Order.findById(returnRequest.orderId);
        if (order) {
            switch (mappedStatus) {
                case 'Approved':
                    order.returnStatus = 'Approved';
                    order.returnHandledBy = adminId;
                    order.returnHandledAt = new Date();
                    order.refundStatus = 'Pending';
                    break;
                case 'Rejected':
                    order.returnStatus = 'Rejected';
                    order.returnHandledBy = adminId;
                    order.returnHandledAt = new Date();
                    order.refundStatus = 'None';
                    order.refundAmount = 0;
                    break;
                case 'Returned':
                    order.returnStatus = 'Completed';
                    order.refundStatus = 'Completed';
                    // Mock refund processing
                    console.log(`💰 LEGACY REFUND PROCESSED: ₹${order.refundAmount || order.total} for Order ${order.orderId}`);
                    console.log(`   Transaction ID: LREF-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`);
                    break;
                default:
                    break;
            }
            await order.save();
        }

        return res.status(200).json({
            success: true,
            message: `Legacy return status updated to ${mappedStatus}`,
            returnRequest
        });

    } catch (error) {
        console.error('❌ Error updating legacy return status:', error);
        return res.status(500).json({ success: false, message: 'Failed to update legacy return status.' });
    }
};

// ============================================
// CUSTOMER: GET MY RETURNS (SubOrder + Legacy)
// ============================================
export const getMyReturns = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;

        // SubOrder returns
        const subOrderReturns = await Return.find({ user: userId })
            .populate('subOrder', 'subOrderId')
            .sort({ createdAt: -1 });

        // Legacy returns
        const legacyReturns = await ReturnRequest.find({ userId })
            .populate('orderId', 'orderId total items customer')
            .sort({ createdAt: -1 });

        const normalizedLegacy = legacyReturns.map(ret => ({
            _id: ret._id,
            type: 'legacy',
            returnId: `LR-${ret._id.toString().slice(-8).toUpperCase()}`,
            overallReason: ret.reason,
            description: ret.collectionNotes || '',
            status: ret.status === 'Pending' ? 'requested' :
                ret.status === 'Approved' ? 'approved' :
                    ret.status === 'Rejected' ? 'rejected' :
                        ret.status === 'Collected' ? 'picked-up' :
                            ret.status === 'Returned' ? 'refunded' : ret.status.toLowerCase(),
            items: ret.orderId?.items || [],
            refundDetails: { amount: ret.refundAmount || ret.orderId?.total || 0 },
            adminRemarks: ret.adminResponse || '',
            createdAt: ret.createdAt,
            subOrder: { subOrderId: ret.orderId?.orderId || 'Legacy' }
        }));

        const allReturns = [...subOrderReturns.map(r => r.toObject()), ...normalizedLegacy]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return res.status(200).json({ success: true, returns: allReturns });
    } catch (error) {
        console.error('❌ Error fetching user returns:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch your returns' });
    }
};