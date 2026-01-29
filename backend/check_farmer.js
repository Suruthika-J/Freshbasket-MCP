import mongoose from 'mongoose';
import User from './models/userModel.js';

async function checkFarmer() {
  try {
    await mongoose.connect('mongodb://localhost:27017/rushbasket');
    
    // Check all farmers
    console.log('All farmers in database:');
    const allFarmers = await User.find({ role: 'farmer' });
    console.log('Total farmers:', allFarmers.length);
    allFarmers.forEach(f => {
      console.log(`- ${f.name} (${f.email}) - Verified: ${f.isVerified}, Approved: ${f.isApproved}, Active: ${f.isActive}`);
    });

    // Check pending farmers
    console.log('\nPending farmers (not approved):');
    const pendingFarmers = await User.find({
      role: 'farmer',
      isApproved: false,
      isActive: true
    });
    console.log('Count:', pendingFarmers.length);
    pendingFarmers.forEach(f => {
      console.log(`- ${f.name} (${f.email}) - Verified: ${f.isVerified}, Approved: ${f.isApproved}`);
    });

    // Check approved farmers
    console.log('\nApproved farmers:');
    const approvedFarmers = await User.find({
      role: 'farmer',
      isApproved: true,
      isActive: true
    });
    console.log('Count:', approvedFarmers.length);
    approvedFarmers.forEach(f => {
      console.log(`- ${f.name} (${f.email}) - Verified: ${f.isVerified}, Approved: ${f.isApproved}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkFarmer();
