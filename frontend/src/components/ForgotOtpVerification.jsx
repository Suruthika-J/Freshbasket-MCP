// frontend/src/components/ForgotOtpVerification.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { FaArrowLeft, FaCheck, FaShieldAlt } from 'react-icons/fa';

const ForgotOtpVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
      return;
    }

    // Timer countdown
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [email, navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split('');
    setOtp([...newOtp, ...Array(6 - newOtp.length).fill('')]);
    
    const nextEmptyIndex = newOtp.length < 6 ? newOtp.length : 5;
    inputRefs.current[nextEmptyIndex]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter complete 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await axios.post(
        'http://localhost:4000/api/user/verify-forgot-otp',
        { email, otp: otpString },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (res.data.success) {
        setSuccess('OTP verified! Redirecting...');
        
        // Navigate to reset password page with token
        setTimeout(() => {
          navigate('/reset-password', { 
            state: { 
              resetToken: res.data.resetToken,
              email: email
            } 
          });
        }, 1500);
      } else {
        setError(res.data.message || 'Verification failed');
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

  const handleResend = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await axios.post(
        'http://localhost:4000/api/user/forgot-password',
        { email },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (res.data.success) {
        setSuccess('New OTP sent to your email!');
        setTimer(300);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setError(res.data.message || 'Failed to resend OTP');
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
    <div className="min-h-screen bg-gradient-to-br from-red-100 via-pink-50 to-purple-100 flex items-center justify-center p-4">
      <Link 
        to="/forgot-password" 
        className="fixed top-6 left-6 flex items-center text-red-600 hover:text-red-800 transition-colors"
      >
        <FaArrowLeft className="mr-2" />
        Back
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
          <div className="bg-gradient-to-br from-red-500 to-pink-500 p-4 rounded-full">
            <FaShieldAlt className="text-white text-4xl" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Verify Reset Code
        </h2>
        <p className="text-gray-600 text-center mb-6">
          Enter the 6-digit code sent to<br />
          <span className="font-semibold text-red-600">{email}</span>
        </p>

        <form onSubmit={handleSubmit}>
          {/* OTP Input Boxes */}
          <div className="flex justify-center gap-2 mb-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                disabled={isLoading}
                className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none transition-colors disabled:bg-gray-100"
              />
            ))}
          </div>

          {/* Timer */}
          <div className="text-center mb-4">
            {timer > 0 ? (
              <p className="text-gray-600">
                Code expires in <span className="font-semibold text-red-600">{formatTime(timer)}</span>
              </p>
            ) : (
              <p className="text-red-500 font-semibold">OTP Expired</p>
            )}
          </div>

          {/* Verify Button */}
          <button
            type="submit"
            disabled={isLoading || otp.join('').length !== 6}
            className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-red-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>

        {/* Resend OTP */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Didn't receive the code?{' '}
            {canResend ? (
              <button
                onClick={handleResend}
                disabled={isLoading}
                className="text-red-600 font-semibold hover:underline disabled:opacity-50"
              >
                Resend OTP
              </button>
            ) : (
              <span className="text-gray-400">Resend available after timer expires</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotOtpVerification;