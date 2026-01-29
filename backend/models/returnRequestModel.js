// ============================================
// FILE: backend/models/returnRequestModel.js
// Path: backend/models/returnRequestModel.js
// ============================================

import mongoose from 'mongoose';

const returnRequestSchema = new mongoose.Schema({
    // Reference to the original order
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    
    // User who requested the return
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    
    // Return request details
    reason: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 500
    },
    
    // Status workflow: Pending -> Approved/Rejected -> Collected -> Returned
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Collected', 'Returned'],
        default: 'Pending',
        index: true
    },
    
    // Admin response
    adminResponse: {
        type: String,
        default: null
    },
    
    // Admin who handled the request
    handledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    
    // Assigned delivery agent for collection
    assignedAgent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryAgent',
        default: null
    },
    
    // Refund details
    refundAmount: {
        type: Number,
        min: 0,
        default: null
    },
    
    refundStatus: {
        type: String,
        enum: ['Pending', 'Processed', 'Completed'],
        default: 'Pending'
    },
    
    refundMethod: {
        type: String,
        enum: ['Original Payment Method', 'Bank Transfer', 'Store Credit'],
        default: 'Original Payment Method'
    },
    
    // Important dates
    requestedAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    
    approvedAt: {
        type: Date,
        default: null
    },
    
    collectedAt: {
        type: Date,
        default: null
    },
    
    completedAt: {
        type: Date,
        default: null
    },
    
    // Collection details
    collectionAddress: {
        type: String,
        default: null
    },
    
    collectionNotes: {
        type: String,
        default: null
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Index for efficient queries
returnRequestSchema.index({ orderId: 1, userId: 1 });
returnRequestSchema.index({ status: 1, createdAt: -1 });

// Virtual for request age
returnRequestSchema.virtual('daysOld').get(function() {
    return Math.floor((Date.now() - this.requestedAt) / (1000 * 60 * 60 * 24));
});

// Prevent multiple return requests for same order
returnRequestSchema.index({ orderId: 1 }, { 
    unique: true,
    partialFilterExpression: { 
        status: { $in: ['Pending', 'Approved', 'Collected'] } 
    }
});

export default mongoose.model('ReturnRequest', returnRequestSchema);