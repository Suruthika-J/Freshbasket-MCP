// frontend/src/components/Item.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiArrowLeft, FiChevronDown, FiChevronUp, FiPlus, FiMinus, FiX, FiSearch } from 'react-icons/fi';
import { FaShoppingCart } from 'react-icons/fa';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext';
import { groceryData } from '../assets/dummyDataItem';
import { itemsPageStyles } from '../assets/dummyStyles';
import { toast } from 'react-toastify';

const BACKEND_URL = 'http://localhost:4000';

// Stock Status Badge Component
const StockBadge = ({ stock }) => {
  if (stock === 0) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <span className="mr-1">🔴</span> Out of Stock
      </span>
    );
  } else if (stock < 10) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
        <span className="mr-1">🟠</span> Only {stock} left
      </span>
    );
  } else {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <span className="mr-1">🟢</span> In Stock
      </span>
    );
  }
};

const ProductCard = ({ item, onCardClick }) => {
  const { addToCart, removeFromCart, updateQuantity, cart } = useCart();
  const navigate = useNavigate();

  const productId = item._id;
  const cartItem = cart.find(ci => ci.productId === productId);
  const lineId = cartItem?.id;
  const quantity = cartItem?.quantity || 0;
  const stock = item.stock || 0;

  const isAuthenticated = Boolean(localStorage.getItem('authToken'));

  const handleIncrease = () => {
    if (!isAuthenticated) {
      toast.warning('⚠️ Please login first to add items to your cart.', {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    if (stock === 0) {
      toast.error('❌ Product is out of stock!', {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    if (quantity >= stock) {
      toast.error(`❌ Cannot add more. Only ${stock} items available!`, {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    if (lineId) {
      updateQuantity(lineId, quantity + 1);
      toast.success('✅ Quantity updated!', {
        position: "bottom-right",
        autoClose: 1500,
      });
    } else {
      addToCart(productId, 1);
      toast.success('🛒 Added to cart!', {
        position: "bottom-right",
        autoClose: 1500,
      });
    }
  };

  const handleDecrease = () => {
    if (quantity > 1 && lineId) {
      updateQuantity(lineId, quantity - 1);
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

  const rawImage = item.image || item.imageUrl;
  let imgSrc = item.image;
  if (rawImage) {
    if (rawImage.startsWith('http')) imgSrc = rawImage;
    else if (rawImage.startsWith('/')) imgSrc = `${BACKEND_URL}${rawImage}`;
    else imgSrc = `${BACKEND_URL}/uploads/${rawImage}`;
  }

  return (
    <div 
      className={`${itemsPageStyles.productCard} cursor-pointer hover:shadow-lg transition-shadow duration-200`}
      onClick={() => onCardClick(item)}
    >
      <div className={itemsPageStyles.imageContainer}>
        <img
          src={imgSrc}
          className={itemsPageStyles.productImage}
          alt={item.name}
          onError={(e) => {
            e.target.onerror = null;
            e.target.parentNode.innerHTML = `
              <div class="flex items-center justify-center w-full h-full bg-gray-200">
                <span class="text-gray-500 text-sm">No Image</span>
              </div>`;
          }}
        />
      </div>
      
      <div className={itemsPageStyles.cardContent}>
        <div className={itemsPageStyles.titleContainer}>
          <h3 className={itemsPageStyles.productTitle}>{item.name}</h3>
        </div>

        <div className="mb-2">
          <StockBadge stock={stock} />
        </div>

        <div className={itemsPageStyles.priceContainer}>
          <div>
            <span className={itemsPageStyles.currentPrice}>
              ₹{item.price.toFixed(2)}
            </span>
            <span className={itemsPageStyles.oldPrice}>
              ₹{(item.price * 1.2).toFixed(2)}
            </span>
          </div>
          
          <div 
            className="ml-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {quantity === 0 ? (
              <button
                onClick={handleIncrease}
                disabled={stock === 0}
                className={`${itemsPageStyles.addButton} flex items-center ${
                  stock === 0 ? 'opacity-50 cursor-not-allowed bg-gray-400' : ''
                }`}
              >
                <FaShoppingCart className="mr-2" />
                <span>{stock === 0 ? 'Out of Stock' : 'Add'}</span>
              </button>
            ) : (
              <div className={itemsPageStyles.quantityControls}>
                <button 
                  onClick={handleDecrease} 
                  className={`${itemsPageStyles.quantityButton} ${itemsPageStyles.quantityButtonLeft}`}
                >
                  <FiMinus />
                </button>
                <span className={`${itemsPageStyles.quantityValue} font-bold`}>{quantity}</span>
                <button 
                  onClick={handleIncrease}
                  disabled={quantity >= stock}
                  className={`${itemsPageStyles.quantityButton} ${itemsPageStyles.quantityButtonRight} ${
                    quantity >= stock ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <FiPlus />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Items = () => {
  const [expandedCategories, setExpandedCategories] = useState({});
  const [allExpanded, setAllExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState(''); // NEW: State for sorting
  const [data, setData] = useState(groceryData);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false); // NEW: Loading state
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, addToCart, removeFromCart, updateQuantity } = useCart();

  const isAuthenticated = Boolean(localStorage.getItem('authToken'));

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const search = queryParams.get('search');
    if (search) setSearchTerm(search);
  }, [location]);

  // NEW: Fetch products with sorting
  useEffect(() => {
    fetchProducts();
  }, [sortOrder]); // Re-fetch when sort order changes

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Build API URL with sort parameter
      let apiUrl = `${BACKEND_URL}/api/items`;
      if (sortOrder) {
        apiUrl += `?sort=${sortOrder}`;
      }

      console.log('📡 Fetching from:', apiUrl);

      const res = await axios.get(apiUrl);
      const products = Array.isArray(res.data)
        ? res.data
        : res.data.products || [];
      
      // Group by category
      const grouped = products.reduce((acc, item) => {
        const cat = item.category || 'Uncategorized';
        if (!acc[cat]) acc[cat] = { id: cat, name: cat, items: [] };
        acc[cat].items.push(item);
        return acc;
      }, {});
      
      setData(Object.values(grouped));
      console.log('✅ Products loaded:', products.length);
    } catch (err) {
      console.error('❌ Fetch error:', err);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const itemMatchesSearch = (item, term) => {
    if (!term) return true;
    const cleanTerm = term.trim().toLowerCase();
    const searchWords = cleanTerm.split(/\s+/);
    return searchWords.every(word => item.name.toLowerCase().includes(word));
  };

  const filteredData = searchTerm
    ? data
      .map(category => ({
        ...category,
        items: category.items.filter(item => itemMatchesSearch(item, searchTerm))
      }))
      .filter(category => category.items.length > 0)
    : data;

  const clearSearch = () => {
    setSearchTerm('');
    navigate('/items');
  };

  const toggleCategory = categoryId => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const toggleAllCategories = () => {
    if (allExpanded) {
      setExpandedCategories({});
    } else {
      const expanded = {};
      data.forEach(category => {
        expanded[category.id] = true;
      });
      setExpandedCategories(expanded);
    }
    setAllExpanded(!allExpanded);
  };

  const handleCardClick = (product) => {
    setSelectedProduct(product);
  };

  const closeModal = () => {
    setSelectedProduct(null);
  };

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

  // NEW: Handle sort change
  const handleSortChange = (e) => {
    const value = e.target.value;
    setSortOrder(value);
    console.log('🔄 Sort changed to:', value || 'default');
  };

  return (
    <div className={itemsPageStyles.page}>
      <div className={itemsPageStyles.container}>
        <header className={itemsPageStyles.header}>
          <Link to="/" className={itemsPageStyles.backLink}>
            <FiArrowLeft className="mr-2" />
            <span>Back</span>
          </Link>

          <h1 className={itemsPageStyles.mainTitle}>
            <span className={itemsPageStyles.titleSpan}>ORGANIC</span> PANTRY
          </h1>

          <p className={itemsPageStyles.subtitle}>
            Premium quality groceries sourced from local organic farms
          </p>

          <div className={itemsPageStyles.titleDivider}>
            <div className={itemsPageStyles.dividerLine}></div>
          </div>
        </header>

        {/* Search and Sort Container */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className={itemsPageStyles.searchContainer}>
            <form
              onSubmit={e => {
                e.preventDefault();
                if (searchTerm.trim()) {
                  navigate(`/items?search=${encodeURIComponent(searchTerm)}`);
                }
              }}
              className={itemsPageStyles.searchForm}
            >
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search fruits, vegetables, meats..."
                className={itemsPageStyles.searchInput}
              />
              <button type="submit" className={itemsPageStyles.searchButton}>
                <FiSearch className="h-5 w-5" />
              </button>
            </form>
          </div>

          {/* NEW: Sort Dropdown */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-3 bg-white px-5 py-3 rounded-lg shadow-md border border-gray-200">
              <label htmlFor="sort-select" className="text-sm font-medium text-gray-700">
                Sort by Price:
              </label>
              <select
                id="sort-select"
                value={sortOrder}
                onChange={handleSortChange}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer transition-colors"
              >
                <option value="">Default (Newest)</option>
                <option value="asc">Low to High ↑</option>
                <option value="desc">High to Low ↓</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        )}

        {/* Expand/Collapse All Button */}
        {!loading && (
          <div className="flex justify-center mb-10">
            <button
              onClick={toggleAllCategories}
              className={itemsPageStyles.expandButton}
            >
              <span className="mr-2 font-medium">
                {allExpanded ? 'Collapse All' : 'Expand All'}
              </span>
              {allExpanded ? <FiChevronUp /> : <FiChevronDown />}
            </button>
          </div>
        )}

        {/* Products Display */}
        {!loading && filteredData.length > 0 ? (
          filteredData.map(category => {
            const isExpanded = expandedCategories[category.id] || allExpanded;
            const visibleItems = isExpanded
              ? category.items
              : category.items.slice(0, 4);
            const hasMoreItems = category.items.length > 4;

            return (
              <section
                key={category.id}
                className={itemsPageStyles.categorySection}
              >
                <div className={itemsPageStyles.categoryHeader}>
                  <div className={itemsPageStyles.categoryIcon}></div>
                  <h2 className={itemsPageStyles.categoryTitle}>
                    {category.name}
                  </h2>
                  <div className={itemsPageStyles.categoryDivider}></div>
                </div>

                <div className={itemsPageStyles.productsGrid}>
                  {visibleItems.map(item => (
                    <ProductCard 
                      key={`${category.id}-${item._id || item.id || item.name}`} 
                      item={item}
                      onCardClick={handleCardClick}
                    />
                  ))}
                </div>

                {hasMoreItems && (
                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className={itemsPageStyles.showMoreButton}
                    >
                      <span className="mr-2 font-medium">
                        {isExpanded
                          ? `Show Less ${category.name}`
                          : `Show More ${category.name} (${category.items.length - 4}+)`}
                      </span>
                      {isExpanded ? (
                        <FiChevronUp className="text-lg" />
                      ) : (
                        <FiChevronDown className="text-lg" />
                      )}
                    </button>
                  </div>
                )}
              </section>
            );
          })
        ) : !loading ? (
          <div className={itemsPageStyles.noProductsContainer}>
            <div className={itemsPageStyles.noProductsCard}>
              <div className={itemsPageStyles.noProductsIcon}>
                <FiSearch className="mx-auto h-16 w-16" />
              </div>
              <h3 className={itemsPageStyles.noProductsTitle}>
                No products found
              </h3>
              <p className={itemsPageStyles.noProductsText}>
                We couldn't find any items matching "{searchTerm}"
              </p>
              <button
                onClick={clearSearch}
                className={itemsPageStyles.clearSearchButton}
              >
                Clear Search
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Product Detail Modal */}
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
                      src={`${BACKEND_URL}${selectedProduct.imageUrl || selectedProduct.image}`}
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

                  <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                    <StockBadge stock={selectedProduct.stock || 0} />
                  </div>

                  <div className="p-4 bg-emerald-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Selling Price</span>
                      <span className="text-2xl font-bold text-emerald-600">
                        ₹{selectedProduct.price.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Original Price</span>
                      <span className="text-gray-500 line-through">
                        ₹{(selectedProduct.price * 1.2).toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-2 text-right">
                      <span className="text-green-600 text-sm font-medium">
                        Save ₹{(selectedProduct.price * 0.2).toFixed(2)} (17% off)
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-800">Description</h3>
                    <p className="text-gray-600 leading-relaxed">
                      {selectedProduct.description || 
                       `Fresh and organic ${selectedProduct.name.toLowerCase()} sourced directly from local farms. 
                        Premium quality guaranteed with natural taste and maximum nutritional value. 
                        Perfect for healthy cooking and daily consumption.`}
                    </p>
                  </div>

                  <div className="border-t pt-4">
                    {(() => {
                      const qty = getQuantity(selectedProduct._id);
                      const stock = selectedProduct.stock || 0;
                      
                      if (stock === 0) {
                        return (
                          <button
                            disabled
                            className="w-full bg-gray-400 text-green py-3 px-4 rounded-lg font-medium cursor-not-allowed"
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
                          className="w-full bg-emerald-600 text-green py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center"
                        >
                          <FaShoppingCart className="mr-2" />
                          Add to Cart
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center space-x-4 bg-emerald-50 rounded-lg p-3">
                            <button
                              onClick={() => handleDecrease(selectedProduct)}
                              className="w-10 h-10 bg-emerald-600 text-green rounded-full flex items-center justify-center hover:bg-emerald-700 transition-colors"
                            >
                              <FiMinus />
                            </button>
                            <span className="text-xl font-bold text-emerald-700">{qty}</span>
                            <button
                              onClick={() => handleIncrease(selectedProduct)}
                              disabled={qty >= stock}
                              className={`w-10 h-10 bg-emerald-600 text-green rounded-full flex items-center justify-center hover:bg-emerald-700 transition-colors ${
                                qty >= stock ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              <FiPlus />
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

export default Items;