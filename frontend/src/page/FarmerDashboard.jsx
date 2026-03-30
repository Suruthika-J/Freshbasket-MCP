// File: FarmerDashboard.jsx
// Path: frontend/src/page/FarmerDashboard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  FiPackage, FiPlus, FiEdit, FiTrash2, FiEye,
  FiUser, FiSave, FiAlertTriangle, FiXCircle,
  FiClipboard, FiBarChart2, FiMapPin
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import Modal from '../components/Modal';
import StockAdjuster from '../components/StockAdjuster';
import FarmerSubOrders from '../components/FarmerSubOrders';
import FarmerAnalytics from '../components/FarmerAnalytics';
import FarmerNavbar from '../components/FarmerNavbar';
import FarmerReturnManagement from '../components/FarmerReturnManagement';
import { FiRefreshCw } from 'react-icons/fi';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const FarmerDashboard = () => {
  const { t } = useTranslation('farmer');
  const navigate = useNavigate();
  const location = useLocation();
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
  const [activeTab, setActiveTab] = useState('products'); // products, orders, analytics

  useEffect(() => {
    fetchFarmerProducts();
    fetchFarmerInfo();

    // Handle initial state from navigation
    if (location.state?.tab) setActiveTab(location.state.tab);
    if (location.state?.openProfile) setShowProfileEdit(true);

    // Listen for tab switch events from profile dropdown
    const handleTabSwitch = (e) => {
      if (e.detail === 'profile') {
        setShowProfileEdit(true);
        // If profile edit is opened, scroll to it smoothly
        setTimeout(() => {
          document.getElementById('profile-edit-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else if (e.detail) {
        setActiveTab(e.detail);
        setShowProfileEdit(false);
      }
    };
    window.addEventListener('switchFarmerTab', handleTabSwitch);
    return () => window.removeEventListener('switchFarmerTab', handleTabSwitch);
  }, [location]);

  const fetchFarmerInfo = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        handleLogout();
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const user = response.data.data;
        setFarmerInfo(user);
        setProfileForm({
          certification: user.certification || 'None',
          experience: user.experience || '',
          district: user.district || ''
        });
      }
    } catch (error) {
      console.error('Error fetching farmer info:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        handleLogout();
      }
    }
  };

  const fetchFarmerProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE_URL}/api/products/farmer-products`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setProducts(response.data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
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
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Profile updated successfully!');
        setFarmerInfo(response.data.user);
        setShowProfileEdit(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
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
      toast.error('Failed to delete product');
    }
  };

  const handleStockUpdate = (productId, newStock) => {
    setProducts(prevProducts =>
      prevProducts.map(product =>
        product._id === productId ? { ...product, stock: newStock } : product
      )
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('userRole');
    window.dispatchEvent(new Event('authStateChanged'));
    navigate('/', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <FarmerNavbar farmerInfo={farmerInfo} />
        <div className="flex items-center justify-center p-20 text-center">
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-500 font-medium">{t('common.loading') || 'Loading Farmer Portal...'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <FarmerNavbar farmerInfo={farmerInfo} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              {t('dashboard.welcome', { name: farmerInfo?.name || 'Farmer' })}
            </h1>
            <p className="text-gray-500 font-medium mt-1">Manage your harvests and track your growth.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowProfileEdit(!showProfileEdit)}
              className="bg-white px-5 py-2.5 rounded-xl font-bold text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
            >
              <FiUser className="text-green-600" />
              {showProfileEdit ? 'Hide Details' : 'View Profile'}
            </button>
            <button
              onClick={() => navigate('/farmer/add-product')}
              className="bg-green-600 px-6 py-2.5 rounded-xl font-bold text-white hover:bg-green-700 transition-all flex items-center gap-2 shadow-lg shadow-green-100"
            >
              <FiPlus className="w-5 h-5" />
              {t('navbar.addUpdateProducts')}
            </button>
          </div>
        </div>

        {/* Profile Edit Modal-like Section */}
        {showProfileEdit && (
          <div id="profile-edit-section" className="mb-8 animate-in slide-in-from-top-4 duration-300">
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-green-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <FiUser className="w-32 h-32" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3">
                <span className="bg-green-100 p-2 rounded-lg"><FiUser className="text-green-600" /></span>
                {t('dashboard.profile.editTitle')}
              </h2>
              <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                    {t('dashboard.profile.certification')}
                  </label>
                  <select
                    value={profileForm.certification}
                    onChange={(e) => setProfileForm({ ...profileForm, certification: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-green-500 transition-all font-semibold"
                    required
                  >
                    <option value="Organic">Organic</option>
                    <option value="FSSAI">FSSAI</option>
                    <option value="None">None</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                    {t('dashboard.profile.experience')}
                  </label>
                  <input
                    type="number"
                    value={profileForm.experience}
                    onChange={(e) => setProfileForm({ ...profileForm, experience: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-green-500 transition-all font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                    {t('dashboard.profile.district')}
                  </label>
                  <input
                    type="text"
                    value={profileForm.district}
                    onChange={(e) => setProfileForm({ ...profileForm, district: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-green-500 transition-all font-semibold"
                    required
                  />
                </div>
                <div className="md:col-span-3 flex justify-end gap-3 mt-4">
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="bg-green-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-green-100 hover:bg-green-700 transition-all disabled:opacity-50"
                  >
                    {profileLoading ? t('dashboard.profile.saving') : t('dashboard.profile.save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard
            icon={FiPackage}
            label={t('dashboard.stats.totalProducts')}
            value={products.length}
            color="green"
          />
          <StatCard
            icon={FiEye}
            label={t('dashboard.stats.activeProducts')}
            value={products.filter(p => p.stock > 0).length}
            color="blue"
          />
          <StatCard
            icon={FiAlertTriangle}
            label={t('dashboard.stats.lowStock')}
            value={products.filter(p => p.stock > 0 && p.stock < 10).length}
            color="orange"
            onClick={() => setShowLowStockModal(true)}
          />
          <StatCard
            icon={FiXCircle}
            label={t('dashboard.stats.outOfStock')}
            value={products.filter(p => p.stock === 0).length}
            color="red"
            onClick={() => setShowOutOfStockModal(true)}
          />
          <StatCard
            icon={FiMapPin}
            label={t('dashboard.stats.district')}
            value={farmerInfo?.district || '-'}
            color="purple"
          />
        </div>

        {/* Main Content Tabs */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100 p-2 gap-2 bg-gray-50/50">
            <TabButton
              active={activeTab === 'products'}
              onClick={() => setActiveTab('products')}
              icon={FiPackage}
              label={t('dashboard.tabs.myProducts')}
            />
            <TabButton
              active={activeTab === 'orders'}
              onClick={() => setActiveTab('orders')}
              icon={FiClipboard}
              label={t('dashboard.tabs.myOrders')}
            />
            <TabButton
              active={activeTab === 'returns'}
              onClick={() => setActiveTab('returns')}
              icon={FiRefreshCw}
              label="Returns"
            />
            <TabButton
              active={activeTab === 'analytics'}
              onClick={() => setActiveTab('analytics')}
              icon={FiBarChart2}
              label={t('dashboard.tabs.analytics')}
            />
          </div>

          <div className="p-6">
            {activeTab === 'products' && (
              <div className="animate-in fade-in duration-500">
                {products.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FiPackage className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">No products listed</h3>
                    <p className="text-gray-500 mt-2">Start your digital farm by adding your first crop.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-50">
                          <th className="pb-4 pt-2">Product Details</th>
                          <th className="pb-4 pt-2">Category</th>
                          <th className="pb-4 pt-2">Price</th>
                          <th className="pb-4 pt-2">Inventory</th>
                          <th className="pb-4 pt-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {products.map(product => (
                          <tr key={product._id} className="group hover:bg-gray-50/50 transition-colors">
                            <td className="py-5">
                              <div className="flex items-center gap-4">
                                <img
                                  src={`${API_BASE_URL}${product.imageUrl}`}
                                  className="w-12 h-12 rounded-xl object-cover shadow-sm bg-gray-100"
                                  alt={product.name}
                                />
                                <div>
                                  <p className="font-bold text-gray-900">{product.name}</p>
                                  <p className="text-xs text-gray-500 truncate max-w-[200px]">{product.description}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-5">
                              <span className="px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-black text-gray-600 uppercase">
                                {product.category}
                              </span>
                            </td>
                            <td className="py-5">
                              <p className="font-bold text-gray-900">₹{product.price}</p>
                            </td>
                            <td className="py-5">
                              <StockAdjuster
                                productId={product._id}
                                initialStock={product.stock}
                                onStockUpdate={handleStockUpdate}
                              />
                            </td>
                            <td className="py-5 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => navigate(`/farmer/edit-product/${product._id}`)}
                                  className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all shadow-sm"
                                >
                                  <FiEdit />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(product._id)}
                                  className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                >
                                  <FiTrash2 />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'orders' && <FarmerSubOrders />}
            {activeTab === 'returns' && <FarmerReturnManagement />}
            {activeTab === 'analytics' && <FarmerAnalytics />}
          </div>
        </div>
      </main>

      {/* Modals */}
      <Modal
        isOpen={showLowStockModal}
        onClose={() => setShowLowStockModal(false)}
        title="Low Stock Warning"
        size="lg"
      >
        <div className="p-6 space-y-4">
          {products.filter(p => p.stock > 0 && p.stock < 10).map(product => (
            <div key={product._id} className="flex items-center justify-between p-4 bg-orange-50 rounded-2xl border border-orange-100">
              <div className="flex items-center gap-4">
                <img src={`${API_BASE_URL}${product.imageUrl}`} className="w-12 h-12 rounded-xl object-cover" />
                <div>
                  <p className="font-bold text-gray-900">{product.name}</p>
                  <p className="text-xs text-orange-600 font-bold uppercase">Stock: {product.stock}</p>
                </div>
              </div>
              <button onClick={() => { setShowLowStockModal(false); navigate(`/farmer/edit-product/${product._id}`); }} className="bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-orange-700">Update</button>
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        isOpen={showOutOfStockModal}
        onClose={() => setShowOutOfStockModal(false)}
        title="Out of Stock Items"
        size="lg"
      >
        <div className="p-6 space-y-4">
          {products.filter(p => p.stock === 0).map(product => (
            <div key={product._id} className="flex items-center justify-between p-4 bg-red-50 rounded-2xl border border-red-100">
              <div className="flex items-center gap-4">
                <img src={`${API_BASE_URL}${product.imageUrl}`} className="w-12 h-12 rounded-xl object-cover" />
                <div>
                  <p className="font-bold text-gray-900">{product.name}</p>
                  <p className="text-xs text-red-600 font-bold uppercase tracking-tight">Requires Immediate Restock</p>
                </div>
              </div>
              <button onClick={() => { setShowOutOfStockModal(false); navigate(`/farmer/edit-product/${product._id}`); }} className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-red-700 transition-all">Restock</button>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

// Internal Components for cleaner code
const StatCard = ({ icon: Icon, label, value, color, onClick }) => {
  const colors = {
    green: 'bg-green-50 text-green-600 shadow-green-100',
    blue: 'bg-blue-50 text-blue-600 shadow-blue-100',
    orange: 'bg-orange-50 text-orange-600 shadow-orange-100',
    red: 'bg-red-50 text-red-600 shadow-red-100',
    purple: 'bg-purple-50 text-purple-600 shadow-purple-100'
  };
  return (
    <div
      onClick={onClick}
      className={`bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm transition-all hover:scale-[1.02] ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${colors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-gray-900 mt-1">{value}</p>
    </div>
  );
};

const TabButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl text-sm font-bold transition-all ${active
      ? 'bg-white text-green-600 shadow-xl shadow-green-50 z-10 scale-105'
      : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
      }`}
  >
    <Icon className={`w-4 h-4 ${active ? 'text-green-600' : 'text-gray-300'}`} />
    {label}
  </button>
);

export default FarmerDashboard;