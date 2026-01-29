import mongoose from 'mongoose';
import Order from './models/orderModel.js';
import DeliveryAgent from './models/deliveryAgentModel.js';

async function checkAssignments() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rushbasket');

    console.log('🔍 Checking order assignments...');

    const orders = await Order.find({ assignedTo: { $ne: null } }).populate('assignedTo').limit(5);
    console.log('Found', orders.length, 'orders with assignments');

    orders.forEach(order => {
      console.log('Order:', order.orderId, 'Assigned to:', order.assignedTo?.name || 'NULL');
    });

    const agents = await DeliveryAgent.find({}).limit(5);
    console.log('Found', agents.length, 'agents');

    agents.forEach(agent => {
      console.log('Agent:', agent.name, 'ID:', agent._id);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}
checkAssignments();
