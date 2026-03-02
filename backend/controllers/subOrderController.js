// backend/controllers/subOrderController.js
// Sub Order Controller - Handles vendor-specific order operations

import SubOrder from '../models/SubOrderModel.js';
import ParentOrder from '../models/ParentOrderModel.js';
import { Product } from '../models/productModel.js';


// ============================================
// GET SUB-ORDER BY ID (Role-based access)
// ============================================
export const getSubOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id || req.user._id;
        const userRole = req.user.role;

        // Try to find by _id first, then by subOrderId
        let subOrder = await SubOrder.findById(id)
            .populate('parentOrder', 'parentOrderId customer paymentMethod paymentStatus')
            .populate('assignedAgent', 'name phone email');

        if (!subOrder) {
            subOrder = await SubOrder.findOne({ subOrderId: id })
                .populate('parentOrder', 'parentOrderId customer')
                .populate('assignedAgent', 'name phone email');
        }

        if (!subOrder) {
            return res.status(404).json({
                success: false,
                message: 'Sub-order not found'
            });
        }

        // Role-based access control
        const vendorId = subOrder.vendor?.vendorId || subOrder.farmerId;

        if (userRole === 'farmer') {
            // Farmer can only see sub-orders with their products
            if (vendorId?.toString() !== userId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: You can only view your own sub-orders'
                });
            }
        } else if (userRole === 'agent') {
            // Agent can only see assigned sub-orders
            if (!subOrder.assignedAgent || subOrder.assignedAgent._id.toString() !== userId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: This order is not assigned to you'
                });
            }
        } else if (userRole === 'user') {
            // Customer can see their own sub-orders
            const parentOrder = await ParentOrder.findById(subOrder.parentOrder);
            if (!parentOrder || parentOrder.user.toString() !== userId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: This order does not belong to you'
                });
            }
        }
        // Admin can see all

        return res.status(200).json({
            success: true,
            subOrder
        });

    } catch (error) {
        console.error('❌ Error fetching sub-order:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch sub-order',
            error: error.message
        });
    }
};

// ============================================
// GET FARMER'S SUB-ORDERS

export const getFarmerSubOrders = async (req, res) => {
    try {
        console.log('🌾 Farmer Orders API Hit');

        // Extract farmerId from the JWT token
        const farmerId = req.user.id || req.user._id;

        if (!farmerId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: No user session found'
            });
        }

        console.log('🔍 Searching orders for farmer:', farmerId);

        // Query orders where subOrders.farmerId matches or vendor.vendorId matches
        const subOrders = await SubOrder.find({
            $or: [
                { farmerId: farmerId },
                { 'vendor.vendorId': farmerId.toString() }
            ]
        })
            .populate({
                path: 'parentOrder',
                select: 'parentOrderId customer paymentStatus paymentMethod',
                model: 'ParentOrder'
            })
            .sort({ createdAt: -1 })
            .lean();

        console.log(`📊 Found ${subOrders.length} raw sub-orders`);

        if (subOrders.length === 0) {
            return res.status(200).json({
                success: true,
                count: 0,
                subOrders: [],
                message: 'No sub-orders found for this farmer'
            });
        }

        // Format each response object
        const formattedSubOrders = subOrders.map(so => {
            // Safe access to items
            const items = Array.isArray(so.items) ? so.items : [];

            return {
                _id: so._id,
                subOrderId: so.subOrderId || 'N/A',
                parentOrderId: so.parentOrder?.parentOrderId || 'N/A',
                customerName: so.parentOrder?.customer?.name || 'N/A',
                customerPhone: so.parentOrder?.customer?.phone || 'N/A',
                customerAddress: so.parentOrder?.customer?.address || 'N/A',
                items: items.map(item => ({
                    productId: item.productId,
                    name: item.name || 'Unknown Item',
                    quantity: item.quantity || 0,
                    price: item.price || 0,
                    subtotal: (item.price || 0) * (item.quantity || 0)
                })),
                subTotal: so.subtotal || 0,
                orderStatus: so.status || 'pending',
                paymentStatus: so.paymentStatus || (so.parentOrder?.paymentStatus === 'Paid' ? 'Paid' : 'Unpaid'),
                paymentMethod: so.parentOrder?.paymentMethod || 'N/A',
                deliveryOption: so.deliveryOption || 'N/A',
                createdAt: so.createdAt || new Date()
            };
        });

        console.log(`✅ Successfully formatted ${formattedSubOrders.length} sub-orders`);

        return res.status(200).json({
            success: true,
            count: formattedSubOrders.length,
            subOrders: formattedSubOrders
        });

    } catch (error) {
        console.error('❌ Database Error in getFarmerSubOrders:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching farmer orders',
            error: error.message
        });
    }
};
// ============================================
// GET SUB-ORDERS FOR DELIVERY AGENT
// ============================================
export const getAgentSubOrders = async (req, res) => {
    try {
        const agentId = req.user.id || req.user._id;

        const subOrders = await SubOrder.find({
            assignedAgent: agentId,
            deliveryRequired: true
        })
            .populate('parentOrder', 'parentOrderId customer paymentMethod paymentStatus')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: subOrders.length,
            subOrders
        });

    } catch (error) {
        console.error('❌ Error fetching agent sub-orders:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch sub-orders'
        });
    }
};

