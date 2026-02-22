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
        console.log('🌾 Farmer Orders Request Received');

        if (!req.user || (!req.user.id && !req.user._id)) {
            console.log('❌ Auth Error: No user ID in request');
            return res.status(401).json({
                success: false,
                message: 'Authentication failed'
            });
        }

        const farmerId = (req.user.id || req.user._id).toString();

        console.log('🌾 Initializing sub-order search for farmer:', farmerId);

        // Verify SubOrder model is ready
        if (!SubOrder) {
            console.error('❌ Model Error: SubOrder model is undefined');
            throw new Error('Database model error');
        }

        const subOrders = await SubOrder.find({
            'vendor.vendorId': farmerId,
            'vendor.vendorType': 'farmer'
        })
            .populate({
                path: 'parentOrder',
                select: 'parentOrderId customer paymentStatus createdAt',
                model: 'ParentOrder'
            })
            .populate('assignedAgent', 'name phone')
            .sort({ createdAt: -1 })
            .lean(); // Use lean for performance and easier object manipulation

        console.log(`✅ MongoDB Query Success: Found ${subOrders.length} sub-orders`);

        // ✅ Enhance response with customer data
        const enrichedSubOrders = subOrders.map(subOrder => {
            // Since we use .lean(), subOrder is already a plain JS object
            const result = { ...subOrder };

            // Safe extraction of customer data
            if (subOrder.parentOrder && typeof subOrder.parentOrder === 'object') {
                result.customer = subOrder.parentOrder.customer || {
                    name: 'N/A',
                    email: 'N/A',
                    phone: 'N/A',
                    address: 'N/A'
                };
            } else {
                result.customer = {
                    name: 'N/A',
                    email: 'N/A',
                    phone: 'N/A',
                    address: 'N/A'
                };
            }

            return result;
        });

        console.log('📤 Sending enriched sub-orders to client');

        return res.status(200).json({
            success: true,
            count: enrichedSubOrders.length,
            subOrders: enrichedSubOrders
        });

    } catch (error) {
        console.error('❌ CRITICAL ERROR in getFarmerSubOrders:');
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);

        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching orders',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
// ============================================
// GET AGENT'S ASSIGNED SUB-ORDERS
// ============================================
export const getAgentSubOrders = async (req, res) => {
    try {
        const agentId = req.user.id;

        const subOrders = await SubOrder.find({
            assignedAgent: agentId
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
        const { status } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }

        const subOrder = await SubOrder.findById(id);

        if (!subOrder) {
            return res.status(404).json({
                success: false,
                message: 'Sub-order not found'
            });
        }

        // Role-based validation
        if (userRole === 'farmer') {
            // Farmer can only update their own sub-orders
            if (subOrder.vendor.vendorId.toString() !== userId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            // Farmer can only set specific statuses
            if (!subOrder.canVendorUpdateStatus(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Farmers can only update status to: preparing, ready'
                });
            }
        } else if (userRole === 'agent') {
            // Agent can only update assigned sub-orders
            if (!subOrder.assignedAgent || subOrder.assignedAgent.toString() !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            // Agent can only set specific statuses
            if (!subOrder.canAgentUpdateStatus(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Agents can only update status to: out-for-delivery, delivered'
                });
            }
        } else if (userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        // Admin can set any status

        // Update status
        const oldStatus = subOrder.status;
        subOrder.status = status;

        // Set delivery date when delivered
        if (status === 'delivered' && !subOrder.deliveryDate) {
            subOrder.deliveryDate = new Date();
        }

        await subOrder.save();

        console.log(`✅ Sub-order ${subOrder.subOrderId} status updated: ${oldStatus} → ${status}`);

        // Parent order status will be updated automatically via post-save hook

        return res.status(200).json({
            success: true,
            message: 'Status updated successfully',
            subOrder
        });

    } catch (error) {
        console.error('❌ Error updating sub-order status:', error);
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
            deliveryOption: 'delivery-agent',
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
        const { subOrderId, agentId } = req.body;

        if (!subOrderId || !agentId) {
            return res.status(400).json({
                success: false,
                message: 'Sub-order ID and agent ID are required'
            });
        }

        const subOrder = await SubOrder.findById(subOrderId);

        if (!subOrder) {
            return res.status(404).json({
                success: false,
                message: 'Sub-order not found'
            });
        }

        if (subOrder.deliveryOption !== 'delivery-agent') {
            return res.status(400).json({
                success: false,
                message: 'This sub-order does not require delivery agent'
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
        subOrder.status = 'confirmed';
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
