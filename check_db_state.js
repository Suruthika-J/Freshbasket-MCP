
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userModel from './backend/models/userModel.js';
import Conversation from './backend/models/Conversation.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/freshbasket';

async function check() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const farmers = await userModel.find({ role: 'farmer', isApproved: true });
        console.log('Found Approved Farmers:', farmers.length);
        farmers.forEach(f => console.log(`- ${f.name} (${f._id}) - isApproved: ${f.isApproved}, role: ${f.role}, isActive: ${f.isActive}`));

        const allFarmers = await userModel.find({ role: 'farmer' });
        console.log('All Farmers:', allFarmers.length);
        allFarmers.forEach(f => console.log(`- ${f.name} (${f._id}) - isApproved: ${f.isApproved}, role: ${f.role}`));

        const conversations = await Conversation.find();
        console.log('Total Conversations:', conversations.length);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