import { syncOrderStatus } from '../services/orderStatusService.js';

// ============================================
// UPDATE SUB-ORDER STATUS (Role-based) Centralized
// ============================================
export const updateSubOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, deliveryStatus } = req.body;
        const userId = req.user.id || req.user._id;
        const userRole = req.user.role;

        const targetStatus = deliveryStatus || status;

        if (!targetStatus) {
            return res.status(400).json({
                success: false,
                message: 'Status or deliveryStatus is required'
            });
        }

        // Use the centralized service
        const { subOrder, parentOrder } = await syncOrderStatus(id, targetStatus, userRole, userId);

        return res.status(200).json({
            success: true,
            message: `Status updated successfully to ${targetStatus}`,
            subOrder,
            parentOrderStatus: parentOrder?.orderStatus || 'N/A'
        });

    } catch (error) {
        console.error('❌ Error updating sub-order status:', error.message);
        return res.status(error.message.includes('Access denied') ? 403 : 400).json({
            success: false,
            message: error.message || 'Failed to update status'
        });
    }
};

// ============================================
// GET ALL SUB-ORDERS (Admin only)
// ============================================
export const getAllSubOrders = async (req, res) => {
    try {
        const { vendorType, status, deliveryOption } = req.query;

        const filter = {};

        if (vendorType) {
            filter['vendor.vendorType'] = vendorType;
        }

        if (status) {
            filter.status = status;
        }

        if (deliveryOption) {
            filter.deliveryOption = deliveryOption;
        }

        const subOrders = await SubOrder.find(filter)
            .populate('parentOrder', 'parentOrderId customer paymentStatus paymentMethod')
            .populate('assignedAgent', 'name phone email')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: subOrders.length,
            subOrders
        });

    } catch (error) {
        console.error('❌ Error fetching all sub-orders:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch sub-orders'
        });
    }
};

// ============================================
// GET PENDING DELIVERY REQUESTS (Admin only)
// ============================================
export const getPendingDeliveryRequests = async (req, res) => {
    try {
        // Sub-orders that need delivery agent but don't have one assigned
        const pendingDeliveries = await SubOrder.find({
            deliveryRequired: true,
            deliveryStatus: 'PENDING_ASSIGNMENT',
            assignedAgent: null,
            status: { $nin: ['cancelled', 'delivered'] }
        })
            .populate('parentOrder', 'parentOrderId customer paymentMethod paymentStatus')
            .sort({ createdAt: 1 }); // Oldest first

        return res.status(200).json({
            success: true,
            count: pendingDeliveries.length,
            pendingDeliveries
        });

    } catch (error) {
        console.error('❌ Error fetching pending deliveries:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch pending deliveries'
        });
    }
};

// ============================================
// ASSIGN DELIVERY AGENT (Admin only)
// ============================================
export const assignDeliveryAgent = async (req, res) => {
    try {
        const { subOrderId } = req.params;
        const { agentId } = req.body;

        if (!agentId) {
            return res.status(400).json({
                success: false,
                message: 'Agent ID is required'
            });
        }

        const subOrder = await SubOrder.findById(subOrderId);

        if (!subOrder) {
            return res.status(404).json({
                success: false,
                message: 'Sub-order not found'
            });
        }

        // Prevent assignment if deliveryMode is SELF_PICKUP or deliveryRequired is false
        if (subOrder.deliveryOption === 'SELF_PICKUP' || subOrder.deliveryType === 'self_pickup' || subOrder.deliveryType === 'selfPickup' || !subOrder.deliveryRequired) {
            return res.status(400).json({
                success: false,
                message: 'Cannot assign delivery agent for Self-Pickup orders'
            });
        }

        if (subOrder.assignedAgent) {
            return res.status(400).json({
                success: false,
                message: 'Sub-order already has an assigned agent'
            });
        }

        // Assign agent
        subOrder.assignedAgent = agentId;
        subOrder.assignedAt = new Date();
        subOrder.deliveryStatus = 'ASSIGNED';
        subOrder.status = 'confirmed'; // Sync legacy status
        subOrder.trackingEnabled = true;

        await subOrder.save();

        // ============================================
        // 🔔 NOTIFICATION (As per requirement)
        // ============================================
        console.log(`🔔 NOTIFY: Farmer ${subOrder.vendor.vendorName} that their order ${subOrder.subOrderId} has been assigned to agent.`);
        console.log(`🔔 NOTIFY: Delivery Agent ${agentId} that a new order ${subOrder.subOrderId} is assigned to them.`);
        // ============================================

        console.log(`✅ Agent ${agentId} assigned to sub-order ${subOrder.subOrderId}`);

        return res.status(200).json({
            success: true,
            message: 'Delivery agent assigned successfully',
            subOrder
        });

    } catch (error) {
        console.error('❌ Error assigning delivery agent:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to assign delivery agent'
        });
    }
};

