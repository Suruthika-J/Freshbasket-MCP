import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import userModel from '../models/userModel.js';

/**
 * @desc Get all conversations for Admin
 * @route GET /api/direct-chat/admin/conversations
 */
export const getAdminChatList = async (req, res) => {
    try {
        const adminId = req.user._id;

        // 1. Get all approved farmers
        const farmers = await userModel.find({ role: 'farmer', isApproved: true }, 'name email district').lean();

        // 2. Get existing conversations
        const conversations = await Conversation.find()
            .populate('farmerId', 'name email district')
            .populate('lastMessage')
            .lean();

        // 3. Merge: Ensure every farmer has a conversation entry
        const chatList = await Promise.all(farmers.map(async (farmer) => {
            const conv = conversations.find(c => {
                const convFarmerId = c.farmerId?._id
                    ? c.farmerId._id.toString()
                    : (c.farmerId ? c.farmerId.toString() : null);
                return convFarmerId === farmer._id.toString();
            });

            if (!conv) {
                return {
                    _id: `virtual-${farmer._id}`,
                    farmerId: farmer,
                    adminId,
                    lastMessage: null,
                    unreadCountAdmin: 0,
                    unreadCountFarmer: 0,
                    isVirtual: true,
                    updatedAt: new Date(0)
                };
            }
            return conv;
        }));

        // Sort by updatedAt (real conversations first, then virtuals)
        chatList.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        res.status(200).json({ success: true, conversations: chatList });
    } catch (error) {
        console.error('Error fetching admin chat list:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

/**
 * @desc Get messages for a specific farmer/conversation
 * @route GET /api/direct-chat/messages/:chatId
 */
export const getChatMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const messages = await Message.find({ chatId }).sort({ createdAt: 1 });
        res.status(200).json({ success: true, messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

/**
 * @desc Get or Create conversation for a farmer
 * @route GET /api/direct-chat/farmer/conversation
 */
export const getOrCreateFarmerConversation = async (req, res) => {
    try {
        const farmerId = req.user._id;

        // Find admin user
        const admin = await userModel.findOne({ role: 'admin' });
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        let conversation = await Conversation.findOne({ farmerId, adminId: admin._id })
            .populate('lastMessage')
            .populate('farmerId', 'name email')
            .populate('adminId', 'name email');

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [farmerId, admin._id],
                farmerId,
                adminId: admin._id
            });
            // Re-populate if newly created
            conversation = await Conversation.findById(conversation._id)
                .populate('farmerId', 'name email')
                .populate('adminId', 'name email');
        }

        res.status(200).json({ success: true, conversation });
    } catch (error) {
        console.error('Error getting/creating farmer conversation:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

/**
 * @desc Mark messages as seen
 * @route POST /api/direct-chat/seen/:chatId
 */
export const markChatAsSeen = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user._id;

        await Message.updateMany(
            { chatId, senderId: { $ne: userId }, seen: false },
            { $set: { seen: true } }
        );

        // Reset unread count for the user's role
        const user = await userModel.findById(userId);
        const updateData = {};
        if (user.role === 'admin') {
            updateData.unreadCountAdmin = 0;
        } else if (user.role === 'farmer') {
            updateData.unreadCountFarmer = 0;
        }

        await Conversation.findByIdAndUpdate(chatId, { $set: updateData });

        res.status(200).json({ success: true, message: 'Messages marked as seen' });
    } catch (error) {
        console.error('Error marking messages as seen:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

/**
 * @desc Admin creates a conversation with a specific farmer
 * @route POST /api/direct-chat/admin/create
 */
export const adminCreateConversation = async (req, res) => {
    try {
        const adminId = req.user._id;
        const { farmerId } = req.body;

        if (!farmerId) {
            return res.status(400).json({ success: false, message: 'Farmer ID is required' });
        }

        let conversation = await Conversation.findOne({ farmerId, adminId })
            .populate('lastMessage')
            .populate('farmerId', 'name email shadowName')
            .populate('adminId', 'name email');

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [farmerId, adminId],
                farmerId,
                adminId
            });
            // Re-populate if newly created
            conversation = await Conversation.findById(conversation._id)
                .populate('farmerId', 'name email shadowName')
                .populate('adminId', 'name email');
        }

        res.status(200).json({ success: true, conversation });
    } catch (error) {
        console.error('Error admin creating conversation:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
