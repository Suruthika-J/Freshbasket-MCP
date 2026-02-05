// File: ItemsHome.jsx
// Path: frontend/src/components/ItemsHome.jsx

import React, { useState, useEffect } from "react";
import { FaShoppingCart, FaChevronRight, FaMinus, FaPlus, FaThList } from "react-icons/fa";
import { FiFilter } from "react-icons/fi";

import { categories } from "../assets/dummyData";
import { useNavigate } from "react-router-dom";
import { useCart } from "../CartContext";
import BannerHome from "../components/BannerHome";
import { itemsHomeStyles } from "../assets/dummyStyles.js";
import { toast } from 'react-toastify';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000';

// Stock Status Badge Component
const StockBadge = ({ stock }) => {
  if (stock === 0) {
    return (
      <span className="inline-flex items-center text-xs font-medium text-red-600">
        <span className="mr-1">🔴</span> Out of Stock
      </span>
    );
  } else if (stock < 10) {
    return (
      <span className="inline-flex items-center text-xs font-medium text-orange-600">
        <span className="mr-1">🟠</span> Only {stock} left
      </span>
    );
  } else {
    return (
      <span className="inline-flex items-center text-xs font-medium text-green-600">
        <span className="mr-1">🟢</span> In Stock
      </span>
    );
  }
};

// Uploader Badge Component
const UploaderBadge = ({ uploaderRole, uploaderName }) => {
  if (uploaderRole === 'admin') {
    return (
      <div className="mb-2">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
          <span className="mr-1">👤</span> Uploaded by Admin
        </span>
      </div>
    );
  } else if (uploaderRole === 'farmer') {
    return (
      <div className="mb-2">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
          <span className="mr-1">🌾</span> Farmer: {uploaderName || 'Local Farmer'}
        </span>
      </div>
    );
  }
  return null;
};

