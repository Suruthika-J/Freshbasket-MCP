// backend/controllers/deliveryAgentController.js
import DeliveryAgent from '../models/deliveryAgentModel.js';
import User from '../models/userModel.js';
import Order from '../models/orderModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';

// ============================================
// CREATE DELIVERY AGENT (Admin Only)
// ============================================
export const createDeliveryAgent = async (req, res) => {
    try {
        const { name, email, password, phone, createdBy } = req.body;

        console.log('📝 Creating delivery agent:', { name, email, phone });

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required'
            });
        }

        // Check if email already exists in User or DeliveryAgent collections
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        const existingAgent = await DeliveryAgent.findOne({ email: email.toLowerCase() });

        if (existingUser || existingAgent) {
            return res.status(409).json({
                success: false,
                message: 'Email is already registered'
            });
        }

        // Validate phone number if provided
        if (phone && !/^\d{10}$/.test(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Phone number must be exactly 10 digits'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create delivery agent
        const agent = await DeliveryAgent.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            phone: phone || '',
            createdBy: createdBy || '000000000000000000000000' // Default admin ID
        });

        console.log('✅ Agent created successfully:', agent._id);

        // Return agent data (exclude password)
        const agentData = {
            id: agent._id,
            name: agent.name,
            email: agent.email,
            phone: agent.phone,
            role: agent.role,
            isActive: agent.isActive,
            createdAt: agent.createdAt
        };

        res.status(201).json({
            success: true,
            message: 'Delivery agent created successfully',
            agent: agentData
        });

    } catch (error) {
        console.error('❌ Create delivery agent error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// ============================================
// GET ALL DELIVERY AGENTS (Admin Only)
// ============================================
export const getAllAgents = async (req, res) => {
    try {
        console.log('📋 Fetching all agents...');
        
        const agents = await DeliveryAgent.find()
            .select('-password')
            .sort({ createdAt: -1 })
            .lean();

        console.log(`✅ Found ${agents.length} agents`);

        // Get order counts for each agent
        const agentsWithOrderCounts = await Promise.all(
            agents.map(async (agent) => {
                const assignedOrdersCount = await Order.countDocuments({
                    assignedTo: agent._id
                });
                const completedOrdersCount = await Order.countDocuments({
                    assignedTo: agent._id,
                    status: 'Delivered'
                });

                return {
                    ...agent,
                    assignedOrders: assignedOrdersCount,
                    completedOrders: completedOrdersCount
                };
            })
        );

        res.status(200).json({
            success: true,
            count: agents.length,
            agents: agentsWithOrderCounts
        });

    } catch (error) {
        console.error('❌ Get all agents error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// ============================================
// GET SINGLE DELIVERY AGENT BY ID
// ============================================
export const getAgentById = async (req, res) => {
    try {
        const { id } = req.params;

        const agent = await DeliveryAgent.findById(id)
            .select('-password')
            .lean();

        if (!agent) {
            return res.status(404).json({
                success: false,
                message: 'Delivery agent not found'
            });
        }

        // Get assigned orders
        const assignedOrders = await Order.find({ assignedTo: id })
            .select('orderId status customer total createdAt')
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            agent: {
                ...agent,
                assignedOrders
            }
        });

    } catch (error) {
        console.error('Get agent by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// ============================================
// UPDATE DELIVERY AGENT STATUS (Active/Inactive)
// ============================================
export const updateAgentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        if (typeof isActive !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'isActive must be a boolean value'
            });
        }

        const agent = await DeliveryAgent.findByIdAndUpdate(
            id,
            { isActive },
            { new: true }
        ).select('-password');

        if (!agent) {
            return res.status(404).json({
                success: false,
                message: 'Delivery agent not found'
            });
        }

        res.status(200).json({
            success: true,
            message: `Agent ${isActive ? 'activated' : 'deactivated'} successfully`,
            agent
        });

    } catch (error) {
        console.error('Update agent status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// ============================================
// DELETE DELIVERY AGENT
// ============================================
export const deleteAgent = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if agent has assigned orders
        const assignedOrdersCount = await Order.countDocuments({
            assignedTo: id,
            status: { $nin: ['Delivered', 'Cancelled'] }
        });

        if (assignedOrdersCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete agent with ${assignedOrdersCount} active orders. Please reassign or complete orders first.`
            });
        }

        const agent = await DeliveryAgent.findByIdAndDelete(id);

        if (!agent) {
            return res.status(404).json({
                success: false,
                message: 'Delivery agent not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Delivery agent deleted successfully'
        });

    } catch (error) {
        console.error('Delete agent error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// ============================================
// AGENT LOGIN (Returns JWT with role: 'agent')
// ============================================
export const agentLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find agent by email
        const agent = await DeliveryAgent.findOne({ 
            email: email.toLowerCase() 
        });

        if (!agent) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if agent is active
        if (!agent.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated. Please contact admin.'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, agent.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Update last login
        agent.lastLogin = new Date();
        await agent.save();

        // Generate JWT token with role
        const token = jwt.sign(
            { 
                id: agent._id,
                role: 'agent'
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: agent._id,
                name: agent.name,
                email: agent.email,
                phone: agent.phone,
                role: 'agent',
                isActive: agent.isActive,
                lastLogin: agent.lastLogin
            }
        });

    } catch (error) {
        console.error('Agent login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// ============================================
// GET AGENT'S ASSIGNED ORDERS
// ============================================
export const getAgentOrders = async (req, res) => {
    try {
        const agentId = req.user._id; // From auth middleware

        const orders = await Order.find({ assignedTo: agentId })
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });

    } catch (error) {
        console.error('Get agent orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// ============================================
// UPDATE ORDER DELIVERY STATUS (Agent Action)
// ============================================
export const updateDeliveryStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        const agentId = req.user._id;

        // Validate status
        const validStatuses = ['Processing', 'Shipped', 'Delivered'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Allowed: Processing, Shipped, Delivered'
            });
        }

        // Find order and verify it's assigned to this agent
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

        // Update order status
        order.status = status;

        // If delivered and COD, mark as paid
        if (status === 'Delivered' && order.paymentMethod === 'Cash on Delivery') {
            order.paymentStatus = 'Paid';
        }

        await order.save();

        // Update agent's completed orders count if delivered
        if (status === 'Delivered') {
            await DeliveryAgent.findByIdAndUpdate(
                agentId,
                { $inc: { completedOrders: 1 } }
            );
        }

        res.status(200).json({
            success: true,
            message: `Order status updated to ${status}`,
            order
        });

    } catch (error) {
        console.error('Update delivery status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};