// ============================================
// UNASSIGN DELIVERY AGENT (Admin only)
// ============================================
export const unassignDeliveryAgent = async (req, res) => {
    try {
        const { id } = req.params;

        const subOrder = await SubOrder.findById(id);

        if (!subOrder) {
            return res.status(404).json({
                success: false,
                message: 'Sub-order not found'
            });
        }

        if (!subOrder.assignedAgent) {
            return res.status(400).json({
                success: false,
                message: 'No agent assigned to this sub-order'
            });
        }

        // Unassign agent
        const oldAgentId = subOrder.assignedAgent;
        subOrder.assignedAgent = null;
        subOrder.assignedAt = null;
        subOrder.status = 'pending';
        subOrder.trackingEnabled = false;

        await subOrder.save();

        console.log(`✅ Agent ${oldAgentId} unassigned from sub-order ${subOrder.subOrderId}`);

        return res.status(200).json({
            success: true,
            message: 'Delivery agent unassigned successfully',
            subOrder
        });

    } catch (error) {
        console.error('❌ Error unassigning delivery agent:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to unassign delivery agent'
        });
    }
};

// ============================================
// UPDATE AGENT LOCATION (Agent only)
// ============================================
export const updateAgentLocation = async (req, res) => {
    try {
        const { subOrderId, latitude, longitude } = req.body;
        const agentId = req.user.id;

        if (!subOrderId || !latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Sub-order ID, latitude, and longitude are required'
            });
        }

        const subOrder = await SubOrder.findById(subOrderId);

        if (!subOrder) {
            return res.status(404).json({
                success: false,
                message: 'Sub-order not found'
            });
        }

        // Verify agent is assigned to this sub-order
        if (!subOrder.assignedAgent || subOrder.assignedAgent.toString() !== agentId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Update agent location
        subOrder.agentLocation = {
            latitude,
            longitude,
            updatedAt: new Date()
        };

        await subOrder.save();

        return res.status(200).json({
            success: true,
            message: 'Location updated successfully'
        });

    } catch (error) {
        console.error('❌ Error updating agent location:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update location'
        });
    }
};

// ============================================
// UPDATE SUB-ORDER PAYMENT STATUS (Role-based)
// ============================================
export const updateSubOrderPaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentStatus } = req.body;
        const userId = req.user.id || req.user._id;
        const userRole = req.user.role;

        if (!paymentStatus) {
            return res.status(400).json({
                success: false,
                message: 'paymentStatus is required'
            });
        }

        const subOrder = await SubOrder.findById(id);

        if (!subOrder) {
            return res.status(404).json({
                success: false,
                message: 'Sub-order not found'
            });
        }

        // Role-based authorization
        if (userRole === 'farmer') {
            const vendorId = subOrder.vendor?.vendorId || subOrder.farmerId;
            if (vendorId?.toString() !== userId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: You can only update payment for your own sub-orders'
                });
            }
        } else if (userRole === 'agent') {
            if (!subOrder.assignedAgent || subOrder.assignedAgent.toString() !== userId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: You can only update payment for orders assigned to you'
                });
            }
        }
        // Admin has full access

        subOrder.paymentStatus = paymentStatus;
        await subOrder.save();

        // Also update parent order payment status if needed (e.g. if all sub-orders are paid)
        if (paymentStatus === 'Paid') {
            const parentOrder = await ParentOrder.findById(subOrder.parentOrder);
            if (parentOrder) {
                const otherSubOrders = await SubOrder.find({
                    parentOrder: parentOrder._id,
                    _id: { $ne: subOrder._id }
                });
                const allPaid = otherSubOrders.every(so => so.paymentStatus === 'Paid');
                if (allPaid) {
                    parentOrder.paymentStatus = 'Paid';
                    await parentOrder.save();
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: `Payment status updated to ${paymentStatus}`,
            subOrder
        });

    } catch (error) {
        console.error('❌ Error updating payment status:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update payment status',
            error: error.message
        });
    }
};
