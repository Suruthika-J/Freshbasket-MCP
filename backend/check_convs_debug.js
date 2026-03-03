import mongoose from 'mongoose';
import 'dotenv/config';
import Conversation from './models/Conversation.js';
import User from './models/userModel.js';
import Message from './models/Message.js';

const MONGO_URI = process.env.MONGODB_URI || `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_CLUSTER}/${process.env.MONGO_DB}?retryWrites=true&w=majority`;

async function checkConversations() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const conversations = await Conversation.find().populate('farmerId', 'name email');
        console.log(`Total Conversations: ${conversations.length}`);

        conversations.forEach(c => {
            console.log(`- Conv ${c._id}: farmer=${c.farmerId?.name} (${c.farmerId?._id}), adminId=${c.adminId}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkConversations();
