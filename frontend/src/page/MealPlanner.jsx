// frontend/src/page/MealPlanner.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCalendar, FiShoppingCart, FiPlus, FiTrash2, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axios from 'axios';

const MealPlanner = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState({});
  const [addingAllToCart, setAddingAllToCart] = useState(false);

  // Check authentication
  const isLoggedIn = Boolean(localStorage.getItem('authToken'));
  const token = localStorage.getItem('authToken');

  // Days of the week
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const mealTypes = ['Breakfast', 'Lunch', 'Dinner'];

  // Initialize meal plan structure
  const initializeMealPlan = () => {
    const plan = {};
    daysOfWeek.forEach(day => {
      plan[day] = {
        Breakfast: null,
        Lunch: null,
        Dinner: null
      };
    });
    return plan;
  };

  const [mealPlan, setMealPlan] = useState(initializeMealPlan());

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try multiple possible endpoints
        const endpoints = [
          `${import.meta.env.VITE_API_URL}/api/products`,
          `${import.meta.env.VITE_API_URL}/api/items`,
        ];

        let fetchedProducts = [];
        let lastError = null;

        for (const endpoint of endpoints) {
          try {
            console.log('🔍 Trying to fetch from:', endpoint);
            const response = await axios.get(endpoint);
            console.log('✅ Response received:', response.data);

            // Handle different response structures
            if (response.data.success && response.data.data) {
              fetchedProducts = response.data.data;
              console.log('✅ Products found (data.data):', fetchedProducts.length);
              break;
            } else if (response.data.success && response.data.items) {
              fetchedProducts = response.data.items;
              console.log('✅ Products found (data.items):', fetchedProducts.length);
              break;
            } else if (Array.isArray(response.data)) {
              fetchedProducts = response.data;
              console.log('✅ Products found (array):', fetchedProducts.length);
              break;
            } else if (response.data.products) {
              fetchedProducts = response.data.products;
              console.log('✅ Products found (data.products):', fetchedProducts.length);
              break;
            }
          } catch (err) {
            console.log('⚠️ Failed endpoint:', endpoint, err.message);
            lastError = err;
          }
        }

        if (fetchedProducts.length > 0) {
          // Filter out products that don't have required fields
          const validProducts = fetchedProducts.filter(p => p._id && p.name && p.price);
          console.log('✅ Valid products:', validProducts.length);
          setProducts(validProducts);

          if (validProducts.length === 0) {
            setError('No valid products found');
            toast.error('Products are missing required information');
          }
        } else {
          setError('No products available');
          toast.error('No products found. Please check your product list.');
          console.error('❌ No products fetched from any endpoint');
        }

      } catch (error) {
        console.error('❌ Error fetching products:', error);
        setError(error.response?.data?.message || 'Failed to load products');
        toast.error('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Handle meal selection
  const handleMealSelection = (day, mealType, productId) => {
    if (!productId) {
      setMealPlan(prev => ({
        ...prev,
        [day]: {
          ...prev[day],
          [mealType]: null
        }
      }));
      return;
    }

    const selectedProduct = products.find(p => p._id === productId);
    console.log('🍽️ Selected product:', selectedProduct);

    if (selectedProduct) {
      setMealPlan(prev => ({
        ...prev,
        [day]: {
          ...prev[day],
          [mealType]: selectedProduct
        }
      }));
    }
  };

  // Remove meal from slot
  const handleRemoveMeal = (day, mealType) => {
    setMealPlan(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [mealType]: null
      }
    }));
  };

  // Add single item to cart
  const handleAddToCart = async (product, day, mealType) => {
    if (!isLoggedIn) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    const key = `${day}-${mealType}`;
    setAddingToCart(prev => ({ ...prev, [key]: true }));

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/cart`,
        {
          productId: product._id,
          quantity: 1
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'token': token
          }
        }
      );

      if (response.data.success) {
        toast.success(`${product.name} added to cart!`);
        // Dispatch cart update event
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error(error.response?.data?.message || 'Failed to add item to cart');
    } finally {
      setAddingToCart(prev => ({ ...prev, [key]: false }));
    }
  };

  // Add all planned meals to cart
  const handleAddAllToCart = async () => {
    if (!isLoggedIn) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    // Collect all selected items
    const allItems = [];
    Object.keys(mealPlan).forEach(day => {
      Object.keys(mealPlan[day]).forEach(mealType => {
        if (mealPlan[day][mealType]) {
          allItems.push(mealPlan[day][mealType]);
        }
      });
    });

    if (allItems.length === 0) {
      toast.warning('No meals planned yet!');
      return;
    }

    setAddingAllToCart(true);

    try {
      let successCount = 0;
      let failCount = 0;

      // Add items one by one
      for (const item of allItems) {
        try {
          await axios.post(
            `${import.meta.env.VITE_API_URL}/api/cart`,
            {
              productId: item._id,
              quantity: 1
            },
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'token': token
              }
            }
          );
          successCount++;
        } catch (err) {
          console.error('Failed to add item:', item.name, err);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} meal${successCount > 1 ? 's' : ''} added to cart!`);
        window.dispatchEvent(new Event('cartUpdated'));
        setMealPlan(initializeMealPlan());
      }

      if (failCount > 0) {
        toast.warning(`${failCount} item${failCount > 1 ? 's' : ''} failed to add`);
      }

    } catch (error) {
      console.error('Error adding all to cart:', error);
      toast.error('Failed to add some items to cart');
    } finally {
      setAddingAllToCart(false);
    }
  };

  // Count planned meals
  const countPlannedMeals = () => {
    let count = 0;
    Object.keys(mealPlan).forEach(day => {
      Object.keys(mealPlan[day]).forEach(mealType => {
        if (mealPlan[day][mealType]) count++;
      });
    });
    return count;
  };

  if (loading) {
    return (
      <div className="min-h-screen fb-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 fb-border-primary mx-auto mb-4"></div>
          <div className="fb-text text-xl">Loading products...</div>
        </div>
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div className="min-h-screen fb-bg flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full fb-card p-8 text-center border-red-500/30">
          <FiAlertCircle className="text-6xl text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold fb-text mb-2">No Products Available</h2>
          <p className="fb-text-secondary mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="fb-btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen fb-bg py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <FiCalendar className="text-5xl fb-text-primary mr-3" />
            <h1 className="text-4xl md:text-5xl font-bold fb-text">
              Weekly Meal Planner
            </h1>
          </div>
          <p className="fb-text-secondary text-lg max-w-2xl mx-auto">
            Plan your weekly meals and add them directly to your cart
          </p>
          {products.length > 0 && (
            <p className="fb-text-primary text-sm mt-2 font-medium">
              {products.length} products available
            </p>
          )}
        </div>

        {/* Not Logged In Warning */}
        {!isLoggedIn && (
          <div className="mb-8 fb-badge-warning rounded-xl p-6 text-center border fb-border">
            <p className="text-lg">
              ⚠️ Please <span className="font-semibold underline cursor-pointer" onClick={() => navigate('/login')}>login</span> to add meals to your cart
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button
            onClick={handleAddAllToCart}
            disabled={addingAllToCart || countPlannedMeals() === 0 || !isLoggedIn}
            className="fb-btn-primary shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiShoppingCart className="mr-2" />
            {addingAllToCart ? 'Adding...' : `Add All to Cart (${countPlannedMeals()} items)`}
          </button>
          <button
            onClick={() => setMealPlan(initializeMealPlan())}
            className="fb-btn-secondary border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white"
          >
            <FiTrash2 className="inline mr-2" />
            Clear All
          </button>
        </div>

        {/* Meal Plan Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {daysOfWeek.map(day => (
            <div
              key={day}
              className="fb-card p-6"
            >
              {/* Day Header */}
              <h2 className="text-2xl font-bold fb-text-primary mb-6 text-center border-b fb-border-primary pb-3">
                {day}
              </h2>

              {/* Meal Slots */}
              <div className="space-y-4">
                {mealTypes.map(mealType => (
                  <div
                    key={mealType}
                    className="fb-surface-alt rounded-xl p-4 border fb-border"
                  >
                    <h3 className="text-lg font-semibold fb-text mb-3 flex items-center">
                      {mealType === 'Breakfast' && '🍳'}
                      {mealType === 'Lunch' && '🍱'}
                      {mealType === 'Dinner' && '🍽️'}
                      <span className="ml-2">{mealType}</span>
                    </h3>

                    {/* Product Selection Dropdown */}
                    {!mealPlan[day][mealType] ? (
                      <select
                        value=""
                        onChange={(e) => handleMealSelection(day, mealType, e.target.value)}
                        className="fb-input"
                      >
                        <option value="">Select a product...</option>
                        {products.map(product => (
                          <option key={product._id} value={product._id}>
                            {product.name} - ₹{product.price}
                          </option>
                        ))}
                      </select>
                    ) : (
                      // Selected Meal Display
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="fb-text font-medium">
                              {mealPlan[day][mealType].name}
                            </p>
                            <p className="fb-text-primary text-sm font-semibold">
                              ₹{mealPlan[day][mealType].price}
                            </p>
                            {mealPlan[day][mealType].category && (
                              <span className="inline-block mt-1 px-2 py-1 fb-badge-success text-xs rounded">
                                {mealPlan[day][mealType].category}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveMeal(day, mealType)}
                            className="fb-text-error hover:opacity-80 transition-opacity"
                            title="Remove meal"
                          >
                            <FiTrash2 className="text-xl" />
                          </button>
                        </div>

                        {/* Add to Cart Button */}
                        <button
                          onClick={() => handleAddToCart(mealPlan[day][mealType], day, mealType)}
                          disabled={addingToCart[`${day}-${mealType}`] || !isLoggedIn}
                          className="w-full fb-btn-secondary text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {addingToCart[`${day}-${mealType}`] ? (
                            <>Adding...</>
                          ) : (
                            <>
                              <FiShoppingCart className="mr-2" />
                              Add to Cart
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Summary Card */}
        {countPlannedMeals() > 0 && (
          <div className="mt-8 fb-card bg-gradient-to-r from-emerald-500/10 to-green-500/10 p-6 text-center">
            <FiCheckCircle className="text-4xl fb-text-primary mx-auto mb-3" />
            <h3 className="text-2xl font-bold fb-text mb-2">
              {countPlannedMeals()} Meals Planned
            </h3>
            <p className="fb-text-secondary">
              Ready to add to cart and start shopping!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MealPlanner;