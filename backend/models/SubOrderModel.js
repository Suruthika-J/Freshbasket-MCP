// backend/models/SubOrderModel.js
// Sub Order Model - Represents vendor-specific portion of parent order

import mongoose from 'mongoose';

// Item sub-schema
const subOrderItemSchema = new mongoose.Schema({
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    imageUrl: { type: String }
}, { _id: false });

// Location sub-schema
const locationSchema = new mongoose.Schema({
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String },
    updatedAt: { type: Date, default: Date.now }
}, { _id: false });

const subOrderSchema = new mongoose.Schema({
    subOrderId: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    parentOrder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ParentOrder',
        required: true,
        index: true
    },
    // Vendor information
    vendor: {
        vendorId: {
            type: String,
            required: true,
            index: true
        },
        vendorType: {
            type: String,
            enum: ['admin', 'farmer'],
            required: true
        },
        vendorName: {
            type: String,
            required: true
        }
    },
    // Added as per requirement
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        index: true
    },
    items: {
        type: [subOrderItemSchema],
        required: true,
        validate: {
            validator: function (items) {
                return items && items.length > 0;
            },
            message: 'Sub-order must have at least one item'
        }
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    paymentStatus: {
        type: String,
        enum: ['Unpaid', 'Paid', 'Failed', 'Refunded'],
        default: 'Unpaid'
    },
    // Delivery configuration
    deliveryOption: {
        type: String,
        enum: ['self-pickup', 'delivery-agent'],
        required: true
    },
    deliveryCharge: {
        type: Number,
        default: 0,
        min: 0
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    // Order status
    status: {
        type: String,
        enum: [
            'pending',       // Initial state
            'confirmed',     // Payment confirmed or agent assigned
            'preparing',     // Vendor is preparing order
            'ready',         // Ready for pickup/delivery
            'out-for-delivery', // Agent picked up (only for delivery-agent)
            'delivered',     // Completed
            'cancelled'      // Cancelled
        ],
        default: 'pending',
        index: true
    },
    // Delivery agent assignment (only for delivery-agent option)
    assignedAgent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryAgent',
        default: null,
        index: true
    },
    assignedAt: {
        type: Date,
        default: null
    },
    // Location tracking
    storeLocation: {
        type: locationSchema,
        default: null
    },
    deliveryLocation: {
        type: locationSchema,
        default: null
    },
    agentLocation: {
        type: locationSchema,
        default: null
    },
    trackingEnabled: {
        type: Boolean,
        default: false
    },
    // Timestamps
    date: {
        type: Date,
        default: Date.now,
        index: true
    },
    deliveryDate: {
        type: Date,
        default: null,
        index: true
    },
    notes: {
        type: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Validate delivery option based on vendor type
subOrderSchema.pre('validate', function (next) {
    // Admin products MUST use delivery-agent
    if (this.vendor.vendorType === 'admin' && this.deliveryOption !== 'delivery-agent') {
        return next(new Error('Admin products must use delivery-agent option'));
    }
    next();
});

// Calculate total before saving
subOrderSchema.pre('save', function (next) {
    this.total = this.subtotal + this.deliveryCharge;
    next();
});

// Update parent order status after sub-order status change
subOrderSchema.post('save', async function (doc) {
    try {
        const ParentOrder = mongoose.model('ParentOrder');
        const parentOrder = await ParentOrder.findById(doc.parentOrder);
        if (parentOrder) {
            await parentOrder.updateOverallStatus();
        }
    } catch (error) {
        console.error('Error updating parent order status:', error);
    }
});

// Static method to generate unique sub-order ID
subOrderSchema.statics.generateSubOrderId = async function (parentOrderId) {
    const parentIdPart = parentOrderId.replace('PO-', 'SO-');
    const count = await this.countDocuments({
        subOrderId: new RegExp(`^${parentIdPart}-`)
    });
    const letter = String.fromCharCode(65 + count); // A, B, C, etc.
    return `${parentIdPart}-${letter}`;
};

// Method to check if agent assignment is required
subOrderSchema.methods.requiresAgentAssignment = function () {
    return this.deliveryOption === 'delivery-agent' && !this.assignedAgent;
};

// Method to check if vendor can update status
subOrderSchema.methods.canVendorUpdateStatus = function (newStatus) {
    const allowedStatuses = ['preparing', 'ready'];
    return allowedStatuses.includes(newStatus);
};

// Method to check if agent can update status
subOrderSchema.methods.canAgentUpdateStatus = function (newStatus) {
    const allowedStatuses = ['out-for-delivery', 'delivered'];
    return allowedStatuses.includes(newStatus);
};

export default mongoose.model('SubOrder', subOrderSchema);
