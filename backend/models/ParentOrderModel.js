// backend/models/ParentOrderModel.js
// Parent Order Model - Represents customer's complete order across all vendors

import mongoose from 'mongoose';

const parentOrderSchema = new mongoose.Schema({
    parentOrderId: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        index: true
    },
    customer: {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true, minlength: 10 },
        address: { type: String, required: true },
        notes: { type: String }
    },
    subOrders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubOrder'
    }],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentMethod: {
        type: String,
        enum: ['Cash on Delivery', 'Online Payment'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['Unpaid', 'Paid', 'Failed', 'Refunded'],
        default: 'Unpaid'
    },
    sessionId: {
        type: String,
        default: null
    },
    paymentIntentId: {
        type: String,
        default: null
    },
    // Aggregated status from all sub-orders
    overallStatus: {
        type: String,
        enum: ['pending', 'processing', 'partially-delivered', 'completed', 'cancelled', 'returning', 'refunded'],
        default: 'pending'
    },
    deliveryType: {
        type: String,
        enum: ['self_pickup', 'delivery_agent', 'mixed', 'self-pickup', 'delivery-agent', 'SELF_PICKUP', 'DELIVERY_AGENT'],
        default: 'delivery_agent'
    },
    deliveryRequired: {
        type: Boolean,
        default: true
    },
    date: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Normalization hook for delivery types
parentOrderSchema.pre('validate', function (next) {
    if (this.deliveryType) {
        const normalized = this.deliveryType.toLowerCase().replace('-', '_');
        if (['self_pickup', 'delivery_agent', 'mixed'].includes(normalized)) {
            this.deliveryType = normalized;
        }
    }
    next();
});

// Virtual to get sub-order count
parentOrderSchema.virtual('subOrderCount').get(function () {
    return this.subOrders ? this.subOrders.length : 0;
});

// Method to update overall status based on sub-orders
parentOrderSchema.methods.updateOverallStatus = async function (session = null) {
    const SubOrder = mongoose.model('SubOrder');
    const subOrders = await SubOrder.find({ parentOrder: this._id }).session(session);

    if (subOrders.length === 0) {
        this.overallStatus = 'pending';
        return;
    }

    const statuses = subOrders.map(so => so.status);

    // All cancelled
    if (statuses.every(s => s === 'cancelled')) {
        this.overallStatus = 'cancelled';
    }
    // All refunded
    else if (statuses.every(s => s === 'refunded')) {
        this.overallStatus = 'refunded';
    }
    // Any returning
    else if (statuses.some(s => s === 'returning')) {
        this.overallStatus = 'returning';
    }
    // All delivered
    else if (statuses.every(s => s === 'delivered')) {
        this.overallStatus = 'completed';
    }
    // Some delivered
    else if (statuses.some(s => s === 'delivered')) {
        this.overallStatus = 'partially-delivered';
    }
    // At least one processing
    else if (statuses.some(s => ['confirmed', 'preparing', 'ready', 'out-for-delivery'].includes(s))) {
        this.overallStatus = 'processing';
    }
    // All pending
    else {
        this.overallStatus = 'pending';
    }

    await this.save({ session });
};

// Static method to generate unique parent order ID
parentOrderSchema.statics.generateParentOrderId = async function (session = null) {
    const year = new Date().getFullYear();
    const count = await this.countDocuments({
        parentOrderId: new RegExp(`^PO-${year}-`)
    }).session(session);
    const nextNumber = (count + 1).toString().padStart(4, '0');
    return `PO-${year}-${nextNumber}`;
};

export default mongoose.model('ParentOrder', parentOrderSchema);
