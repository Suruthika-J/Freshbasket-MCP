// /frontend/src/components/ProfileSettings.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaLock,
  FaEdit,
  FaSave,
  FaTimes,
  FaShoppingBag,
  FaCalendarAlt,
  FaEye,
  FaEyeSlash,
  FaQuestionCircle,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';
import axios from 'axios';

const ProfileSettings = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState(null);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isLoadingForgotPassword, setIsLoadingForgotPassword] = useState(false);
  
  // Form states
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    lastOrderDate: null
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUserData = localStorage.getItem('userData');
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          navigate('/login');
          return;
        }

        if (storedUserData) {
          const parsedData = JSON.parse(storedUserData);
          setUserData(parsedData);
          setEditForm({
            name: parsedData.name || '',
            email: parsedData.email || '',
            phone: parsedData.phone || ''
          });
          setForgotPasswordEmail(parsedData.email || '');
          
          // Fetch order statistics (mock data - replace with actual API call)
          setOrderStats({
            totalOrders: 12,
            completedOrders: 10,
            lastOrderDate: '2025-01-10'
          });
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [navigate]);

  // Handle field editing
  const handleEdit = (field) => {
    setEditingField(field);
    setErrors({});
    setSuccess('');
  };

  const handleCancel = () => {
    setEditingField(null);
    if (userData) {
      setEditForm({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || ''
      });
    }
    setErrors({});
  };

  const handleSave = async (field) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      // Validate the field
      if (!editForm[field].trim()) {
        setErrors({ [field]: `${field.charAt(0).toUpperCase() + field.slice(1)} is required` });
        return;
      }

      if (field === 'email' && !/\S+@\S+\.\S+/.test(editForm[field])) {
        setErrors({ email: 'Invalid email format' });
        return;
      }

      if (field === 'phone' && !/^\d{10}$/.test(editForm[field].replace(/\D/g, ''))) {
        setErrors({ phone: 'Phone number must be 10 digits' });
        return;
      }

      // Mock API call - replace with actual endpoint
      const response = await axios.put(
        'http://localhost:4000/api/user/update-profile',
        { [field]: editForm[field] },
        { headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        }}
      );

      if (response.data.success) {
        const updatedUserData = { ...userData, [field]: editForm[field] };
        setUserData(updatedUserData);
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
        setEditingField(null);
        setSuccess(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully!`);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      setErrors({ [field]: 'Failed to update. Please try again.' });
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validate passwords
    if (passwordForm.newPassword.length < 6) {
      setErrors({ password: 'Password must be at least 6 characters long' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrors({ password: 'New passwords do not match' });
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.put(
        'http://localhost:4000/api/user/change-password',
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        },
        { headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        }}
      );

      if (response.data.success) {
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordForm(false);
        setSuccess('Password changed successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      setErrors({ password: error.response?.data?.message || 'Failed to change password' });
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setErrors({});
    
    if (!forgotPasswordEmail.trim()) {
      setErrors({ forgotPassword: 'Email is required' });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(forgotPasswordEmail)) {
      setErrors({ forgotPassword: 'Please enter a valid email address' });
      return;
    }

    setIsLoadingForgotPassword(true);

    try {
      const response = await axios.post(
        'http://localhost:4000/api/user/forgot-password',
        { email: forgotPasswordEmail },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data.success) {
        setSuccess('Password reset code sent to your email! Please check your inbox.');
        setShowForgotPasswordModal(false);
        setForgotPasswordEmail(userData?.email || '');
        setTimeout(() => setSuccess(''), 5000);
        
        // Optionally redirect to OTP verification page
        // navigate('/verify-forgot-otp', { 
        //   state: { 
        //     email: response.data.email || forgotPasswordEmail,
        //     purpose: 'forgot-password'
        //   } 
        // });
      } else {
        setErrors({ forgotPassword: response.data.message || 'Failed to send reset code' });
      }
    } catch (error) {
      if (error.response && error.response.data) {
        setErrors({ forgotPassword: error.response.data.message });
      } else {
        setErrors({ forgotPassword: 'Server error. Please try again.' });
      }
    } finally {
      setIsLoadingForgotPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Please log in to view profile settings</h2>
          <Link to="/login" className="bg-emerald-500 hover:bg-emerald-600 px-6 py-2 rounded-lg transition-colors">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link 
            to="/" 
            className="flex items-center text-emerald-400 hover:text-emerald-300 transition-colors mr-4"
          >
            <FaArrowLeft className="mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <FaUser className="mr-3 text-emerald-400" />
                Personal Information
              </h2>

              {/* Name Field */}
              <div className="mb-6">
                <label className="block text-gray-300 mb-2">Full Name</label>
                <div className="flex items-center">
                  {editingField === 'name' ? (
                    <div className="flex-1 flex items-center space-x-2">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-emerald-400 focus:outline-none"
                      />
                      <button
                        onClick={() => handleSave('name')}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg transition-colors"
                      >
                        <FaSave />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition-colors"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-white">{userData.name}</span>
                      <button
                        onClick={() => handleEdit('name')}
                        className="text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        <FaEdit />
                      </button>
                    </div>
                  )}
                </div>
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Email Field */}
              <div className="mb-6">
                <label className="block text-gray-300 mb-2">Email Address</label>
                <div className="flex items-center">
                  {editingField === 'email' ? (
                    <div className="flex-1 flex items-center space-x-2">
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                        className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-emerald-400 focus:outline-none"
                      />
                      <button
                        onClick={() => handleSave('email')}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg transition-colors"
                      >
                        <FaSave />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition-colors"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-white">{userData.email}</span>
                      <button
                        onClick={() => handleEdit('email')}
                        className="text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        <FaEdit />
                      </button>
                    </div>
                  )}
                </div>
                {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
              </div>
              {/* Phone Field */}
              <div className="mb-6">
                <label className="block text-gray-300 mb-2">Phone Number</label>
                <div className="flex items-center">
                  {editingField === 'phone' ? (
                    <div className="flex-1 flex items-center space-x-2">
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                        className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-emerald-400 focus:outline-none"
                      />
                      <button
                        onClick={() => handleSave('phone')}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg transition-colors"
                      >
                        <FaSave />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition-colors"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-white">{userData.phone || 'Not provided'}</span>
                      <button
                        onClick={() => handleEdit('phone')}
                        className="text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        <FaEdit />
                      </button>
                    </div>
                  )}
                </div>
                {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone}</p>}
              </div>
              {/* Current Location */}
              <div className="mb-6">
                <label className="block text-gray-300 mb-2">Current Location</label>
                <div className="flex items-center text-white">
                  <FaMapMarkerAlt className="mr-3 text-emerald-400" />
                  <span>Tamil Nadu, IN</span>
                </div>
              </div>
              {/* Account Created Date */}
              <div className="mb-6">
                <label className="block text-gray-300 mb-2">Account Created</label>
                <div className="flex items-center text-white">
                  <FaCalendarAlt className="mr-3 text-emerald-400" />
                  <span>{new Date(userData.createdAt || '2024-01-01').toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
              </div>
            </div>

            {/* Password Change Section */}
            <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <FaLock className="mr-3 text-emerald-400" />
                  Security
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Change Password
                  </button>
                  <button
                    onClick={() => {
                      setShowForgotPasswordModal(true);
                      setShowPasswordForm(false);
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Reset Password with OTP
                  </button>
                </div>
              </div>

              {showPasswordForm && (
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-gray-300 mb-2">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-emerald-400 focus:outline-none pr-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                      >
                        {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-emerald-400 focus:outline-none pr-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                      >
                        {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-emerald-400 focus:outline-none"
                      required
                    />
                  </div>

                  {errors.password && <p className="text-red-400 text-sm">{errors.password}</p>}

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      Update Password
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        setErrors({});
                      }}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Statistics */}
            <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <FaShoppingBag className="mr-3 text-emerald-400" />
                Order Statistics
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Total Orders:</span>
                  <span className="text-emerald-400 font-semibold">{orderStats.totalOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Completed:</span>
                  <span className="text-green-400 font-semibold">{orderStats.completedOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Last Order:</span>
                  <span className="text-white text-sm">{orderStats.lastOrderDate}</span>
                </div>
              </div>
              <Link 
                to="/myorders" 
                className="block w-full bg-emerald-500 hover:bg-emerald-600 text-white text-center py-2 rounded-lg transition-colors mt-4"
              >
                View All Orders
              </Link>
            </div>

            {/* FAQ Section */}
            <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
              <button
                onClick={() => setShowFAQ(!showFAQ)}
                className="w-full flex items-center justify-between text-white text-lg font-semibold mb-4"
              >
                <div className="flex items-center">
                  <FaQuestionCircle className="mr-3 text-emerald-400" />
                  FAQs
                </div>
                {showFAQ ? <FaChevronUp /> : <FaChevronDown />}
              </button>

              {showFAQ && (
                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="text-emerald-400 font-semibold mb-2">
                      What happens when I update my email address?
                    </h4>
                    <p className="text-gray-300 leading-relaxed">
                      Your login email ID changes accordingly. You'll receive all account-related communications on your updated email address.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-emerald-400 font-semibold mb-2">
                      When will my account be updated with the new email?
                    </h4>
                    <p className="text-gray-300 leading-relaxed">
                      It happens as soon as you confirm the verification code sent to your email and save the changes.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-emerald-400 font-semibold mb-2">
                      What happens to my existing account when I update my email?
                    </h4>
                    <p className="text-gray-300 leading-relaxed">
                      Your account remains fully functional. You'll continue seeing your order history, saved information, and personal details.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-emerald-400 font-semibold mb-2">
                      Does updating email affect other accounts?
                    </h4>
                    <p className="text-gray-300 leading-relaxed">
                      We use a 'single sign-on' policy. Changes will reflect across all associated accounts.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Forgot Password Modal */}
        {showForgotPasswordModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <FaLock className="mr-3 text-emerald-400" />
                  Reset Password
                </h3>
                <button
                  onClick={() => {
                    setShowForgotPasswordModal(false);
                    setForgotPasswordEmail(userData?.email || '');
                    setErrors({});
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>

              <p className="text-gray-300 mb-6">
                Enter your email address and we'll send you a verification code to reset your password.
              </p>

              <form onSubmit={handleForgotPassword}>
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">Email Address</label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => {
                        setForgotPasswordEmail(e.target.value);
                        setErrors({});
                      }}
                      placeholder="Enter your email address"
                      disabled={isLoadingForgotPassword}
                      className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-emerald-400 focus:outline-none transition-colors disabled:bg-gray-600"
                    />
                  </div>
                  {errors.forgotPassword && (
                    <p className="text-red-400 text-sm mt-2">{errors.forgotPassword}</p>
                  )}
                </div>

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={isLoadingForgotPassword}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingForgotPassword ? 'Sending...' : 'Send Reset Code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPasswordModal(false);
                      setForgotPasswordEmail(userData?.email || '');
                      setErrors({});
                    }}
                    disabled={isLoadingForgotPassword}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSettings;