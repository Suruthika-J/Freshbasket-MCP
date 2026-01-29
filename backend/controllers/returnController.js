// ============================================
// FILE: backend/controllers/returnController.js
// Path: backend/controllers/returnController.js
// ============================================
import ReturnRequest from '../models/returnRequestModel.js';
import Order from '../models/orderModel.js';
import { Product } from '../models/productModel.js';
import DeliveryAgent from '../models/deliveryAgentModel.js';
// ============================================
// CREATE RETURN REQUEST (User)
// ============================================
export const createReturnRequest = async (req, res) => {
    try {
        const { orderId, reason } = req.body;
        const userId = req.user._id;

        console.log('📦 Creating return request:', { orderId, userId });

        // Validate input
        if (!orderId || !reason) {
            return res.status(400).json({
                success: false,
                message: 'Order ID and reason are required'
            });
        }

        if (reason.length < 3 || reason.length > 500) {
            return res.status(400).json({
                success: false,
                message: 'Reason must be between 3 and 500 characters'
            });
        }

        // Find the order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Verify order belongs to user
        if (order.user.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only request returns for your own orders'
            });
        }

        // Check if order is delivered
        if (order.status !== 'Delivered') {
            return res.status(400).json({
                success: false,
                message: 'Only delivered orders can be returned'
            });
        }

        // Check if return window is still open (e.g., 7 days)
        const deliveryDate = new Date(order.updatedAt);
        const daysSinceDelivery = Math.floor((Date.now() - deliveryDate) / (1000 * 60 * 60 * 24));
        
        if (daysSinceDelivery > 7) {
            return res.status(400).json({
                success: false,
                message: 'Return window has expired. Returns are only accepted within 7 days of delivery.'
            });
        }

        // Check if return request already exists
        const existingRequest = await ReturnRequest.findOne({
            orderId,
            status: { $in: ['Pending', 'Approved', 'Collected'] }
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: 'A return request for this order is already in progress'
            });
        }

        // Create return request
        const returnRequest = new ReturnRequest({
            orderId,
            userId,
            reason,
            refundAmount: order.total,
            collectionAddress: order.customer.address
        });

        await returnRequest.save();

        // Populate order details for response
        await returnRequest.populate('orderId', 'orderId customer.name total');

        console.log('✅ Return request created:', returnRequest._id);

        res.status(201).json({
            success: true,
            message: 'Return request submitted successfully',
            returnRequest
        });

    } catch (error) {
        console.error('❌ Create return request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create return request',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
        });
    }
};

// ============================================
// GET USER'S RETURN REQUESTS
// ============================================
export const getUserReturnRequests = async (req, res) => {
    try {
        const userId = req.user._id;

        const returnRequests = await ReturnRequest.find({ userId })
            .populate('orderId', 'orderId customer.name total items paymentMethod')
            .populate('assignedAgent', 'name phone email')
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            count: returnRequests.length,
            returnRequests
        });

    } catch (error) {
        console.error('❌ Get user return requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch return requests',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
        });
    }
};

// ============================================
// GET RETURN REQUEST BY ORDER ID (User)
// ============================================
export const getReturnRequestByOrderId = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user._id;

        const returnRequest = await ReturnRequest.findOne({ 
            orderId,
            userId 
        })
            .populate('orderId', 'orderId customer.name total items')
            .populate('assignedAgent', 'name phone email')
            .lean();

        if (!returnRequest) {
            return res.status(404).json({
                success: false,
                message: 'No return request found for this order'
            });
        }

        res.status(200).json({
            success: true,
            returnRequest
        });

    } catch (error) {
        console.error('❌ Get return request by order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch return request',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
        });
    }
};

