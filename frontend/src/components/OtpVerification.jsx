// frontend/src/components/OtpVerification.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaCheck, FaEnvelope } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const OtpVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(300); // 5 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  const email = location.state?.email;
  const purpose = location.state?.purpose || 'signup';
  const role = location.state?.role || 'user';
  const intendedRole = location.state?.intendedRole || 'customer';

  useEffect(() => {
    if (!email) {
      toast.error('Email not provided. Redirecting to signup...', {
        position: "top-center",
      });
      navigate('/signup');
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
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
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
      toast.error('Please enter complete 6-digit OTP', {
        position: "top-center",
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/user/verify-otp`,
        { email, otp: otpString },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (res.data.success) {
        toast.success('Email verified successfully!', {
          position: "top-center",
          autoClose: 2000,
        });
        
        // ========== ROLE-BASED REDIRECT ==========
        // For farmer signup, redirect to pending approval page
        if (intendedRole === 'farmer' || role === 'farmer') {
          setTimeout(() => {
            navigate('/farmer-pending-approval', { replace: true });
          }, 1000);
        } else {
          // For regular users, redirect to login
          setTimeout(() => {
            navigate('/login', { 
              replace: true,
              state: { 
                message: 'Account created successfully! Please login.',
                intendedRole: intendedRole 
              } 
            });
          }, 1000);
        }
      } else {
        toast.error(res.data.message || 'Verification failed', {
          position: "top-center",
        });
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      
      let errorMessage = 'Verification failed. Please try again.';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      toast.error(errorMessage, {
        position: "top-center",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setIsLoading(true);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/user/resend-signup-otp`,
        { email },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (res.data.success) {
        toast.success('New OTP sent to your email!', {
          position: "top-center",
        });
        setTimer(300);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        toast.error(res.data.message || 'Failed to resend OTP', {
          position: "top-center",
        });
      }
    } catch (err) {
      console.error('Resend OTP error:', err);
      
      let errorMessage = 'Failed to resend OTP';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      toast.error(errorMessage, {
        position: "top-center",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 flex items-center justify-center p-4">
      <Link 
        to="/signup" 
        className="fixed top-6 left-6 flex items-center text-purple-600 hover:text-purple-800 transition-colors z-10"
      >
        <FaArrowLeft className="mr-2" />
        Back to Signup
      </Link>

      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full transform transition-all duration-300 hover:scale-105">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-full shadow-lg">
            <FaEnvelope className="text-white text-4xl" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Verify Your Email
        </h2>
        <p className="text-gray-600 text-center mb-6">
          We've sent a 6-digit code to<br />
          <span className="font-semibold text-purple-600">{email}</span>
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
                className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none transition-colors disabled:bg-gray-100"
              />
            ))}
          </div>

          {/* Timer */}
          <div className="text-center mb-4">
            {timer > 0 ? (
              <p className="text-gray-600">
                Code expires in <span className="font-semibold text-purple-600">{formatTime(timer)}</span>
              </p>
            ) : (
              <p className="text-red-500 font-semibold">OTP Expired</p>
            )}
          </div>

          {/* Verify Button */}
          <button
            type="submit"
            disabled={isLoading || otp.join('').length !== 6}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/50 transform hover:scale-105"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </span>
            ) : (
              'Verify Email'
            )}
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
                className="text-purple-600 font-semibold hover:underline disabled:opacity-50"
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

export default OtpVerification;