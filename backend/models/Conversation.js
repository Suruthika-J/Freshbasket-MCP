import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    }],
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    unreadCountAdmin: {
        type: Number,
        default: 0
    },
    unreadCountFarmer: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for quick lookup of conversations for a user
conversationSchema.index({ participants: 1 });
conversationSchema.index({ farmerId: 1, adminId: 1 }, { unique: true });

const Conversation = mongoose.models.Conversation || mongoose.model("Conversation", conversationSchema);
export default Conversation;
