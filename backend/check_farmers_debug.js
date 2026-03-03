import mongoose from 'mongoose';
import 'dotenv/config';
import User from './models/userModel.js';

const MONGO_URI = process.env.MONGODB_URI || `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_CLUSTER}/${process.env.MONGO_DB}?retryWrites=true&w=majority`;

async function checkFarmers() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const allFarmers = await User.find({ role: 'farmer' });
        console.log(`Total Farmers: ${allFarmers.length}`);

        allFarmers.forEach(f => {
            console.log(`- ${f.name} (${f.email}): isApproved=${f.isApproved}, isActive=${f.isActive}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkFarmers();
