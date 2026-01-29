import mongoose from 'mongoose';
import User from './models/userModel.js';
import dotenv from 'dotenv';

dotenv.config();

const { MONGO_USER, MONGO_PASS, MONGO_CLUSTER, MONGO_DB } = process.env;

const uri = `mongodb+srv://${MONGO_USER}:${MONGO_PASS}@${MONGO_CLUSTER}/${MONGO_DB}?retryWrites=true&w=majority`;

async function createTestFarmer() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    // Create a test farmer
    const testFarmer = {
      name: 'Test Farmer',
      email: 'farmer@test.com',
      password: 'TestPassword123',
      role: 'farmer',
      district: 'Test District',
      isVerified: true,
      isApproved: true, // Approved farmer
      isActive: true
    };

    console.log('🔍 Checking if test farmer already exists...');
    const existingFarmer = await User.findOne({ email: testFarmer.email });

    if (existingFarmer) {
      console.log('📝 Test farmer already exists, updating...');
      await User.findByIdAndUpdate(existingFarmer._id, testFarmer);
      console.log('✅ Test farmer updated');
    } else {
      console.log('➕ Creating test farmer...');
      await User.create(testFarmer);
      console.log('✅ Test farmer created');
    }

    console.log('\n📊 Test Farmer Details:');
    console.log('======================');
    console.log(`Name: ${testFarmer.name}`);
    console.log(`Email: ${testFarmer.email}`);
    console.log(`Password: ${testFarmer.password}`);
    console.log(`Role: ${testFarmer.role}`);
    console.log(`isApproved: ${testFarmer.isApproved}`);
    console.log(`isVerified: ${testFarmer.isVerified}`);

    console.log('\n✅ Test farmer ready for login testing');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createTestFarmer();
