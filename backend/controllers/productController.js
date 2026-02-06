// File: productController.js
// Path: backend/controllers/productController.js

import { Product } from '../models/productModel.js';
import { checkAndNotifyStockLevel } from '../services/twilioService.js';
import User from '../models/userModel.js';

// ============================================
// GET PRODUCTS WITH DISTRICT FILTERING (FIXED)
// ============================================
export const getProducts = async (req, res, next) => {
  try {
    const { sort, district } = req.query;
    
    console.log('📊 Fetching products with params:', { sort, district });
    
    // Build the base query
    let query = {};
    
    // ============================================
    // FIXED: DISTRICT-BASED FILTERING LOGIC
    // ============================================
    if (district) {
      // Find all farmer IDs in this district first
      const farmersInDistrict = await User.find({
        role: 'farmer',
        district: district
      }).select('_id');
      
      const farmerIds = farmersInDistrict.map(f => f._id);
      
      console.log(`🌾 Found ${farmerIds.length} farmers in ${district}`);
      
      query.$or = [
        // Farmer products matching district
        { 
          farmerId: { $in: farmerIds },
          adminUploaded: false
        },
        // Admin products with matching district in visibleDistricts
        {
          adminUploaded: true,
          visibleDistricts: district
        }
      ];
    }
    
    // Build the query with population
    let dbQuery = Product.find(query)
      .populate({
        path: 'farmerId',
        select: 'name certification experience district location phone'
      })
      .populate({
        path: 'uploaderId',
        select: 'name role'
      });
    
    // Apply sorting
    if (sort === 'asc') {
      dbQuery = dbQuery.sort({ price: 1 });
      console.log('✅ Sorting: Price Low to High');
    } else if (sort === 'desc') {
      dbQuery = dbQuery.sort({ price: -1 });
      console.log('✅ Sorting: Price High to Low');
    } else {
      dbQuery = dbQuery.sort({ createdAt: -1 });
      console.log('✅ Sorting: Default (Newest first)');
    }
    
    const products = await dbQuery;
    
    console.log(`📦 Retrieved ${products.length} products`);
    res.json(products);
  } catch (err) {
    console.error('❌ Error fetching products:', err);
    console.error('Error stack:', err.stack);
    next(err);
  }
};

// GET products for CSV download
export const getProductsForDownload = async (req, res, next) => {
  try {
    const products = await Product.find()
      .select('name category description oldPrice price stock uploaderRole uploaderName')
      .sort({ category: 1, name: 1 });
    
    res.json(products);
  } catch (err) {
    console.error('❌ Error in getProductsForDownload:', err);
    next(err);
  }
};

