// frontend/src/page/FarmerPendingApproval.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiClock, FiHome } from 'react-icons/fi';
import { GiFarmer } from 'react-icons/gi';

const FarmerPendingApproval = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    toast.info('Redirecting to home page...', {
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

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center px-4">
      <div className="bg-white max-w-xl w-full rounded-xl shadow-md border border-green-200">

        {/* Header */}
        <div className="flex flex-col items-center text-center p-8 border-b border-green-200">
          
          {/* Jumping Farmer */}
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <GiFarmer className="text-green-700 w-10 h-10 animate-bounce" />
          </div>

          <h1 className="text-2xl font-semibold text-green-800">
            Farmer Registration Submitted
          </h1>
          <p className="text-green-600 mt-2">
            Your account is under review
          </p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">

          {/* Rotating Clock Status */}
          <div className="flex justify-center">
            <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-green-100 border border-green-300">
              <FiClock className="text-green-700 animate-spin-slow" />
              <span className="text-sm font-medium text-green-800">
                Pending Admin Approval
              </span>
            </div>
          </div>

          {/* Message */}
          <div className="text-green-800 text-sm leading-relaxed">
            <p className="mb-3">
              Thank you for registering as a farmer on{' '}
              <span className="font-medium">FreshBasket</span>.
              Your details have been successfully submitted.
            </p>
            <p>
              Our admin team is currently reviewing your application. You will
              receive an email once your account is approved.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {[
              'List your farm products',
              'Manage customer orders',
              'Control pricing & stock',
              'Sell directly to customers',
            ].map((item, index) => (
              <div
                key={index}
                className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-800"
              >
                {item}
              </div>
            ))}
          </div>

          {/* Time Info */}
          <div className="text-center text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg py-3">
            ⏱️ Estimated approval time:{' '}
            <span className="font-medium">24 – 48 hours</span>
          </div>

          {/* Action Button */}
          <button
            onClick={handleGoHome}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-green-700 text-white font-medium hover:bg-green-800 transition"
          >
            <FiHome />
            Go to Home Page
          </button>

          {/* Support */}
          <p className="text-center text-xs text-green-600">
            Need help? Contact us at{' '}
            <a
              href="mailto:quickcommerceapp@gmail.com"
              className="text-green-800 font-medium hover:underline"
            >
              quickcommerceapp@gmail.com
            </a>
          </p>
        </div>
      </div>

      {/* Custom slow spin animation */}
      <style>
        {`
          .animate-spin-slow {
            animation: spin 3s linear infinite;
          }
        `}
      </style>
    </div>
  );
};

export default FarmerPendingApproval;
