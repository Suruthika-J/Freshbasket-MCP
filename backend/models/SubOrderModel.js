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
        enum: ['SELF_PICKUP', 'DELIVERY_AGENT'],
        required: function () { return this.vendor.vendorType === 'farmer'; }
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
            'out-for-delivery', // Agent picked up (legacy, using deliveryStatus instead)
            'delivered',     // Completed
            'cancelled'      // Cancelled
        ],
        default: 'pending',
        index: true
    },
    // NEW: Delivery Preferences (As per requirement)
    deliveryType: {
        type: String,
        enum: ['self_pickup', 'delivery_agent'],
        required: function () { return this.vendor.vendorType === 'farmer'; }
    },
    deliveryRequired: {
        type: Boolean,
        default: false
    },
    // NEW: Delivery Status (As per requirement)
    deliveryStatus: {
        type: String,
        enum: ['NOT_REQUIRED', 'PENDING_ASSIGNMENT', 'ASSIGNED', 'PICKED_UP', 'DELIVERED'],
        default: 'NOT_REQUIRED'
    },
    // Delivery agent assignment (only for delivery-agent option)
    assignedAgent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryAgent', // Note: Check if the model name is 'deliveryAgent' or 'DeliveryAgent'
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
    // Admin products default to platform delivery (normal flow)
    if (this.vendor.vendorType === 'admin') {
        this.deliveryOption = 'DELIVERY_AGENT'; // Maintain for compatibility
        this.deliveryType = 'delivery_agent';
        this.deliveryRequired = true; // Admin products always need delivery in this app
        this.assignedAgent = null;
        this.deliveryStatus = 'PENDING_ASSIGNMENT';
    }
    // Farmer products use the selected choice
    else if (this.vendor.vendorType === 'farmer') {
        // Map deliveryOption to deliveryType if only one is provided
        if (this.deliveryOption === 'SELF_PICKUP') this.deliveryType = 'self_pickup';
        if (this.deliveryOption === 'DELIVERY_AGENT') this.deliveryType = 'delivery_agent';
        if (this.deliveryType === 'self_pickup') this.deliveryOption = 'SELF_PICKUP';
        if (this.deliveryType === 'delivery_agent') this.deliveryOption = 'DELIVERY_AGENT';

        // Set deliveryRequired flag
        this.deliveryRequired = this.deliveryType === 'delivery_agent';

        // Initialize deliveryStatus
        if (this.deliveryRequired) {
            if (!this.assignedAgent) {
                this.deliveryStatus = 'PENDING_ASSIGNMENT';
            }
        } else {
            this.deliveryStatus = 'NOT_REQUIRED';
            this.assignedAgent = null;
        }
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
    return this.deliveryOption === 'DELIVERY_AGENT' && !this.assignedAgent;
};

// Method to check if vendor can update status
subOrderSchema.methods.canVendorUpdateStatus = function (newStatus) {
    const allowedStatuses = ['preparing', 'ready'];
    return allowedStatuses.includes(newStatus);
};

// Method to check if agent can update status
subOrderSchema.methods.canAgentUpdateStatus = function (newStatus) {
    const allowedStatuses = ['PICKED_UP', 'DELIVERED'];
    return allowedStatuses.includes(newStatus);
};

export default mongoose.model('SubOrder', subOrderSchema);