// ============================================
// CREATE PRODUCT (FARMER OR ADMIN)
// ============================================
export const createProduct = async (req, res, next) => {
  try {
    const filename = req.file?.filename ?? null;
    const imageUrl = filename ? `/uploads/${filename}` : null;
    const { name, description, category, oldPrice, price, stock, unit, visibleDistricts } = req.body;
    
    console.log('📦 Creating product:', {
      name,
      userRole: req.user.role,
      userId: req.user._id,
      visibleDistricts
    });
    
    // Determine if admin or farmer upload
    const isAdminUpload = req.user.role === 'admin';
    
    const productData = {
      name,
      description,
      category,
      oldPrice: oldPrice ? Number(oldPrice) : null,
      price: Number(price),
      stock: Number(stock) || 0,
      imageUrl,
      unit: unit || 'kg',
    };
    
    if (isAdminUpload) {
      productData.adminUploaded = true;
      productData.farmerId = null;
      productData.uploaderRole = 'admin';
      productData.uploaderId = req.user._id;
      productData.uploaderName = 'Admin';
      
      // Parse and set visible districts for admin uploads
      if (visibleDistricts) {
        productData.visibleDistricts = Array.isArray(visibleDistricts) 
          ? visibleDistricts 
          : JSON.parse(visibleDistricts);
      }
    } else {
      // Farmer upload
      productData.farmerId = req.user._id;
      productData.adminUploaded = false;
      productData.visibleDistricts = [];
      productData.uploaderRole = 'farmer';
      productData.uploaderId = req.user._id;
      productData.uploaderName = req.user.name;
      
      console.log('🌾 Farmer product - storing uploader info:', {
        uploaderRole: 'farmer',
        uploaderName: req.user.name
      });
    }
    
    const product = await Product.create(productData);
    
    console.log('✅ Product created:', {
      id: product._id,
      adminUploaded: product.adminUploaded,
      farmerId: product.farmerId,
      uploaderRole: product.uploaderRole,
      uploaderName: product.uploaderName,
      visibleDistricts: product.visibleDistricts
    });
    
    // Check stock level
    if (product.stock <= Number(process.env.LOW_STOCK_THRESHOLD || 5)) {
      checkAndNotifyStockLevel(product, Infinity)
        .catch(err => console.error('Notification error:', err));
    }
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (err) {
    console.error('❌ Create product error:', err);
    next(err);
  }
};

// PUT update a product by ID (Enhanced for Farmer Editing)
export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, category, price, stock, oldPrice, visibleDistricts } = req.body;

    console.log('\n=== Update Product Request ===');
    console.log('Product ID:', id);
    console.log('User Role:', req.user?.role);
    console.log('User ID:', req.user?._id);

    // Validate input
    if (price !== undefined && (isNaN(price) || price < 0)) {
      return res.status(400).json({ message: 'Invalid price value' });
    }
    if (stock !== undefined && (isNaN(stock) || stock < 0)) {
      return res.status(400).json({ message: 'Invalid stock value' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Ownership validation for farmers
    if (req.user.role === 'farmer') {
      if (product.farmerId?.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: 'Access denied. You can only edit your own products.'
        });
      }
    }

    const previousStock = product.stock;

    // Update fields based on user role
    if (req.user.role === 'farmer') {
      // Farmers can edit: name, description, category, price, stock, oldPrice, imageUrl
      if (name !== undefined) product.name = name.trim();
      if (description !== undefined) product.description = description.trim();
      if (category !== undefined) product.category = category;
      if (price !== undefined) product.price = Number(price);
      if (stock !== undefined) product.stock = Number(stock);
      if (oldPrice !== undefined) product.oldPrice = oldPrice ? Number(oldPrice) : null;

      // Handle image upload for farmers
      const filename = req.file?.filename ?? null;
      if (filename) {
        product.imageUrl = `/uploads/${filename}`;
      }
    } else if (req.user.role === 'admin') {
      // Admins can edit all fields including visibleDistricts
      if (name !== undefined) product.name = name.trim();
      if (description !== undefined) product.description = description.trim();
      if (category !== undefined) product.category = category;
      if (price !== undefined) product.price = Number(price);
      if (stock !== undefined) product.stock = Number(stock);
      if (oldPrice !== undefined) product.oldPrice = oldPrice ? Number(oldPrice) : null;

      // Update visible districts if provided (admin only)
      if (visibleDistricts !== undefined && product.adminUploaded) {
        product.visibleDistricts = Array.isArray(visibleDistricts)
          ? visibleDistricts
          : JSON.parse(visibleDistricts);
      }

      // Handle image upload for admins
      const filename = req.file?.filename ?? null;
      if (filename) {
        product.imageUrl = `/uploads/${filename}`;
      }
    } else {
      return res.status(403).json({ message: 'Access denied. Insufficient privileges.' });
    }

    const updatedProduct = await product.save();

    // Trigger SMS notification if stock changed
    if (stock !== undefined && stock !== previousStock) {
      console.log('📱 Stock changed! Checking for notifications...');
      checkAndNotifyStockLevel(updatedProduct, previousStock)
        .then(() => console.log('✅ Notification check completed'))
        .catch(err => console.error('❌ Notification error:', err.message));
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (err) {
    console.error('❌ Error in updateProduct:', err);
    next(err);
  }
};

// DELETE a product by ID
export const deleteProduct = async (req, res, next) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404);
      throw new Error('Product not found');
    }
    res.json({
      success: true,
      message: 'Product removed successfully'
    });
  } catch (err) {
    console.error('❌ Error in deleteProduct:', err);
    next(err);
  }
};

// GET low stock products
export const getLowStockProducts = async (req, res, next) => {
  try {
    const threshold = Number(process.env.LOW_STOCK_THRESHOLD) || 10;
    const products = await Product.find({
      stock: { $gt: 0, $lt: threshold }
    }).select('name stock category uploaderRole uploaderName').sort({ stock: 1 });
    
    res.json(products);
  } catch (err) {
    console.error('❌ Error in getLowStockProducts:', err);
    next(err);
  }
};

// GET out of stock products
export const getOutOfStockProducts = async (req, res, next) => {
  try {
    const products = await Product.find({
      stock: 0
    }).select('name stock category uploaderRole uploaderName').sort({ name: 1 });
    res.json(products);
  } catch (err) {
    console.error('❌ Error in getOutOfStockProducts:', err);
    next(err);
  }
};

// GET products for logged-in farmer
export const getFarmerProducts = async (req, res, next) => {
  try {
    const farmerId = req.user._id;
    console.log('🌾 Fetching products for farmer:', farmerId);
    
    const products = await Product.find({ farmerId })
      .sort({ createdAt: -1 });
    
    console.log(`📦 Retrieved ${products.length} products for farmer`);
    res.json({
      success: true,
      products
    });
  } catch (err) {
    console.error('❌ Error fetching farmer products:', err);
    next(err);
  }
};

// ADMIN-ONLY - GET PRODUCTS BY FARMER ID
export const getProductsByFarmerId = async (req, res, next) => {
  try {
    const { farmerId } = req.params;
    
    console.log('👨‍🌾 Admin fetching products for farmer:', farmerId);
    
    // Verify the farmer exists
    const farmer = await User.findById(farmerId);
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found'
      });
    }
    
    if (farmer.role !== 'farmer') {
      return res.status(400).json({
        success: false,
        message: 'User is not a farmer'
      });
    }
    
    // Fetch all products uploaded by this farmer
    const products = await Product.find({ 
      farmerId: farmerId,
      uploaderRole: 'farmer'
    })
    .sort({ createdAt: -1 })
    .select('name category description price oldPrice stock imageUrl unit createdAt updatedAt');
    
    console.log(`📦 Retrieved ${products.length} products for farmer ${farmer.name}`);
    
    res.json({
      success: true,
      farmer: {
        id: farmer._id,
        name: farmer.name,
        email: farmer.email,
        district: farmer.district,
        certification: farmer.certification,
        experience: farmer.experience
      },
      products,
      count: products.length
    });
  } catch (err) {
    console.error('❌ Error fetching products by farmer ID:', err);
    next(err);
  }
};