// ============================================
// GET ALL RETURN REQUESTS (Admin)
// ============================================
export const getAllReturnRequests = async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;

        let filter = {};

        // Filter by status if provided
        if (status && status !== 'All') {
            filter.status = status;
        }

        // Filter by date range if provided
        if (startDate || endDate) {
            filter.requestedAt = {};
            if (startDate) {
                filter.requestedAt.$gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.requestedAt.$lte = end;
            }
        }

        const returnRequests = await ReturnRequest.find(filter)
            .populate('orderId', 'orderId customer.name customer.phone customer.email total items paymentMethod')
            .populate('userId', 'name email')
            .populate('assignedAgent', 'name phone email')
            .populate('handledBy', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        // Calculate statistics
        const stats = {
            total: returnRequests.length,
            pending: returnRequests.filter(r => r.status === 'Pending').length,
            approved: returnRequests.filter(r => r.status === 'Approved').length,
            rejected: returnRequests.filter(r => r.status === 'Rejected').length,
            collected: returnRequests.filter(r => r.status === 'Collected').length,
            returned: returnRequests.filter(r => r.status === 'Returned').length
        };

        res.status(200).json({
            success: true,
            count: returnRequests.length,
            stats,
            returnRequests
        });

    } catch (error) {
        console.error('❌ Get all return requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch return requests',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
        });
    }
};

// ============================================
// UPDATE RETURN REQUEST STATUS (Admin)
// ============================================
export const updateReturnRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminResponse, refundAmount, assignedAgent } = req.body;
        const adminId = req.user._id;

        console.log('🔄 Updating return request:', { id, status });

        const returnRequest = await ReturnRequest.findById(id);
        if (!returnRequest) {
            return res.status(404).json({
                success: false,
                message: 'Return request not found'
            });
        }

        // Validate status transition
        const validTransitions = {
            'Pending': ['Approved', 'Rejected'],
            'Approved': ['Collected'],
            'Collected': ['Returned'],
            'Rejected': [],
            'Returned': []
        };

        if (!validTransitions[returnRequest.status].includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot change status from ${returnRequest.status} to ${status}`
            });
        }

        // Update fields
        returnRequest.status = status;
        returnRequest.handledBy = adminId;
        
        if (adminResponse) {
            returnRequest.adminResponse = adminResponse;
        }

        if (refundAmount !== undefined) {
            returnRequest.refundAmount = refundAmount;
        }

        if (assignedAgent) {
            returnRequest.assignedAgent = assignedAgent;
        }

        // Update timestamps based on status
        switch (status) {
            case 'Approved':
                returnRequest.approvedAt = new Date();
                break;
            case 'Collected':
                returnRequest.collectedAt = new Date();
                break;
            case 'Returned':
                returnRequest.completedAt = new Date();
                returnRequest.refundStatus = 'Processed';
                
                // Restore stock when return is completed
                const order = await Order.findById(returnRequest.orderId);
                if (order) {
                    for (const item of order.items) {
                        const product = await Product.findById(item.id);
                        if (product) {
                            product.stock += item.quantity;
                            await product.save();
                            console.log(`✅ Restored ${item.quantity} units of ${item.name}`);
                        }
                    }
                }
                break;
        }

        await returnRequest.save();

        // Populate for response
        await returnRequest.populate([
            { path: 'orderId', select: 'orderId customer.name total' },
            { path: 'userId', select: 'name email' },
            { path: 'assignedAgent', select: 'name phone email' },
            { path: 'handledBy', select: 'name email' }
        ]);

        console.log('✅ Return request updated:', returnRequest._id);

        res.status(200).json({
            success: true,
            message: `Return request ${status.toLowerCase()} successfully`,
            returnRequest
        });

    } catch (error) {
        console.error('❌ Update return request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update return request',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
        });
    }
};

// ============================================
// DELETE RETURN REQUEST (Admin)
// ============================================
export const deleteReturnRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const returnRequest = await ReturnRequest.findById(id);
        if (!returnRequest) {
            return res.status(404).json({
                success: false,
                message: 'Return request not found'
            });
        }

        // Only allow deletion of rejected requests
        if (!['Rejected', 'Returned'].includes(returnRequest.status)) {
            return res.status(400).json({
                success: false,
                message: 'Can only delete rejected or completed return requests'
            });
        }

        await ReturnRequest.findByIdAndDelete(id);

        console.log('✅ Return request deleted:', id);

        res.status(200).json({
            success: true,
            message: 'Return request deleted successfully'
        });

    } catch (error) {
        console.error('❌ Delete return request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete return request',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
        });
    }
};