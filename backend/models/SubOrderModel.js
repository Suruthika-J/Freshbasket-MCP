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
        enum: ['SELF_PICKUP', 'DELIVERY_AGENT', 'self_pickup', 'delivery_agent', 'self-pickup', 'delivery-agent'],
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
            'cancelled',     // Cancelled
            'returning',     // Return in progress
            'refunded'       // Fully refunded
        ],
        default: 'pending',
        index: true
    },
    // NEW: Product Ownership
    productOwner: {
        type: String,
        enum: ['admin', 'farmer'],
        required: true
    },
    // NEW: Delivery Preferences (As per requirement)
    deliveryType: {
        type: String,
        enum: ['selfPickup', 'deliveryAgent', 'self_pickup', 'delivery_agent', 'SELF_PICKUP', 'DELIVERY_AGENT'],
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
    // Set productOwner
    if (this.vendor && this.vendor.vendorType) {
        this.productOwner = this.vendor.vendorType;
    }

    // Admin products default to platform delivery (normal flow)
    if (this.vendor.vendorType === 'admin') {
        this.deliveryOption = 'DELIVERY_AGENT'; // Maintain for compatibility
        this.deliveryType = 'deliveryAgent';
        this.deliveryRequired = true; // Admin products always need delivery in this app
        this.assignedAgent = null;
        this.deliveryStatus = 'PENDING_ASSIGNMENT';
    }
    // Farmer products use the selected choice
    else if (this.vendor.vendorType === 'farmer') {
        const dOption = String(this.deliveryOption || '').toUpperCase().replace('-', '_');
        const dType = String(this.deliveryType || '').toLowerCase().replace('-', '_');

        if (dOption === 'SELF_PICKUP' || dType === 'self_pickup' || dType === 'selfpickup' || this.deliveryOption === 'self-pickup') {
            this.deliveryOption = 'SELF_PICKUP';
            this.deliveryType = 'selfPickup';
        } else if (dOption === 'DELIVERY_AGENT' || dType === 'delivery_agent' || dType === 'deliveryagent' || this.deliveryOption === 'delivery-agent') {
            this.deliveryOption = 'DELIVERY_AGENT';
            this.deliveryType = 'deliveryAgent';
        }

        // Ensure we don't have undefined for required fields if we matched
        if (!this.deliveryType && this.deliveryOption === 'DELIVERY_AGENT') this.deliveryType = 'deliveryAgent';
        if (!this.deliveryType && this.deliveryOption === 'SELF_PICKUP') this.deliveryType = 'selfPickup';

        // Set deliveryRequired flag
        this.deliveryRequired = this.deliveryType === 'deliveryAgent';

        // Initialize deliveryStatus
        if (this.deliveryRequired) {
            if (!this.assignedAgent && (!this.deliveryStatus || this.deliveryStatus === 'NOT_REQUIRED')) {
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
        const session = doc.$session() || null;
        const ParentOrder = mongoose.model('ParentOrder');
        const parentOrder = await ParentOrder.findById(doc.parentOrder).session(session);
        if (parentOrder) {
            // ✅ CRITICAL: Pass the session to avoid write conflicts
            await parentOrder.updateOverallStatus(session);
        }
    } catch (error) {
        console.error('Error updating parent order status:', error);
    }
});

// Static method to generate unique sub-order ID
subOrderSchema.statics.generateSubOrderId = async function (parentOrderId, session = null) {
    const parentIdPart = parentOrderId.replace('PO-', 'SO-');
    const count = await this.countDocuments({
        subOrderId: new RegExp(`^${parentIdPart}-`)
    }).session(session);
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
