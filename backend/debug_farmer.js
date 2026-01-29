import mongoose from 'mongoose';
import User from './models/userModel.js';
import dotenv from 'dotenv';

dotenv.config();

const { MONGO_USER, MONGO_PASS, MONGO_CLUSTER, MONGO_DB } = process.env;

const uri = `mongodb+srv://${MONGO_USER}:${MONGO_PASS}@${MONGO_CLUSTER}/${MONGO_DB}?retryWrites=true&w=majority`;

async function debugFarmer() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    // Get command line argument for farmer email
    const farmerEmail = process.argv[2];

    if (!farmerEmail) {
      console.log('❌ Please provide a farmer email as argument');
      console.log('Usage: node debug_farmer.js farmer@example.com');
      process.exit(1);
    }

    console.log(`\n🔍 Checking farmer: ${farmerEmail}`);

    // Find the farmer
    const farmer = await User.findOne({
      email: farmerEmail.toLowerCase(),
      role: 'farmer'
    });

    if (!farmer) {
      console.log('❌ Farmer not found');
      process.exit(1);
    }

    console.log('\n📊 Farmer Details:');
    console.log('==================');
    console.log(`Name: ${farmer.name}`);
    console.log(`Email: ${farmer.email}`);
    console.log(`Role: ${farmer.role}`);
    console.log(`isVerified: ${farmer.isVerified} (type: ${typeof farmer.isVerified})`);
    console.log(`isApproved: ${farmer.isApproved} (type: ${typeof farmer.isApproved})`);
    console.log(`isActive: ${farmer.isActive} (type: ${typeof farmer.isActive})`);
    console.log(`Created: ${farmer.createdAt}`);
    console.log(`Last Login: ${farmer.lastLogin || 'Never'}`);

    console.log('\n🔍 Approval Logic Checks:');
    console.log('========================');

    // Backend login check simulation
    const backendCheck = farmer.role === 'farmer' && !farmer.isApproved;
    console.log(`Backend login check (!farmer.isApproved): ${backendCheck}`);

    // Frontend login check simulation
    const frontendCheck = farmer.role === 'farmer' && farmer.isApproved !== true;
    console.log(`Frontend login check (isApproved !== true): ${frontendCheck}`);

    // Type checks
    console.log(`\n🔧 Type Analysis:`);
    console.log(`isApproved === true: ${farmer.isApproved === true}`);
    console.log(`isApproved === 'true': ${farmer.isApproved === 'true'}`);
    console.log(`Boolean(isApproved): ${Boolean(farmer.isApproved)}`);
    console.log(`!!isApproved: ${!!farmer.isApproved}`);

    console.log('\n📋 Recommendations:');
    console.log('==================');

    if (farmer.isApproved !== true) {
      console.log('⚠️  Farmer is NOT approved. Admin needs to approve this farmer.');
      console.log('💡 Run admin approval API: PUT /api/user/admin/farmers/:farmerId/approve');
      console.log('   Body: { "action": "approve" }');
    } else {
      console.log('✅ Farmer IS approved. Login should work.');
      console.log('🔍 If login still fails, check:');
      console.log('   1. Email verification status');
      console.log('   2. Account active status');
      console.log('   3. Password correctness');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugFarmer();
