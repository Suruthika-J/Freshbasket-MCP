// File: productModel.js
// Path: backend/models/productModel.js

import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      required: true,
      default: 'general'
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    oldPrice: {
      type: Number,
      min: 0,
      default: null
    },
    imageUrl: {
      type: String,
      default: ''
    },
    stock: {
      type: Number,
      default: 0,
      min: 0
    },
    unit: {
      type: String,
      default: 'kg'
    },
    // ============================================
    // FARMER/ADMIN UPLOAD DIFFERENTIATION
    // ============================================
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      default: null
    },
    adminUploaded: {
      type: Boolean,
      default: false
    },
    // ============================================
    // NEW: UPLOADER TRACKING FIELDS
    // ============================================
    uploaderRole: {
      type: String,
      enum: ['admin', 'farmer'],
      required: true,
      default: 'admin'
    },
    uploaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      default: null
    },
    uploaderName: {
      type: String,
      default: 'Admin',
      trim: true
    },
    // ============================================
    // DISTRICT-BASED VISIBILITY FOR ADMIN UPLOADS
    // ============================================
    visibleDistricts: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

// Virtual field to check if product is on sale
productSchema.virtual('isOnSale').get(function() {
  return this.oldPrice && this.oldPrice > this.price;
});

// Virtual field to calculate discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (!this.oldPrice || this.oldPrice <= this.price) return 0;
  return Math.round(((this.oldPrice - this.price) / this.oldPrice) * 100);
});

// Virtual field to check stock availability
productSchema.virtual('inStock').get(function() {
  return this.stock > 0;
});

// Method to check if requested quantity is available
productSchema.methods.hasStock = function(quantity) {
  return this.stock >= quantity;
};

// Method to reduce stock (with automatic notification)
productSchema.methods.reduceStock = async function(quantity) {
  if (this.stock < quantity) {
    throw new Error(`Insufficient stock. Only ${this.stock} items available`);
  }
  const previousStock = this.stock;
  this.stock -= quantity;
  const result = await this.save();
  
  // Trigger notification check after stock reduction
  try {
    const { checkAndNotifyStockLevel } = await import('../services/twilioService.js');
    await checkAndNotifyStockLevel(this, previousStock);
  } catch (error) {
    console.error('Failed to send stock notification:', error);
  }
  return result;
};

// Method to increase stock (for returns/restocking)
productSchema.methods.increaseStock = async function(quantity) {
  this.stock += quantity;
  return await this.save();
};

// Include virtuals in JSON output
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

// Safe export pattern (prevents hot-reload issues)
export const Product = mongoose.models.Product || mongoose.model('Product', productSchema);