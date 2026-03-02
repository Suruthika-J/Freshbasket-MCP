// backend/services/orderStatusService.js
import SubOrder from '../models/SubOrderModel.js';
import ParentOrder from '../models/ParentOrderModel.js';
import mongoose from 'mongoose';

/**
 * Centralized service for updating order statuses across the system.
 * Handles SubOrder status updates and triggers ParentOrder aggregation.
 */
export const syncOrderStatus = async (subOrderId, newStatus, userRole, userId, session = null) => {
    console.log(`\n🔄 SYNC: Updating status for SubOrder: ${subOrderId}`);
    console.log(`   Requested by: ${userRole} (${userId})`);
    console.log(`   New Status: ${newStatus}`);

    // Find sub-order by _id or subOrderId
    let subOrder;
    if (mongoose.Types.ObjectId.isValid(subOrderId)) {
        subOrder = await SubOrder.findById(subOrderId).session(session);
    }

    if (!subOrder) {
        subOrder = await SubOrder.findOne({ subOrderId: subOrderId }).session(session);
    }

    if (!subOrder) {
        throw new Error(`Sub-order not found: ${subOrderId}`);
    }

    // Capture old status for logging
    const oldStatus = subOrder.status;
    const oldDeliveryStatus = subOrder.deliveryStatus;

    // Apply role-based logic and mapping
    if (userRole === 'agent') {
        // Agent updates deliveryStatus
        const targetStatus = newStatus.toUpperCase();
        if (!['PICKED_UP', 'DELIVERED', 'RETURNED'].includes(targetStatus)) {
            throw new Error(`Invalid status update for delivery agent: ${newStatus}`);
        }

        subOrder.deliveryStatus = targetStatus;

        // Sync with primary status field
        if (targetStatus === 'DELIVERED') {
            subOrder.status = 'delivered';
            subOrder.deliveryDate = new Date();
        } else if (targetStatus === 'PICKED_UP') {
            subOrder.status = 'out-for-delivery';
        }
    }
    else if (userRole === 'farmer') {
        // Farmer updates primary status
        const allowedStatuses = ['preparing', 'ready'];

        // If self-pickup, farmer can also mark as delivered
        if (subOrder.deliveryOption === 'SELF_PICKUP' || subOrder.deliveryType === 'selfPickup') {
            allowedStatuses.push('delivered');
        }

        if (!allowedStatuses.includes(newStatus.toLowerCase())) {
            throw new Error(`Invalid status update for farmer: ${newStatus}`);
        }

        subOrder.status = newStatus.toLowerCase();

        // Sync delivery status if it's becoming delivered
        if (subOrder.status === 'delivered') {
            subOrder.deliveryStatus = 'DELIVERED';
            subOrder.deliveryDate = new Date();
        }
    }
    else if (userRole === 'admin') {
        // Admin has full control
        if (newStatus.toUpperCase() === newStatus && ['PICKED_UP', 'DELIVERED', 'ASSIGNED', 'PENDING_ASSIGNMENT'].includes(newStatus)) {
            subOrder.deliveryStatus = newStatus;
            if (newStatus === 'DELIVERED') {
                subOrder.status = 'delivered';
                subOrder.deliveryDate = new Date();
            } else if (newStatus === 'PICKED_UP') {
                subOrder.status = 'out-for-delivery';
            }
        } else {
            subOrder.status = newStatus.toLowerCase();
            // Sync delivery status for 'delivered'
            if (subOrder.status === 'delivered') {
                subOrder.deliveryStatus = 'DELIVERED';
                subOrder.deliveryDate = new Date();
            }
        }
    } else {
        throw new Error(`Unauthorized role for status update: ${userRole}`);
    }

    // Save changes to sub-order
    await subOrder.save({ session });

    console.log(`✅ SUCCESS: SubOrder ${subOrder.subOrderId} updated.`);
    console.log(`   Status: ${oldStatus} -> ${subOrder.status}`);
    console.log(`   DeliveryStatus: ${oldDeliveryStatus} -> ${subOrder.deliveryStatus}`);

    // Trigger ParentOrder update
    const parentOrder = await ParentOrder.findById(subOrder.parentOrder).session(session);
    if (parentOrder) {
        await parentOrder.updateOverallStatus(session);
        console.log(`✅ SUCCESS: ParentOrder ${parentOrder.parentOrderId} re-computed. Overall: ${parentOrder.overallStatus}`);
    }

    return { subOrder, parentOrder };
};
