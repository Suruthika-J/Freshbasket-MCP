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
        const userId = req.user.id;
        const userRole = req.user.role;

        const subOrder = await SubOrder.findById(id)
            .populate('parentOrder', 'parentOrderId customer')
            .populate('assignedAgent', 'name phone email');

        if (!subOrder) {
            return res.status(404).json({
                success: false,
                message: 'Sub-order not found'
            });
        }

        // Role-based access control
        if (userRole === 'farmer') {
            // Farmer can only see sub-orders with their products
            if (subOrder.vendor.vendorId.toString() !== userId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
        } else if (userRole === 'agent') {
            // Agent can only see assigned sub-orders
            if (!subOrder.assignedAgent || subOrder.assignedAgent._id.toString() !== userId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
        } else if (userRole === 'user') {
            // Customer can see their own sub-orders
            const parentOrder = await ParentOrder.findById(subOrder.parentOrder);
            if (!parentOrder || parentOrder.user.toString() !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
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
            message: 'Failed to fetch sub-order'
        });
    }
};

// ============================================
// GET FARMER'S SUB-ORDERS

export const getFarmerSubOrders = async (req, res) => {
    try {
        console.log('🌾 Farmer Orders API Hit');

        // Extract farmerId from the JWT token (set by authMiddleware)
        const farmerId = req.user.id || req.user._id;

        if (!farmerId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Invalid or expired token'
            });
        }

        // Query orders where subOrders.farmerId matches (or vendor.vendorId for legacy)
        const subOrders = await SubOrder.find({
            $or: [
                { farmerId: farmerId },
                { 'vendor.vendorId': farmerId.toString(), 'vendor.vendorType': 'farmer' }
            ]
        })
            .populate({
                path: 'parentOrder',
                select: 'parentOrderId customer',
                model: 'ParentOrder'
            })
            .sort({ createdAt: -1 })
            .lean();

        if (subOrders.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No sub-orders found for this farmer'
            });
        }

        // Format each response object as per requirements
        const formattedSubOrders = subOrders.map(so => ({
            _id: so._id,
            subOrderId: so.subOrderId, // Keep for display
            parentOrderId: so.parentOrder?.parentOrderId || 'N/A',
            customerName: so.parentOrder?.customer?.name || 'N/A',
            customerPhone: so.parentOrder?.customer?.phone || 'N/A',
            customerAddress: so.parentOrder?.customer?.address || 'N/A',
            items: so.items.map(item => ({
                productId: item.productId,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                subtotal: (item.price * item.quantity)
            })),
            subTotal: so.subtotal,
            orderStatus: so.status,
            paymentStatus: so.paymentStatus || (so.parentOrder?.paymentStatus === 'Paid' ? 'Paid' : 'Unpaid'),
            deliveryOption: so.deliveryOption,
            createdAt: so.createdAt
        }));

        console.log(`✅ Successfully fetched ${formattedSubOrders.length} sub-orders for farmer`);

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
            .populate('parentOrder', 'parentOrderId customer')
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

// ============================================
// UPDATE SUB-ORDER STATUS (Role-based)
// ============================================
export const updateSubOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, deliveryStatus } = req.body; // Can accept both for compatibility
        const userId = req.user.id;
        const userRole = req.user.role;

        const subOrder = await SubOrder.findById(id);

        if (!subOrder) {
            return res.status(404).json({
                success: false,
                message: 'Sub-order not found'
            });
        }

        // Handle Delivery Agent specific status updates
        if (userRole === 'agent') {
            const targetStatus = deliveryStatus || status;

            if (!subOrder.assignedAgent || subOrder.assignedAgent.toString() !== userId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: You are not assigned to this sub-order'
                });
            }

            if (!['PICKED_UP', 'DELIVERED'].includes(targetStatus)) {
                return res.status(400).json({
                    success: false,
                    message: 'Agents can only update status to: PICKED_UP, DELIVERED'
                });
            }

            subOrder.deliveryStatus = targetStatus;

            // Sync legacy status field for compatibility
            if (targetStatus === 'DELIVERED') {
                subOrder.status = 'delivered';
                subOrder.deliveryDate = new Date();
            } else if (targetStatus === 'PICKED_UP') {
                subOrder.status = 'out-for-delivery';
            }
        }
        // Handle Farmer status updates
        else if (userRole === 'farmer') {
            if (subOrder.vendor.vendorId.toString() !== userId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            if (!subOrder.canVendorUpdateStatus(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Farmers can only update status to: preparing, ready'
                });
            }
            subOrder.status = status;
        }
        // Admin can do anything
        else if (userRole === 'admin') {
            if (status) subOrder.status = status;
            if (deliveryStatus) subOrder.deliveryStatus = deliveryStatus;
        } else {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        await subOrder.save();
        return res.status(200).json({
            success: true,
            message: 'Status updated successfully',
            subOrder
        });

    } catch (error) {
        console.error('❌ Error updating order status:', error);
        return res.status(500).json({
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
            .populate('parentOrder', 'parentOrderId customer paymentStatus')
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
            .populate('parentOrder', 'parentOrderId customer')
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

        // Prevent assignment if subOrder belongs to Admin
        if (subOrder.vendor.vendorType === 'admin') {
            return res.status(400).json({
                success: false,
                message: 'Cannot assign delivery agent to Admin products'
            });
        }

        // Prevent assignment if deliveryMode is SELF_PICKUP or deliveryRequired is false
        if (subOrder.deliveryOption === 'SELF_PICKUP' || subOrder.deliveryType === 'self_pickup' || !subOrder.deliveryRequired) {
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
