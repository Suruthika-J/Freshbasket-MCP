// ============================================
// FILE 7: backend/scripts/migrateOrders.js - MIGRATION SCRIPT
// Run this ONCE after deploying the updated order model
// ============================================

import mongoose from 'mongoose';
import Order from '../models/orderModel.js';
import dotenv from 'dotenv';

dotenv.config();

const migrateExistingOrders = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rushbasket');
        console.log('✅ Connected to MongoDB');

        // Find all orders without the new fields
        const ordersToMigrate = await Order.find({
            $or: [
                { orderOwnerType: { $exists: false } },
                { deliveryType: { $exists: false } },
                { deliveryRequestStatus: { $exists: false } }
            ]
        });

        console.log(`📦 Found ${ordersToMigrate.length} orders to migrate`);

        // Update each order
        let migratedCount = 0;
        for (const order of ordersToMigrate) {
            // Set default values for new fields
            if (!order.orderOwnerType) {
                order.orderOwnerType = 'ADMIN';
            }
            if (!order.deliveryType) {
                order.deliveryType = 'NONE';
            }
            if (!order.deliveryRequestStatus) {
                order.deliveryRequestStatus = 'NONE';
            }

            await order.save();
            migratedCount++;

            if (migratedCount % 100 === 0) {
                console.log(`   Migrated ${migratedCount}/${ordersToMigrate.length} orders...`);
            }
        }

        console.log(`✅ Migration complete! Migrated ${migratedCount} orders`);

        // Verify migration
        const verifyCount = await Order.countDocuments({
            orderOwnerType: { $exists: true },
            deliveryType: { $exists: true },
            deliveryRequestStatus: { $exists: true }
        });

        console.log(`✅ Verification: ${verifyCount} orders have new fields`);

        // Create indexes
        console.log('📊 Creating indexes...');
        await Order.collection.createIndex({ orderOwnerType: 1, farmerId: 1 });
        await Order.collection.createIndex({ deliveryRequestStatus: 1, orderOwnerType: 1 });
        console.log('✅ Indexes created');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration error:', error);
        process.exit(1);
    }
};

// Run migration
migrateExistingOrders();