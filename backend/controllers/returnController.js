// backend/controllers/returnController.js
import mongoose from 'mongoose';
import Return from '../models/ReturnModel.js';
import SubOrder from '../models/SubOrderModel.js';
import ParentOrder from '../models/ParentOrderModel.js';
import { Product } from '../models/productModel.js';
import { differenceInDays, isSameDay } from 'date-fns';

// ============================================
// CUSTOMER: REQUEST RETURN
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
// ADMIN/FARMER: GET RETURN REQUESTS
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
// ADMIN/FARMER: UPDATE RETURN STATUS (Approve/Reject)
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
                // Here you'd normally integrate with Stripe refund API for 'original' method
                console.log(`Refund of ₹${returnRequest.refundDetails.amount} processed to original payment method.`);
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
// CUSTOMER: GET MY RETURNS
// ============================================
export const getMyReturns = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const returns = await Return.find({ user: userId })
            .populate('subOrder', 'subOrderId')
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, returns });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch your returns' });
    }
};