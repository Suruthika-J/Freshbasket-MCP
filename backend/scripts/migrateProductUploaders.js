// File: migrateProductUploaders.js
// Path: backend/scripts/migrateProductUploaders.js

import mongoose from 'mongoose';
import 'dotenv/config';
import { Product } from '../models/productModel.js';
import User from '../models/userModel.js';

async function migrateProductUploaders() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get all products
    const products = await Product.find();
    console.log(`📦 Found ${products.length} products to migrate`);

    let updated = 0;

    for (const product of products) {
      let uploaderRole, uploaderId, uploaderName;

      if (product.adminUploaded) {
        // Admin uploaded product
        uploaderRole = 'admin';
        uploaderName = 'Admin';
        uploaderId = null;
      } else if (product.farmerId) {
        // Farmer uploaded product
        uploaderRole = 'farmer';
        uploaderId = product.farmerId;
        
        // Get farmer name
        const farmer = await User.findById(product.farmerId);
        uploaderName = farmer ? farmer.name : 'Unknown Farmer';
      } else {
        // Default to admin if no clear indicator
        uploaderRole = 'admin';
        uploaderName = 'Admin';
        uploaderId = null;
      }

      // Update product
      product.uploaderRole = uploaderRole;
      product.uploaderId = uploaderId;
      product.uploaderName = uploaderName;
      
      await product.save();
      updated++;

      console.log(`✅ Updated: ${product.name} - ${uploaderRole}: ${uploaderName}`);
    }

    console.log(`\n🎉 Migration complete! Updated ${updated} products`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migrateProductUploaders();