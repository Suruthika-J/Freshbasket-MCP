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

const ItemsHome = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeCategory, setActiveCategory] = useState(() =>
    localStorage.getItem("activeCategory") || "All"
  );
  const [selectedDistrict, setSelectedDistrict] = useState(() =>
    localStorage.getItem("selectedDistrict") || ""
  );
  const [showDistrictFilter, setShowDistrictFilter] = useState(false);
  
  const navigate = useNavigate();
  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  
  const isAuthenticated = Boolean(localStorage.getItem('authToken'));
  
  // Get user's district from localStorage
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
      
      // Add district filter if selected
      if (selectedDistrict) {
        url += `?district=${encodeURIComponent(selectedDistrict)}`;
      }
      
      const res = await axios.get(url);
      const normalized = res.data.map(p => ({
        ...p,
        id: p._id,
      }));
      setProducts(normalized);
    } catch (err) {
      console.error('Error fetching products:', err);
      toast.error('Failed to load products');
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
  };

  const closeModal = () => {
    setSelectedProduct(null);
  };

  const sidebarCategories = [
    {
      name: "All Items",
      icon: <FaThList className="text-lg" />,
      value: "All"
    },
    ...categories
  ];

  // Tamil Nadu Districts
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
      {/* District Filter */}
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
                
                // Determine if product is from farmer or admin
                const isFarmerProduct = product.farmerId && !product.adminUploaded;
                const farmer = isFarmerProduct ? product.farmerId : null;

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
                      
                      {/* Farmer Info or Admin Label */}
                      {isFarmerProduct && farmer ? (
                        <div className="mb-2 text-xs space-y-1 bg-green-50 p-2 rounded border border-green-200">
                          <p className="font-semibold text-green-800">🌾 From: {farmer.name}</p>
                          {farmer.certification && farmer.certification !== 'None' && (
                            <p className="text-green-700">✓ {farmer.certification} Certified</p>
                          )}
                          {farmer.experience && (
                            <p className="text-green-700">📅 {farmer.experience} years experience</p>
                          )}
                          {farmer.district && (
                            <p className="text-green-700">📍 {farmer.district}</p>
                          )}
                        </div>
                      ) : (
                        <div className="mb-2">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                            ✨ Freshly updated item from the farm
                          </span>
                        </div>
                      )}

                      <div className="mb-2">
                        <StockBadge stock={stock} />
                      </div>
                      
                      <div className={itemsHomeStyles.priceContainer}>
                        <div>
                          <p className={itemsHomeStyles.currentPrice}>
                            ₹{product.price.toFixed(2)}
                          </p>
                          {product.oldPrice && (
                            <span className={itemsHomeStyles.oldPrice}>
                              ₹{product.oldPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                        {qty === 0 ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleIncrease(product);
                            }}
                            disabled={stock === 0}
                            className={`${itemsHomeStyles.addButton} ${
                              stock === 0 ? 'opacity-50 cursor-not-allowed bg-gray-400' : ''
                            }`}
                          >
                            <FaShoppingCart className="mr-2" />
                            {stock === 0 ? 'Out' : 'Add'}
                          </button>
                        ) : (
                          <div
                            className={itemsHomeStyles.quantityControls}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => handleDecrease(product)}
                              className={itemsHomeStyles.quantityButton}
                            >
                              <FaMinus />
                            </button>
                            <span className="font-bold">{qty}</span>
                            <button
                              onClick={() => handleIncrease(product)}
                              disabled={qty >= stock}
                              className={`${itemsHomeStyles.quantityButton} ${
                                qty >= stock ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              <FaPlus />
                            </button>
                          </div>
                        )}
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

      {/* Product Detail Modal - Same as before */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Product Details</h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 p-2"
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
                  
                  {/* Show farmer info or admin label in modal */}
                  {selectedProduct.farmerId && !selectedProduct.adminUploaded ? (
                    <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                      <p className="text-sm font-semibold text-green-800 mb-2">🌾 Farmer Information</p>
                      <div className="space-y-1 text-sm text-green-700">
                        <p><span className="font-medium">Name:</span> {selectedProduct.farmerId.name}</p>
                        {selectedProduct.farmerId.certification && selectedProduct.farmerId.certification !== 'None' && (
                          <p><span className="font-medium">Certification:</span> {selectedProduct.farmerId.certification}</p>
                        )}
                        {selectedProduct.farmerId.experience && (
                          <p><span className="font-medium">Experience:</span> {selectedProduct.farmerId.experience} years</p>
                        )}
                        {selectedProduct.farmerId.district && (
                          <p><span className="font-medium">District:</span> {selectedProduct.farmerId.district}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <p className="text-sm text-blue-800 font-medium">✨ Freshly updated item from the farm</p>
                    </div>
                  )}
                  
                  <div className="p-3 rounded-lg bg-gray-50 border">
                    <StockBadge stock={selectedProduct.stock || 0} />
                  </div>
                  
                  <div className="p-4 bg-emerald-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Selling Price</span>
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
                  
                  <div className="border-t pt-4">
                    {(() => {
                      const qty = getQuantity(selectedProduct._id);
                      const stock = selectedProduct.stock || 0;
                      
                      if (stock === 0) {
                        return (
                          <button
                            disabled
                            className="w-full bg-gray-400 text-white py-3 px-4 rounded-lg font-medium cursor-not-allowed"
                          >
                            Out of Stock
                          </button>
                        );
                      }
                      
                      return qty === 0 ? (
                        <button
                          onClick={() => {
                            handleIncrease(selectedProduct);
                            if (isAuthenticated && stock > 0) {
                              closeModal();
                            }
                          }}
                          className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center"
                        >
                          <FaShoppingCart className="mr-2" />
                          Add to Cart
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center space-x-4 bg-emerald-50 rounded-lg p-3">
                            <button
                              onClick={() => handleDecrease(selectedProduct)}
                              className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center hover:bg-emerald-700 transition-colors"
                            >
                              <FaMinus />
                            </button>
                            <span className="text-xl font-bold text-emerald-700">{qty}</span>
                            <button
                              onClick={() => handleIncrease(selectedProduct)}
                              disabled={qty >= stock}
                              className={`w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center hover:bg-emerald-700 transition-colors ${
                                qty >= stock ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              <FaPlus />
                            </button>
                          </div>
                          <p className="text-center text-sm text-gray-600">
                            Total: ₹{(selectedProduct.price * qty).toFixed(2)}
                          </p>
                          {qty >= stock && (
                            <p className="text-center text-xs text-orange-600 font-medium">
                              Maximum quantity reached
                            </p>
                          )}
                        </div>
                      );
                    })()}
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