// Farmer Address Component
const FarmerAddressCard = ({ farmer }) => {
  if (!farmer) return null;

  const formatAddress = () => {
    const parts = [];
    
    if (farmer.location?.city && farmer.location.city !== '-') {
      parts.push(farmer.location.city);
    }
    
    if (farmer.district) {
      parts.push(farmer.district);
    }
    
    if (farmer.location?.state && farmer.location.state !== 'Tamil Nadu') {
      parts.push(farmer.location.state);
    } else if (!farmer.location?.state) {
      parts.push('Tamil Nadu');
    }
    
    if (farmer.pincode) {
      parts.push(farmer.pincode);
    }
    
    return parts.join(', ') || 'Address not available';
  };

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
          <span className="text-white text-lg">🌾</span>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-green-900 mb-2">
            Farmer Information
          </h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-green-700 font-semibold min-w-[70px]">Name:</span>
              <span className="text-green-900">{farmer.name}</span>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-green-700 font-semibold min-w-[70px]">📍 Address:</span>
              <span className="text-green-900 font-medium">{formatAddress()}</span>
            </div>

            {farmer.certification && farmer.certification !== 'None' && (
              <div className="flex items-start gap-2">
                <span className="text-green-700 font-semibold min-w-[70px]">✓ Certified:</span>
                <span className="text-green-900">{farmer.certification}</span>
              </div>
            )}

            {farmer.experience && (
              <div className="flex items-start gap-2">
                <span className="text-green-700 font-semibold min-w-[70px]">📅 Experience:</span>
                <span className="text-green-900">{farmer.experience} years</span>
              </div>
            )}

            {farmer.phone && (
              <div className="flex items-start gap-2">
                <span className="text-green-700 font-semibold min-w-[70px]">📞 Phone:</span>
                <span className="text-green-900">{farmer.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// NEW: QUANTITY INPUT COMPONENT WITH REAL-TIME VALIDATION
// ============================================
const QuantityInput = ({ product, onAdd, selectedDistrict }) => {
  const [inputValue, setInputValue] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  const unit = product.unit || 'kg';
  const stock = product.stock || 0;

  useEffect(() => {
    // Reset when product changes
    setInputValue('');
    setAvailabilityStatus(null);
  }, [product._id]);

  const checkAvailability = async (value) => {
    const numValue = parseFloat(value);
    
    if (!value || numValue <= 0 || isNaN(numValue)) {
      setAvailabilityStatus(null);
      return;
    }

    setIsChecking(true);

    // Simulate real-time check
    setTimeout(() => {
      if (numValue > stock) {
        setAvailabilityStatus({
          available: false,
          message: `Only ${stock}${unit} available from this seller`,
          suggestion: selectedDistrict 
            ? `Try checking other sellers in ${selectedDistrict}` 
            : 'Try checking sellers in other districts'
        });
      } else {
        setAvailabilityStatus({
          available: true,
          message: `✓ ${numValue}${unit} available`
        });
      }
      setIsChecking(false);
    }, 300);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    
    // Allow only numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setInputValue(value);
      checkAvailability(value);
    }
  };

  const handleAddToCart = () => {
    const numValue = parseFloat(inputValue);
    
    if (!numValue || numValue <= 0) {
      toast.warning('Please enter a valid quantity', {
        position: 'top-center',
        autoClose: 2000,
      });
      return;
    }

    if (numValue > stock) {
      toast.error(`Only ${stock}${unit} available!`, {
        position: 'top-center',
        autoClose: 3000,
      });
      return;
    }

    onAdd(numValue);
    setInputValue('');
    setAvailabilityStatus(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={`Enter ${unit}`}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
            {unit}
          </span>
        </div>
        
        <button
          onClick={handleAddToCart}
          disabled={!inputValue || !availabilityStatus?.available}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            !inputValue || !availabilityStatus?.available
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          Add
        </button>
      </div>

      {/* Availability Status Message */}
      {isChecking && (
        <div className="text-xs text-gray-500 animate-pulse">
          Checking availability...
        </div>
      )}

      {!isChecking && availabilityStatus && (
        <div className={`text-xs ${availabilityStatus.available ? 'text-green-600' : 'text-orange-600'}`}>
          <div className="font-medium">{availabilityStatus.message}</div>
          {availabilityStatus.suggestion && (
            <div className="text-gray-600 mt-1">{availabilityStatus.suggestion}</div>
          )}
        </div>
      )}
    </div>
  );
};

const ItemsHome = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeCategory, setActiveCategory] = useState(() =>
    localStorage.getItem("activeCategory") || "All"
  );
  const [selectedDistrict, setSelectedDistrict] = useState(() =>
    localStorage.getItem("selectedDistrict") || ""
  );
  
  const navigate = useNavigate();
  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  
  const isAuthenticated = Boolean(localStorage.getItem('authToken'));
  
  const userDistrict = (() => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      return userData.district || '';
    } catch {
      return '';
    }
  })();

  useEffect(() => {
    localStorage.setItem("activeCategory", activeCategory);
  }, [activeCategory]);

  useEffect(() => {
    if (selectedDistrict) {
      localStorage.setItem("selectedDistrict", selectedDistrict);
    }
  }, [selectedDistrict]);

  useEffect(() => {
    fetchProducts();
  }, [selectedDistrict]);

  const fetchProducts = async () => {
    try {
      let url = `${API_BASE_URL}/api/items`;
      
      if (selectedDistrict) {
        url += `?district=${encodeURIComponent(selectedDistrict)}`;
      }
      
      console.log('📡 Fetching products from:', url);
      
      const res = await axios.get(url);
      const normalized = res.data.map(p => ({
        ...p,
        id: p._id,
      }));
      setProducts(normalized);
      console.log('✅ Products loaded:', normalized.length);
    } catch (err) {
      console.error('❌ Error fetching products:', err);
      console.error('Error response:', err.response?.data);
      toast.error('Failed to load products. Please refresh the page.');
    }
  };

  const productMatchesSearch = (product, term) => {
    if (!term) return true;
    const cleanTerm = term.trim().toLowerCase();
    const searchWords = cleanTerm.split(/\s+/);
    return searchWords.every(word =>
      product.name.toLowerCase().includes(word)
    );
  };

  const searchedProducts = searchTerm
    ? products.filter(product => productMatchesSearch(product, searchTerm))
    : (activeCategory === "All"
      ? products
      : products.filter((product) => product.category === activeCategory));

  const getQuantity = (productId) => {
    const item = cart.find((ci) => ci.productId === productId);
    return item ? item.quantity : 0;
  };

  const getLineItemId = (productId) => {
    const item = cart.find((ci) => ci.productId === productId);
    return item ? item.id : null;
  };

  const handleAddWithQuantity = async (product, quantity) => {
    if (!isAuthenticated) {
      toast.warning('⚠️ Please login first to add items to your cart.', {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    try {
      await addToCart(product._id, quantity);
      toast.success(`✅ Added ${quantity}${product.unit || 'kg'} to cart!`, {
        position: "bottom-right",
        autoClose: 1500,
      });
    } catch (err) {
      console.error('Error adding to cart:', err);
      toast.error('Failed to add to cart. Please try again.');
    }
  };

  const handleIncrease = (product) => {
    if (!isAuthenticated) {
      toast.warning('⚠️ Please login first to add items to your cart.', {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }
    if (product.stock === 0) {
      toast.error('❌ Product is out of stock!', {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }
    const currentQty = getQuantity(product._id);
    if (currentQty >= product.stock) {
      toast.error(`❌ Cannot add more. Only ${product.stock} items available!`, {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }
    const lineId = getLineItemId(product._id);
    if (lineId) {
      updateQuantity(lineId, currentQty + 1);
      toast.success('✅ Quantity updated!', {
        position: "bottom-right",
        autoClose: 1500,
      });
    } else {
      addToCart(product._id, 1);
      toast.success('🛒 Added to cart!', {
        position: "bottom-right",
        autoClose: 1500,
      });
    }
  };

  const handleDecrease = (product) => {
    const qty = getQuantity(product._id);
    const lineId = getLineItemId(product._id);
    if (qty > 1 && lineId) {
      updateQuantity(lineId, qty - 1);
      toast.info('Quantity decreased', {
        position: "bottom-right",
        autoClose: 1500,
      });
    } else if (lineId) {
      removeFromCart(lineId);
      toast.info('Removed from cart', {
        position: "bottom-right",
        autoClose: 1500,
      });
    }
  };

  const redirectToItemsPage = () => {
    navigate("/items", { state: { category: activeCategory } });
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleCardClick = (product) => {
    setSelectedProduct(product);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setSelectedProduct(null);
    document.body.style.overflow = 'unset';
  };

  const sidebarCategories = [
    {
      name: "All Items",
      icon: <FaThList className="text-lg" />,
      value: "All"
    },
    ...categories
  ];

  const tamilNaduDistricts = [
    "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore",
    "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram",
    "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Nagapattinam",
    "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram",
    "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur",
    "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur",
    "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore",
    "Viluppuram", "Virudhunagar"
  ];

  return (
    <div className={itemsHomeStyles.page}>
      <div className="bg-white border-b shadow-sm py-3">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FiFilter className="text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filter by District:</span>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Districts</option>
                {tamilNaduDistricts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>
            {userDistrict && (
              <button
                onClick={() => setSelectedDistrict(userDistrict)}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                Show My District ({userDistrict})
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1">
        <aside className={itemsHomeStyles.sidebar}>
          <div className={itemsHomeStyles.sidebarHeader}>
            <h1
              className={itemsHomeStyles.sidebarTitle}
              style={{
                fontFamily: "'Playfair Display', serif",
                textShadow: "2px 2px 4px rgba(0,0,0,0.2)",
              }}
            >
              FreshCart
            </h1>
            <div className={itemsHomeStyles.sidebarDivider} />
          </div>
          <div className={itemsHomeStyles.categoryList}>
            <ul className="space-y-3">
              {sidebarCategories.map((category) => (
                <li key={category.name}>
                  <button
                    onClick={() => {
                      setActiveCategory(category.value || category.name);
                      setSearchTerm('');
                    }}
                    className={`${itemsHomeStyles.categoryItem} ${(activeCategory === (category.value || category.name)) && !searchTerm
                        ? itemsHomeStyles.activeCategory
                        : itemsHomeStyles.inactiveCategory
                      }`}
                  >
                    <div className={itemsHomeStyles.categoryIcon}>
                      {category.icon}
                    </div>
                    <span className={itemsHomeStyles.categoryName}>{category.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className={itemsHomeStyles.mainContent}>
          {selectedDistrict && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                <span className="font-semibold">Showing products for:</span> {selectedDistrict} district
              </p>
            </div>
          )}

          <div className={itemsHomeStyles.mobileCategories}>
            <div className="flex space-x-4">
              {sidebarCategories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => {
                    setActiveCategory(cat.value || cat.name);
                    setSearchTerm('');
                  }}
                  className={`${itemsHomeStyles.mobileCategoryItem} ${activeCategory === (cat.value || cat.name) && !searchTerm
                      ? itemsHomeStyles.activeMobileCategory
                      : itemsHomeStyles.inactiveMobileCategory
                    }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {searchTerm && (
            <div className={itemsHomeStyles.searchResults}>
              <div className="flex items-center justify-center">
                <span className="text-emerald-700 font-medium">
                  Search results for: <span className="font-bold">"{searchTerm}"</span>
                </span>
                <button
                  onClick={() => setSearchTerm('')}
                  className="ml-4 text-emerald-500 hover:text-emerald-700 p-1 rounded-full transition-colors"
                >
                  <span className="text-sm bg-emerald-100 px-2 py-1 rounded-full">Clear</span>
                </button>
              </div>
            </div>
          )}

          <div className="text-center mb-6">
            <h2
              className={itemsHomeStyles.sectionTitle}
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {searchTerm
                ? "Search Results"
                : (activeCategory === "All"
                  ? "Featured Products"
                  : `Best ${activeCategory}`)
              }
            </h2>
            <div className={itemsHomeStyles.sectionDivider} />
          </div>

          <div className={itemsHomeStyles.productsGrid}>
            {searchedProducts.length > 0 ? (
              searchedProducts.map((product) => {
                const qty = getQuantity(product._id);
                const stock = product.stock || 0;
                
                return (
                  <div
                    key={product._id}
                    className={`${itemsHomeStyles.productCard} cursor-pointer hover:shadow-lg transition-shadow duration-200`}
                    onClick={() => handleCardClick(product)}
                  >
                    <div className={itemsHomeStyles.imageContainer}>
                      <img
                        src={`${API_BASE_URL}${product.imageUrl}`}
                        alt={product.name}
                        className={itemsHomeStyles.productImage}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.parentNode.innerHTML = `
                            <div class="flex items-center justify-center w-full h-full bg-gray-200">
                              <span class="text-gray-500 text-sm">No Image</span>
                            </div>`;
                        }}
                      />
                    </div>
                    <div className={itemsHomeStyles.productContent}>
                      <h3 className={itemsHomeStyles.productTitle}>
                        {product.name}
                      </h3>
                      
                      <UploaderBadge 
                        uploaderRole={product.uploaderRole} 
                        uploaderName={product.uploaderName} 
                      />

                      <div className="mb-2">
                        <StockBadge stock={stock} />
                      </div>
                      
                      <div className={itemsHomeStyles.priceContainer}>
                        <div>
                          <p className={itemsHomeStyles.currentPrice}>
                            ₹{product.price.toFixed(2)}/{product.unit || 'kg'}
                          </p>
                          {product.oldPrice && (
                            <span className={itemsHomeStyles.oldPrice}>
                              ₹{product.oldPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className={itemsHomeStyles.noProducts}>
                <div className={itemsHomeStyles.noProductsText}>
                  No products found {selectedDistrict && `in ${selectedDistrict}`}
                </div>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedDistrict('');
                  }}
                  className={itemsHomeStyles.clearSearchButton}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {!searchTerm && (
            <div className="text-center">
              <button
                onClick={redirectToItemsPage}
                className={itemsHomeStyles.viewAllButton}
              >
                View All {activeCategory === "All" ? "Products" : activeCategory}
                <FaChevronRight className="ml-3" />
              </button>
            </div>
          )}
        </main>
      </div>

      {/* ============================================ */}
      {/* UPDATED: Product Detail Modal with Quantity Input */}
      {/* ============================================ */}
      {selectedProduct && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
          style={{
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(0, 0, 0, 0.3)'
          }}
        >
          <div 
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-semibold text-gray-800">Product Details</h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 p-2 transition-colors rounded-full hover:bg-gray-100"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={`${API_BASE_URL}${selectedProduct.imageUrl}`}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.parentNode.innerHTML = `
                          <div class="flex items-center justify-center w-full h-full bg-gray-200">
                            <span class="text-gray-500">No Image</span>
                          </div>`;
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                      {selectedProduct.name}
                    </h1>
                    <p className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full inline-block">
                      {selectedProduct.category || 'Grocery'}
                    </p>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-green-50 border border-gray-200">
                    <UploaderBadge 
                      uploaderRole={selectedProduct.uploaderRole} 
                      uploaderName={selectedProduct.uploaderName} 
                    />
                  </div>
                  
                  {selectedProduct.farmerId && !selectedProduct.adminUploaded && (
                    <FarmerAddressCard farmer={selectedProduct.farmerId} />
                  )}
                  
                  <div className="p-3 rounded-lg bg-gray-50 border">
                    <StockBadge stock={selectedProduct.stock || 0} />
                  </div>
                  
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-700 font-medium">Price per {selectedProduct.unit || 'kg'}</span>
                      <span className="text-2xl font-bold text-emerald-600">
                        ₹{selectedProduct.price.toFixed(2)}
                      </span>
                    </div>
                    {selectedProduct.oldPrice && (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Original Price</span>
                          <span className="text-gray-500 line-through">
                            ₹{selectedProduct.oldPrice.toFixed(2)}
                          </span>
                        </div>
                        <div className="mt-2 text-right">
                          <span className="text-green-600 text-sm font-medium">
                            Save ₹{(selectedProduct.oldPrice - selectedProduct.price).toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-800">Description</h3>
                    <p className="text-gray-600 leading-relaxed text-sm">
                      {selectedProduct.description || 
                       `Fresh and organic ${selectedProduct.name.toLowerCase()} sourced directly from local farms. 
                        Premium quality guaranteed with natural taste and maximum nutritional value. 
                        Perfect for healthy cooking and daily consumption.`}
                    </p>
                  </div>
                  
                  <div className="border-t pt-4">
                    {selectedProduct.stock === 0 ? (
                      <button
                        disabled
                        className="w-full bg-gray-400 text-white py-3 px-4 rounded-lg font-medium cursor-not-allowed"
                      >
                        Out of Stock
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <QuantityInput
                          product={selectedProduct}
                          onAdd={(quantity) => {
                            handleAddWithQuantity(selectedProduct, quantity);
                            if (isAuthenticated) {
                              closeModal();
                            }
                          }}
                          selectedDistrict={selectedDistrict}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemsHome;