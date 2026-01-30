// frontend/src/admin/components/FarmerManagement.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaCheck, FaTimes, FaUser, FaMapMarkerAlt, FaEnvelope, FaCalendar, FaBan, FaPhone, FaEye } from 'react-icons/fa';
import { GiFarmer } from 'react-icons/gi';
import { FiPackage } from 'react-icons/fi';
import FarmerProductsModal from './FarmerProductsModal';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const FarmerManagement = () => {
  const [pendingFarmers, setPendingFarmers] = useState([]);
  const [approvedFarmers, setApprovedFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  
  // New state for products modal
  const [productsModal, setProductsModal] = useState({
    isOpen: false,
    loading: false,
    farmerData: null
  });

  useEffect(() => {
    fetchPendingFarmers();
    fetchApprovedFarmers();
  }, []);

  const fetchPendingFarmers = async () => {
    setLoading(true);
    try {
      const token = JSON.parse(localStorage.getItem('adminSession'))?.token;
      
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      console.log('🔍 Fetching pending farmers...');
      const response = await axios.get(
        `${API_BASE_URL}/api/user/admin/farmers/pending`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('📥 Pending farmers response:', response.data);

      if (response.data.success) {
        setPendingFarmers(response.data.data);
        toast.success(`Found ${response.data.data.length} pending farmer(s)`);
      } else {
        toast.error(response.data.message || 'Failed to fetch pending farmers');
      }
    } catch (error) {
      console.error('❌ Error fetching pending farmers:', error);
      toast.error(error.response?.data?.message || 'Failed to load pending farmers');
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedFarmers = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('adminSession'))?.token;
      
      if (!token) {
        return;
      }

      console.log('🔍 Fetching approved farmers...');
      const response = await axios.get(
        `${API_BASE_URL}/api/user/admin/farmers/approved`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('📥 Approved farmers response:', response.data);

      if (response.data.success) {
        setApprovedFarmers(response.data.data);
      }
    } catch (error) {
      console.error('❌ Error fetching approved farmers:', error);
      toast.error(error.response?.data?.message || 'Failed to load approved farmers');
    }
  };

  const handleApproval = async (farmerId, action) => {
    if (!farmerId) {
      toast.error('Invalid farmer ID');
      return;
    }

    setProcessingId(farmerId);

    try {
      const token = JSON.parse(localStorage.getItem('adminSession'))?.token;

      if (!token) {
        toast.error('Authentication required');
        return;
      }

      console.log(`🔄 ${action === 'approve' ? 'Approving' : 'Rejecting'} farmer:`, farmerId);

      const response = await axios.put(
        `${API_BASE_URL}/api/user/admin/farmers/${farmerId}/approve`,
        { action },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('📥 Approval response:', response.data);

      if (response.data.success) {
        toast.success(
          action === 'approve'
            ? '✅ Farmer approved successfully!'
            : '❌ Farmer rejected successfully'
        );

        // Remove from pending list
        setPendingFarmers(prev => prev.filter(farmer => farmer._id !== farmerId));

        // If approved, refresh approved farmers list
        if (action === 'approve') {
          fetchApprovedFarmers();
        }
      } else {
        toast.error(response.data.message || 'Action failed');
      }
    } catch (error) {
      console.error('❌ Error updating farmer approval:', error);
      toast.error(error.response?.data?.message || 'Failed to update farmer status');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeactivate = async (farmerId) => {
    if (!window.confirm('Are you sure you want to deactivate this farmer? They will not be able to login.')) {
      return;
    }

    setProcessingId(farmerId);

    try {
      const token = JSON.parse(localStorage.getItem('adminSession'))?.token;

      if (!token) {
        toast.error('Authentication required');
        return;
      }

      console.log('🔄 Deactivating farmer:', farmerId);

      const response = await axios.put(
        `${API_BASE_URL}/api/user/admin/farmers/${farmerId}/deactivate`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('📥 Deactivation response:', response.data);

      if (response.data.success) {
        toast.success('Farmer deactivated successfully!');
        setApprovedFarmers(prev => prev.filter(farmer => farmer._id !== farmerId));
      } else {
        toast.error(response.data.message || 'Deactivation failed');
      }
    } catch (error) {
      console.error('❌ Error deactivating farmer:', error);
      toast.error(error.response?.data?.message || 'Failed to deactivate farmer');
    } finally {
      setProcessingId(null);
    }
  };

  // ============================================
  // NEW: VIEW FARMER PRODUCTS FUNCTIONALITY
  // ============================================
  const handleViewProducts = async (farmerId) => {
    setProductsModal({
      isOpen: true,
      loading: true,
      farmerData: null
    });

    try {
      const token = JSON.parse(localStorage.getItem('adminSession'))?.token;

      if (!token) {
        toast.error('Authentication required');
        setProductsModal({ isOpen: false, loading: false, farmerData: null });
        return;
      }

      console.log('🔍 Fetching products for farmer:', farmerId);

      const response = await axios.get(
        `${API_BASE_URL}/api/items/admin/farmer/${farmerId}/products`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('📥 Farmer products response:', response.data);

      if (response.data.success) {
        setProductsModal({
          isOpen: true,
          loading: false,
          farmerData: response.data
        });
      } else {
        toast.error(response.data.message || 'Failed to fetch products');
        setProductsModal({ isOpen: false, loading: false, farmerData: null });
      }
    } catch (error) {
      console.error('❌ Error fetching farmer products:', error);
      toast.error(error.response?.data?.message || 'Failed to load farmer products');
      setProductsModal({ isOpen: false, loading: false, farmerData: null });
    }
  };

  const closeProductsModal = () => {
    setProductsModal({
      isOpen: false,
      loading: false,
      farmerData: null
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading farmers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <GiFarmer className="text-4xl text-amber-600" />
            <h1 className="text-3xl font-bold text-gray-900">Farmer Management</h1>
          </div>
          <p className="text-gray-600">
            Review and approve farmer registrations to allow them to start selling on the platform.
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-amber-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{pendingFarmers.length}</p>
              </div>
              <div className="bg-amber-100 rounded-full p-3">
                <GiFarmer className="text-2xl text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved Farmers</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{approvedFarmers.length}</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <FaCheck className="text-2xl text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Farmers</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{pendingFarmers.length + approvedFarmers.length}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <FaUser className="text-2xl text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  activeTab === 'pending'
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pending Approvals ({pendingFarmers.length})
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  activeTab === 'approved'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Approved Farmers ({approvedFarmers.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Pending Farmers List */}
        {activeTab === 'pending' && (
          <>
            {pendingFarmers.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <GiFarmer className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Pending Approvals</h3>
                <p className="text-gray-500">All farmer registrations have been processed.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingFarmers.map((farmer) => (
                  <div
                    key={farmer._id}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                  >
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-white rounded-full p-2">
                          <FaUser className="text-amber-600 text-xl" />
                        </div>
                        <div className="text-white">
                          <h3 className="font-semibold text-lg">{farmer.name}</h3>
                          <p className="text-sm opacity-90">Farmer Registration</p>
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-start gap-2">
                        <FaEnvelope className="text-gray-400 mt-1" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="text-sm text-gray-800 break-all">{farmer.email}</p>
                        </div>
                      </div>

                      {farmer.phone && (
                        <div className="flex items-start gap-2">
                          <FaPhone className="text-gray-400 mt-1" />
                          <div className="flex-1">
                            <p className="text-xs text-gray-500">Phone</p>
                            <p className="text-sm text-gray-800">{farmer.phone}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-2">
                        <FaMapMarkerAlt className="text-gray-400 mt-1" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">District</p>
                          <p className="text-sm text-gray-800">{farmer.district || 'Not specified'}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <FaCalendar className="text-gray-400 mt-1" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">Registered On</p>
                          <p className="text-sm text-gray-800">{formatDate(farmer.createdAt)}</p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="pt-2">
                        <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                          ⏳ Pending Approval
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="border-t border-gray-200 p-4 flex gap-2">
                      <button
                        onClick={() => handleApproval(farmer._id, 'approve')}
                        disabled={processingId === farmer._id}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaCheck />
                        {processingId === farmer._id ? 'Processing...' : 'Approve'}
                      </button>

                      <button
                        onClick={() => handleApproval(farmer._id, 'reject')}
                        disabled={processingId === farmer._id}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaTimes />
                        {processingId === farmer._id ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Approved Farmers List */}
        {activeTab === 'approved' && (
          <>
            {approvedFarmers.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <GiFarmer className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Approved Farmers</h3>
                <p className="text-gray-500">No farmers have been approved yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {approvedFarmers.map((farmer) => (
                  <div
                    key={farmer._id}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                  >
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-white rounded-full p-2">
                          <FaUser className="text-green-600 text-xl" />
                        </div>
                        <div className="text-white">
                          <h3 className="font-semibold text-lg">{farmer.name}</h3>
                          <p className="text-sm opacity-90">Approved Farmer</p>
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-start gap-2">
                        <FaEnvelope className="text-gray-400 mt-1" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="text-sm text-gray-800 break-all">{farmer.email}</p>
                        </div>
                      </div>

                      {farmer.phone && (
                        <div className="flex items-start gap-2">
                          <FaPhone className="text-gray-400 mt-1" />
                          <div className="flex-1">
                            <p className="text-xs text-gray-500">Phone</p>
                            <p className="text-sm text-gray-800">{farmer.phone}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-2">
                        <FaMapMarkerAlt className="text-gray-400 mt-1" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">District</p>
                          <p className="text-sm text-gray-800">{farmer.district || 'Not specified'}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <FaCalendar className="text-gray-400 mt-1" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">Last Login</p>
                          <p className="text-sm text-gray-800">
                            {farmer.lastLogin ? formatDate(farmer.lastLogin) : 'Never'}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="pt-2">
                        <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                          ✅ Active
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="border-t border-gray-200 p-4 flex gap-2">
                      {/* NEW: View Products Button */}
                      <button
                        onClick={() => handleViewProducts(farmer._id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200"
                        title="View all products uploaded by this farmer"
                      >
                        <FaEye />
                        View Products
                      </button>

                      <button
                        onClick={() => handleDeactivate(farmer._id)}
                        disabled={processingId === farmer._id}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Deactivate farmer account"
                      >
                        <FaBan />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Farmer Products Modal */}
      <FarmerProductsModal
        isOpen={productsModal.isOpen}
        onClose={closeProductsModal}
        farmerData={productsModal.farmerData}
        loading={productsModal.loading}
      />
    </div>
  );
};

export default FarmerManagement;