// frontend/src/page/FarmerPendingApproval.jsx
// DEBUG VERSION - Replace with this to test navigation

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiClock, FiHome, FiCheckCircle } from 'react-icons/fi';
import { GiFarmer } from 'react-icons/gi';

const FarmerPendingApproval = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    console.log('🏠 Go Home button clicked!');
    console.log('Current auth state:', {
      token: localStorage.getItem('authToken'),
      role: localStorage.getItem('userRole'),
      userData: localStorage.getItem('userData')
    });
    
    // Show toast notification
    toast.info('Redirecting to home page...', {
      position: "top-center",
      autoClose: 1500,
    });
    
    // Clear farmer session data since they're not approved yet
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('userRole');
    
    // Dispatch auth change event
    window.dispatchEvent(new Event('authStateChanged'));
    
    console.log('Auth data cleared, navigating to home...');
    
    // Navigate to home page with slight delay
    setTimeout(() => {
      navigate('/', { replace: true });
      console.log('Navigation executed');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      {/* Decorative circles */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-amber-200 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-orange-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '700ms' }}></div>
      <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-yellow-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1000ms' }}></div>

      {/* Main Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden transform transition-all duration-500 hover:scale-105">
        {/* Header Section with Gradient */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg animate-bounce">
              <GiFarmer className="w-14 h-14 text-amber-600" />
            </div>
            <h1 className="text-3xl font-bold text-center mb-2">
              Welcome to FreshBasket!
            </h1>
            <p className="text-amber-100 text-center text-lg">
              Farmer Registration Received
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8 space-y-6">
          {/* Status Badge */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-amber-100 border-2 border-amber-300 rounded-full">
              <FiClock className="w-5 h-5 text-amber-600 animate-spin" style={{ animationDuration: '3s' }} />
              <span className="font-semibold text-amber-800">Pending Admin Approval</span>
            </div>
          </div>

          {/* Message Box */}
          <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-lg">
            <h3 className="font-bold text-gray-800 text-lg mb-3 flex items-center gap-2">
              <FiCheckCircle className="text-amber-600" />
              What's Next?
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Thank you for registering as a farmer on FreshBasket! Your account has been successfully created and is currently under review by our admin team.
            </p>
            <p className="text-gray-700 leading-relaxed">
              You will receive an email notification once your account is approved. After approval, you'll be able to:
            </p>
          </div>

          {/* Features List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">1</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800">List Your Products</p>
                <p className="text-sm text-gray-600">Add and manage your farm produce</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">2</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800">Manage Orders</p>
                <p className="text-sm text-gray-600">Track and fulfill customer orders</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">3</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800">Set Your Prices</p>
                <p className="text-sm text-gray-600">Control pricing and inventory</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">4</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800">Direct Sales</p>
                <p className="text-sm text-gray-600">Sell directly to customers</p>
              </div>
            </div>
          </div>

          {/* Estimated Time */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              ⏱️ <span className="font-semibold">Estimated approval time:</span> 24-48 hours
            </p>
          </div>

          {/* Debug Info (Remove in production) */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800 font-mono">
              DEBUG: Click button to test navigation
            </p>
          </div>

          {/* Action Button */}
          <div className="pt-4">
            <button
              onClick={handleGoHome}
              className="w-full group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-emerald-500/50 transform hover:scale-105 transition-all duration-300"
            >
              <FiHome className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span>Go to Home Page</span>
            </button>
          </div>

          {/* Alternative Navigation (for testing) */}
          <div className="pt-2">
            <a
              href="/"
              className="w-full group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-gray-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-gray-500/50 transform hover:scale-105 transition-all duration-300"
            >
              <FiHome className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span>Alternative: Go Home (href)</span>
            </a>
          </div>

          {/* Contact Support */}
          <div className="text-center pt-4">
            <p className="text-sm text-gray-500">
              Questions? Contact us at{' '}
              <a href="mailto:support@freshbasket.com" className="text-amber-600 hover:text-amber-700 font-semibold">
                support@freshbasket.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmerPendingApproval;