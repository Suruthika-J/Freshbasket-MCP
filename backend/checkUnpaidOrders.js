// ============================================
// FILE: checkUnpaidOrders.js
// Run this in your backend folder to check database directly
// Usage: node checkUnpaidOrders.js
// ============================================

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './models/orderModel.js';

dotenv.config();

const checkUnpaidOrders = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get all orders
        const allOrders = await Order.find({}).lean();
        console.log(`📦 Total orders in database: ${allOrders.length}\n`);

        // Analyze payment statuses
        const paymentStatusBreakdown = {};
        const statusBreakdown = {};
        let unpaidOrders = [];

        allOrders.forEach(order => {
            // Count payment statuses
            const paymentStatus = order.paymentStatus || 'NULL';
            paymentStatusBreakdown[paymentStatus] = (paymentStatusBreakdown[paymentStatus] || 0) + 1;

            // Count order statuses
            const status = order.status || 'NULL';
            statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;

            // Track unpaid orders
            if (order.paymentStatus === 'Unpaid') {
                unpaidOrders.push({
                    orderId: order.orderId,
                    status: order.status,
                    paymentStatus: order.paymentStatus,
                    paymentMethod: order.paymentMethod,
                    total: order.total,
                    createdAt: order.createdAt
                });
            }
        });

        console.log('═══════════════════════════════════════════════');
        console.log('📊 PAYMENT STATUS BREAKDOWN:');
        console.log('═══════════════════════════════════════════════');
        Object.entries(paymentStatusBreakdown).forEach(([status, count]) => {
            console.log(`   ${status}: ${count}`);
        });

        console.log('\n═══════════════════════════════════════════════');
        console.log('📋 ORDER STATUS BREAKDOWN:');
        console.log('═══════════════════════════════════════════════');
        Object.entries(statusBreakdown).forEach(([status, count]) => {
            console.log(`   ${status}: ${count}`);
        });

        console.log('\n═══════════════════════════════════════════════');
        console.log(`💳 UNPAID ORDERS DETAILS (${unpaidOrders.length} found):`);
        console.log('═══════════════════════════════════════════════');
        
        if (unpaidOrders.length > 0) {
            unpaidOrders.forEach((order, index) => {
                console.log(`\n${index + 1}. ${order.orderId}`);
                console.log(`   Status: ${order.status}`);
                console.log(`   Payment Method: ${order.paymentMethod}`);
                console.log(`   Total: ₹${order.total || 0}`);
                console.log(`   Created: ${new Date(order.createdAt).toLocaleDateString()}`);
            });
        } else {
            console.log('\n⚠️  No unpaid orders found!');
        }

        console.log('\n═══════════════════════════════════════════════');
        console.log('🔍 CHECKING FOR ISSUES:');
        console.log('═══════════════════════════════════════════════');

        // Check for orders with null/undefined payment status
        const ordersWithNoPaymentStatus = allOrders.filter(o => !o.paymentStatus);
        if (ordersWithNoPaymentStatus.length > 0) {
            console.log(`⚠️  Found ${ordersWithNoPaymentStatus.length} orders with NO payment status!`);
            ordersWithNoPaymentStatus.slice(0, 5).forEach(order => {
                console.log(`   - ${order.orderId}: paymentStatus = ${order.paymentStatus}`);
            });
        } else {
            console.log('✅ All orders have payment status defined');
        }

        // Check for unusual payment statuses
        const validStatuses = ['Paid', 'Unpaid'];
        const unusualStatuses = Object.keys(paymentStatusBreakdown).filter(s => !validStatuses.includes(s));
        if (unusualStatuses.length > 0) {
            console.log(`\n⚠️  Found unusual payment statuses: ${unusualStatuses.join(', ')}`);
        } else {
            console.log('✅ All payment statuses are valid (Paid/Unpaid)');
        }

        // Check COD orders that might be unpaid
        const codOrders = allOrders.filter(o => 
            o.paymentMethod === 'Cash on Delivery' || o.paymentMethod === 'COD'
        );
        const codUnpaid = codOrders.filter(o => o.paymentStatus === 'Unpaid');
        const codPaid = codOrders.filter(o => o.paymentStatus === 'Paid');
        
        console.log(`\n📦 COD Orders Analysis:`);
        console.log(`   Total COD orders: ${codOrders.length}`);
        console.log(`   COD Unpaid: ${codUnpaid.length}`);
        console.log(`   COD Paid: ${codPaid.length}`);

        console.log('\n═══════════════════════════════════════════════\n');

        await mongoose.connection.close();
        console.log('✅ Database connection closed');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

checkUnpaidOrders();