// File: FarmerDashboard.jsx
// Path: frontend/src/page/FarmerDashboard.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiPackage, FiPlus, FiEdit, FiTrash2, FiEye, FiUser, FiSave, FiLogOut, FiAlertTriangle, FiXCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import StockAdjuster from '../components/StockAdjuster';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const FarmerDashboard = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [farmerInfo, setFarmerInfo] = useState(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [profileForm, setProfileForm] = useState({
    certification: '',
    experience: '',
    district: ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [showOutOfStockModal, setShowOutOfStockModal] = useState(false);

  useEffect(() => {
    fetchFarmerProducts();
    fetchFarmerInfo();
  }, []);

  const fetchFarmerInfo = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const user = response.data.data;
        setFarmerInfo(user);
        
        // Pre-fill profile form with existing data
        setProfileForm({
          certification: user.certification || 'None',
          experience: user.experience || '',
          district: user.district || ''
        });
      }
    } catch (error) {
      console.error('Error fetching farmer info:', error);
    }
  };

  const fetchFarmerProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/products/farmer-products`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setProducts(response.data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      
      const response = await axios.put(
        `${API_BASE_URL}/api/user/farmer/profile`,
        {
          certification: profileForm.certification,
          experience: Number(profileForm.experience),
          district: profileForm.district
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success('Profile updated successfully!');
        setFarmerInfo(response.data.user);
        setShowProfileEdit(false);
        
        // Update localStorage with new user data
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const updatedUser = { ...userData, ...response.data.user };
        localStorage.setItem('userData', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleAddProduct = () => {
    navigate('/farmer/add-product');
  };

  const handleEditProduct = (productId) => {
    navigate(`/farmer/edit-product/${productId}`);
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.delete(`${API_BASE_URL}/api/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Product deleted successfully');
        fetchFarmerProducts();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleLowStockClick = () => {
    setShowLowStockModal(true);
  };

  const handleOutOfStockClick = () => {
    setShowOutOfStockModal(true);
  };

  const handleStockUpdate = (productId, newStock) => {
    // Update the local state to reflect the stock change immediately
    setProducts(prevProducts =>
      prevProducts.map(product =>
        product._id === productId
          ? { ...product, stock: newStock }
          : product
      )
    );
  };

  const handleLogout = () => {
    toast.info('Logging out...', {
      position: 'top-center',
      autoClose: 1200,
    });

    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('userRole');

    window.dispatchEvent(new Event('authStateChanged'));

    setTimeout(() => {
      navigate('/', { replace: true });
    }, 400);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Farmer Dashboard</h1>
              {farmerInfo && (
                <p className="text-gray-600 mt-1">Welcome back, {farmerInfo.name}!</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowProfileEdit(!showProfileEdit)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <FiUser className="w-5 h-5" />
                {showProfileEdit ? 'Hide Profile' : 'Edit Profile'}
              </button>
              <button
                onClick={handleAddProduct}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <FiPlus className="w-5 h-5" />
                Add Product
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <FiLogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Edit Section */}
      {showProfileEdit && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Farmer Profile</h2>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certification *
                  </label>
                  <select
                    value={profileForm.certification}
                    onChange={(e) => setProfileForm({ ...profileForm, certification: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Certification</option>
                    <option value="Organic">Organic</option>
                    <option value="FSSAI">FSSAI</option>
                    <option value="None">None</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience (Years) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={profileForm.experience}
                    onChange={(e) => setProfileForm({ ...profileForm, experience: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter years of experience"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    District *
                  </label>
                  <input
                    type="text"
                    value={profileForm.district}
                    onChange={(e) => setProfileForm({ ...profileForm, district: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your district"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  {profileLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiSave className="w-5 h-5" />
                      Save Profile
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-full p-3">
                <FiPackage className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-full p-3">
                <FiEye className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Products</p>
                <p className="text-2xl font-bold text-gray-900">
                  {products.filter(p => p.stock > 0).length}
                </p>
              </div>
            </div>
          </div>

          <div
            className="bg-white rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
            onClick={handleLowStockClick}
          >
            <div className="flex items-center">
              <div className="bg-yellow-100 rounded-full p-3">
                <FiAlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {products.filter(p => p.stock > 0 && p.stock < 10).length}
                </p>
              </div>
            </div>
          </div>

          <div
            className="bg-white rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
            onClick={handleOutOfStockClick}
          >
            <div className="flex items-center">
              <div className="bg-red-100 rounded-full p-3">
                <FiXCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {products.filter(p => p.stock === 0).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 rounded-full p-3">
                <FiUser className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">District</p>
                <p className="text-lg font-bold text-gray-900">
                  {farmerInfo?.district || 'Not Set'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Products</h2>
          </div>
          <div className="overflow-x-auto">
            {products.length === 0 ? (
              <div className="text-center py-12">
                <FiPackage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
                <p className="text-gray-600 mb-4">Start by adding your first product</p>
                <button
                  onClick={handleAddProduct}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
                >
                  <FiPlus className="w-5 h-5" />
                  Add Your First Product
                </button>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img
                              className="h-10 w-10 rounded-lg object-cover"
                              src={`${API_BASE_URL}${product.imageUrl}`}
                              alt={product.name}
                              onError={(e) => {
                                e.target.src = '/placeholder-product.png';
                              }}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {product.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{product.category}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">₹{product.price}</span>
                        {product.oldPrice && product.oldPrice > product.price && (
                          <span className="text-sm text-gray-500 line-through ml-2">
                            ₹{product.oldPrice}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StockAdjuster
                          productId={product._id}
                          initialStock={product.stock}
                          onStockUpdate={handleStockUpdate}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.stock > 0
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.stock > 0 ? 'Active' : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditProduct(product._id)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          <FiEdit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Modal */}
      <Modal
        isOpen={showLowStockModal}
        onClose={() => setShowLowStockModal(false)}
        title="Low Stock Products"
        size="lg"
      >
        <div className="p-6">
          {products.filter(p => p.stock > 0 && p.stock < 10).length === 0 ? (
            <div className="text-center py-8">
              <FiAlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Low Stock Products</h3>
              <p className="text-gray-600">All your products have sufficient stock levels.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {products
                .filter(p => p.stock > 0 && p.stock < 10)
                .map((product) => (
                  <div key={product._id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-4">
                      <img
                        src={`${API_BASE_URL}${product.imageUrl}`}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover"
                        onError={(e) => {
                          e.target.src = '/placeholder-product.png';
                        }}
                      />
                      <div>
                        <h4 className="font-medium text-gray-900">{product.name}</h4>
                        <p className="text-sm text-gray-600">{product.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">₹{product.price}</p>
                      <p className="text-sm text-yellow-600 font-medium">
                        Stock: {product.stock} {product.unit}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowLowStockModal(false);
                        handleEditProduct(product._id);
                      }}
                      className="ml-4 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Update Stock
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Out of Stock Modal */}
      <Modal
        isOpen={showOutOfStockModal}
        onClose={() => setShowOutOfStockModal(false)}
        title="Out of Stock Products"
        size="lg"
      >
        <div className="p-6">
          {products.filter(p => p.stock === 0).length === 0 ? (
            <div className="text-center py-8">
              <FiXCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Out of Stock Products</h3>
              <p className="text-gray-600">All your products are in stock!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {products
                .filter(p => p.stock === 0)
                .map((product) => (
                  <div key={product._id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-4">
                      <img
                        src={`${API_BASE_URL}${product.imageUrl}`}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover"
                        onError={(e) => {
                          e.target.src = '/placeholder-product.png';
                        }}
                      />
                      <div>
                        <h4 className="font-medium text-gray-900">{product.name}</h4>
                        <p className="text-sm text-gray-600">{product.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">₹{product.price}</p>
                      <p className="text-sm text-red-600 font-medium">Out of Stock</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowOutOfStockModal(false);
                        handleEditProduct(product._id);
                      }}
                      className="ml-4 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Restock
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default FarmerDashboard;