// backend/models/deliveryAgentModel.js
import mongoose from 'mongoose';

const deliveryAgentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Agent name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters long']
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters long']
        },
        phone: {
            type: String,
            trim: true,
            default: ''
        },
        role: {
            type: String,
            default: 'agent',
            immutable: true
        },
        isActive: {
            type: Boolean,
            default: true
        },
        isVerified: {
            type: Boolean,
            default: true
        },
        assignedOrders: {
            type: Number,
            default: 0
        },
        completedOrders: {
            type: Number,
            default: 0
        },
        lastLogin: {
            type: Date,
            default: null
        },
        createdBy: {
            type: String,
            default: 'admin'
        }
    },
    {
        timestamps: true
    }
);

// Index for faster queries
//deliveryAgentSchema.index({ email: 1 });
deliveryAgentSchema.index({ isActive: 1 });

const DeliveryAgent = mongoose.model('DeliveryAgent', deliveryAgentSchema);

export default DeliveryAgent;