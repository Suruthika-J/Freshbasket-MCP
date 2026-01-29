// backend/scripts/fixFarmerApprovals.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/userModel.js';

dotenv.config();

const fixFarmerApprovals = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find all farmers
        const farmers = await User.find({ role: 'farmer' });
        
        console.log(`\nFound ${farmers.length} farmers:`);
        console.log('==========================================');
        
        for (const farmer of farmers) {
            console.log(`\nFarmer: ${farmer.email}`);
            console.log(`  - isApproved: ${farmer.isApproved} (type: ${typeof farmer.isApproved})`);
            console.log(`  - isVerified: ${farmer.isVerified}`);
            console.log(`  - isActive: ${farmer.isActive}`);
            
            // Fix any farmers with undefined or null isApproved
            if (farmer.isApproved === undefined || farmer.isApproved === null) {
                console.log(`  ⚠️  Fixing undefined/null isApproved...`);
                farmer.isApproved = false;
                await farmer.save();
                console.log(`  ✅ Fixed to false`);
            }
        }
        
        console.log('\n==========================================');
        console.log('✅ All farmers checked and fixed if needed');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

fixFarmerApprovals();