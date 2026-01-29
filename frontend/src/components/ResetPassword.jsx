// frontend/src/components/ResetPassword.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { FaArrowLeft, FaLock, FaEye, FaEyeSlash, FaCheck } from 'react-icons/fa';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resetToken = location.state?.resetToken;
  const email = location.state?.email;

  useEffect(() => {
    if (!resetToken) {
      navigate('/forgot-password');
    }
  }, [resetToken, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validate = () => {
    if (!formData.newPassword) {
      setError('Password is required');
      return false;
    }

    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await axios.post(
        'http://localhost:4000/api/user/reset-password',
        {
          resetToken,
          newPassword: formData.newPassword
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (res.data.success) {
        setSuccess('Password reset successfully!');
        
        // Redirect to login page after password reset
        setTimeout(() => {
          navigate('/login', { 
            replace: true,
            state: { 
              passwordReset: true,
              message: 'Password reset successful! Please login with your new password.'
            } 
          });
        }, 2000);
      } else {
        setError(res.data.message || 'Failed to reset password');
      }
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.message);
      } else {
        setError('Server error. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-50 to-purple-100 flex items-center justify-center p-4">
      <Link 
        to="/login" 
        className="fixed top-6 left-6 flex items-center text-green-600 hover:text-green-800 transition-colors"
      >
        <FaArrowLeft className="mr-2" />
        Back to Login
      </Link>

      {/* Success Toast */}
      {success && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center">
          <FaCheck className="mr-2" />
          {success}
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-br from-green-500 to-blue-500 p-4 rounded-full">
            <FaLock className="text-white text-4xl" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Reset Password
        </h2>
        <p className="text-gray-600 text-center mb-8">
          {email ? `Set a new password for ${email}` : 'Create a strong new password'}
        </p>

        <form onSubmit={handleSubmit}>
          {/* New Password Field */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              New Password
            </label>
            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter new password"
                disabled={isLoading}
                className="w-full pl-12 pr-12 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none transition-colors disabled:bg-gray-100"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
          </div>

          {/* Confirm Password Field */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                disabled={isLoading}
                className="w-full pl-12 pr-12 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none transition-colors disabled:bg-gray-100"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isLoading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>

        {/* Security Tips */}
        <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <p className="text-sm text-blue-800 font-semibold mb-2">
            🔒 Password Tips:
          </p>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Use a mix of letters, numbers, and symbols</li>
            <li>• Avoid common words or personal information</li>
            <li>• Make it at least 8 characters long</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;