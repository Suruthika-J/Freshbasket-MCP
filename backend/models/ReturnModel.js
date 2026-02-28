// backend/models/ReturnModel.js
import mongoose from 'mongoose';

const returnItemSchema = new mongoose.Schema({
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    reason: { type: String, required: true },
    isPerishable: { type: Boolean, default: false }
}, { _id: false });

const returnSchema = new mongoose.Schema({
    returnId: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    parentOrder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ParentOrder',
        required: true
    },
    subOrder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubOrder',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        default: null // null for admin products
    },
    items: [returnItemSchema],
    images: [{
        type: String // Cloudinary or local paths
    }],
    overallReason: {
        type: String,
        enum: ['Wrong item', 'Damaged', 'Expired', 'Quality issue', 'Other'],
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['requested', 'approved', 'rejected', 'picked-up', 'received', 'refunded'],
        default: 'requested'
    },
    adminRemarks: {
        type: String,
        default: ''
    },
    pickupDetails: {
        method: { type: String, enum: ['self-drop', 'agent-pickup'], default: 'agent-pickup' },
        scheduledAt: { type: Date },
        assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryAgent' },
        pickedUpAt: { type: Date }
    },
    refundDetails: {
        amount: { type: Number, default: 0 },
        method: { type: String, enum: ['wallet', 'original'], default: 'original' },
        processedAt: { type: Date },
        transactionId: { type: String }
    },
    reusable: {
        type: Boolean,
        default: false // Whether items go back to stock
    }
}, {
    timestamps: true
});

// Static method to generate unique return ID
returnSchema.statics.generateReturnId = async function () {
    const date = new Date();
    const prefix = `RET-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const count = await this.countDocuments({
        returnId: new RegExp(`^${prefix}`)
    });
    return `${prefix}-${(count + 1).toString().padStart(4, '0')}`;
};

const Return = mongoose.models.Return || mongoose.model('Return', returnSchema);
export default Return;
