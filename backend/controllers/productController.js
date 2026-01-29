// File: productController.js
// Path: backend/controllers/productController.js

import { Product } from '../models/productModel.js';
import { checkAndNotifyStockLevel } from '../services/twilioService.js';

// ============================================
// GET PRODUCTS WITH DISTRICT FILTERING
// ============================================
export const getProducts = async (req, res, next) => {
  try {
    const { sort, district } = req.query;
    
    console.log('📊 Fetching products with params:', { sort, district });
    
    // Build the base query
    let query = {};
    
    // ============================================
    // DISTRICT-BASED FILTERING LOGIC
    // ============================================
    if (district) {
      query.$or = [
        // Farmer products matching district
        { 
          farmerId: { $ne: null },
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
    let dbQuery = Product.find(query).populate({
      path: 'farmerId',
      select: 'name certification experience district'
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
    
    // Additional filtering based on district for farmer products
    const filteredProducts = district 
      ? products.filter(product => {
          // Admin products already filtered by MongoDB query
          if (product.adminUploaded) return true;
          
          // Farmer products - check farmer's district
          if (product.farmerId && product.farmerId.district === district) {
            return true;
          }
          
          return false;
        })
      : products;
    
    console.log(`📦 Retrieved ${filteredProducts.length} products`);
    res.json(filteredProducts);
  } catch (err) {
    console.error('❌ Error fetching products:', err);
    next(err);
  }
};

// GET products for CSV download
export const getProductsForDownload = async (req, res, next) => {
  try {
    const products = await Product.find()
      .select('name category description oldPrice price stock')
      .sort({ category: 1, name: 1 });
    
    res.json(products);
  } catch (err) {
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
    
    // Set farmerId or adminUploaded flag
    if (isAdminUpload) {
      productData.adminUploaded = true;
      productData.farmerId = null;
      
      // Parse and set visible districts for admin uploads
      if (visibleDistricts) {
        productData.visibleDistricts = Array.isArray(visibleDistricts) 
          ? visibleDistricts 
          : JSON.parse(visibleDistricts);
      }
    } else {
      productData.farmerId = req.user._id;
      productData.adminUploaded = false;
      productData.visibleDistricts = [];
    }
    
    const product = await Product.create(productData);
    
    console.log('✅ Product created:', {
      id: product._id,
      adminUploaded: product.adminUploaded,
      farmerId: product.farmerId,
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

// PUT update a product by ID
export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { price, stock, oldPrice, visibleDistricts } = req.body;
    
    console.log('\n=== Update Product Request ===');
    console.log('Product ID:', id);
    console.log('New Stock:', stock);
    console.log('Visible Districts:', visibleDistricts);
    
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
    
    const previousStock = product.stock;
    
    // Update fields
    if (price !== undefined) product.price = Number(price);
    if (stock !== undefined) product.stock = Number(stock);
    if (oldPrice !== undefined) product.oldPrice = Number(oldPrice);
    
    // Update visible districts if provided (admin only)
    if (visibleDistricts !== undefined && product.adminUploaded) {
      product.visibleDistricts = Array.isArray(visibleDistricts) 
        ? visibleDistricts 
        : JSON.parse(visibleDistricts);
    }
    
    const updatedProduct = await product.save();
    
    // Trigger SMS notification if stock changed
    if (stock !== undefined && stock !== previousStock) {
      console.log('📱 Stock changed! Checking for notifications...');
      checkAndNotifyStockLevel(updatedProduct, previousStock)
        .then(() => console.log('✅ Notification check completed'))
        .catch(err => console.error('❌ Notification error:', err.message));
    }
    
    res.json(updatedProduct);
  } catch (err) {
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
    next(err);
  }
};

// GET low stock products
export const getLowStockProducts = async (req, res, next) => {
  try {
    const threshold = Number(process.env.LOW_STOCK_THRESHOLD) || 10;
    const products = await Product.find({
      stock: { $gt: 0, $lt: threshold }
    }).select('name stock category').sort({ stock: 1 });
    
    res.json(products);
  } catch (err) {
    next(err);
  }
};

// GET out of stock products
export const getOutOfStockProducts = async (req, res, next) => {
  try {
    const products = await Product.find({
      stock: 0
    }).select('name stock category').sort({ name: 1 });
    res.json(products);
  } catch (err) {
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