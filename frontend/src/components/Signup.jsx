// frontend/src/components/Signup.jsx
// UPDATED VERSION with Pincode-based District Auto-fetch
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaArrowLeft,
  FaEnvelope,
  FaStore,
  FaMapMarkerAlt,
} from 'react-icons/fa';
import { GiFarmer } from 'react-icons/gi';
import { signupStyles } from '../assets/dummyStyles';
import GoogleLoginButton from './GoogleLoginButton';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const Signup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  
  // Track intended role from location state
  const [intendedRole, setIntendedRole] = useState(
    location.state?.intendedRole || 'customer'
  );
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    pincode: '', // For farmers
    city: '', // Auto-filled from pincode
    district: '', // Auto-filled from pincode
    state: '', // Auto-filled from pincode
    certification: 'None',
    experience: '',
    remember: false,
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);

  // Auto-fetch location when pincode changes (only for farmers)
  useEffect(() => {
    let timeoutId;
    
    if (intendedRole === 'farmer' && formData.pincode.length === 6) {
      setFetchingLocation(true);
      
      // Debounce the API call
      timeoutId = setTimeout(() => {
        fetchLocationByPincode(formData.pincode);
      }, 500);
    } else {
      // Clear location fields if pincode is incomplete
      if (intendedRole === 'farmer' && formData.pincode.length < 6) {
        setFormData(prev => ({
          ...prev,
          city: '',
          district: '',
          state: ''
        }));
      }
    }
    
    return () => clearTimeout(timeoutId);
  }, [formData.pincode, intendedRole]);

  // Fetch location details from pincode
  const fetchLocationByPincode = async (pincode) => {
    try {
      console.log('🔍 Fetching location for pincode:', pincode);
      const response = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = response.data;
      
      if (data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
        const postOffice = data[0].PostOffice[0];
        
        setFormData(prev => ({
          ...prev,
          city: postOffice.Name || postOffice.Block || '',
          district: postOffice.District || '',
          state: postOffice.State || ''
        }));
        
        // Clear any previous pincode errors
        setErrors(prev => ({ ...prev, pincode: '' }));
        
        toast.success(`Location found: ${postOffice.District}, ${postOffice.State}`, {
          position: "top-center",
          autoClose: 2000,
        });
        
        console.log('✅ Location data fetched:', {
          city: postOffice.Name,
          district: postOffice.District,
          state: postOffice.State
        });
      } else {
        setFormData(prev => ({
          ...prev,
          city: '',
          district: '',
          state: ''
        }));
        setErrors(prev => ({ 
          ...prev, 
          pincode: 'Invalid pincode. Please check and try again.' 
        }));
        toast.error('Invalid pincode. Please enter a valid Indian pincode.', {
          position: "top-center",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error('❌ Error fetching pincode data:', error);
      setErrors(prev => ({ 
        ...prev, 
        pincode: 'Failed to fetch location. Please try again.' 
      }));
      toast.error('Failed to fetch location details. Please check your connection.', {
        position: "top-center",
        autoClose: 3000,
      });
    } finally {
      setFetchingLocation(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Special handling for pincode - only allow digits
    if (name === 'pincode') {
      const numericValue = value.replace(/\D/g, '').slice(0, 6);
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
    
    // Clear errors as user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    // Farmer-specific validation
    if (intendedRole === 'farmer') {
      if (!formData.pincode.trim()) {
        newErrors.pincode = 'Pincode is required for farmers';
      } else if (formData.pincode.length !== 6) {
        newErrors.pincode = 'Pincode must be 6 digits';
      }
      
      if (!formData.district.trim()) {
        newErrors.district = 'District is required. Please enter a valid pincode.';
      }
    }
    
    if (!formData.remember) {
      newErrors.remember = 'You must agree to Terms and Conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (intendedRole === 'farmer') {
      if (!formData.certification) {
        newErrors.certification = 'Certification is required';
      }
      if (formData.experience === '' || isNaN(formData.experience) || Number(formData.experience) < 0) {
        newErrors.experience = 'Experience must be a valid number >= 0';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const togglePasswordVisibility = () => {
    setShowPassword(v => !v);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (step === 1) {
      if (!validate()) {
        toast.error('Please fix the errors in the form', {
          position: "top-center",
          autoClose: 3000,
        });
        return;
      }
      if (intendedRole === 'farmer') {
        setStep(2);
        return;
      }
    } else if (step === 2) {
      if (!validateStep2()) {
        toast.error('Please fix the errors in the form', {
          position: "top-center",
          autoClose: 3000,
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      console.log('📤 Submitting signup request...');
      console.log('API URL:', `${API_BASE_URL}/api/user/signup`);
      
      const requestData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: intendedRole === 'farmer' ? 'farmer' : 'user',
      };
      
      // Add location data if farmer
      if (intendedRole === 'farmer') {
        requestData.pincode = formData.pincode;
        requestData.city = formData.city;
        requestData.district = formData.district;
        requestData.state = formData.state;
        requestData.certification = formData.certification;
        requestData.experience = Number(formData.experience);
      }
      
      console.log('Request data:', { ...requestData, password: '***' });
      
      const res = await axios.post(
        `${API_BASE_URL}/api/user/signup`,
        requestData,
        { 
          headers: { 'Content-Type': 'application/json' },
          timeout: 60000  // 60s timeout limit as requested to handle any slow operations safely
        }
      );

      console.log('✅ Signup response:', res.data);

      if (res.data.success) {
        toast.success('Registration successful! Please verify your email.', {
          position: "top-center",
          autoClose: 3000,
        });

        setTimeout(() => {
          navigate('/verify-otp', { 
            state: { 
              email: res.data.email,
              purpose: 'signup',
              role: res.data.role,
              intendedRole: intendedRole
            } 
          });
        }, 1000);
      } else {
        toast.error(res.data.message || 'Registration failed', {
          position: "top-center",
          autoClose: 4000,
        });
      }
    } catch (err) {
      console.error('❌ Signup error:', err);
      
      let errorMessage = 'Server error. Please try again.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK') {
        errorMessage = 'Cannot connect to server. Please ensure the backend is running on port 4000.';
        console.error('💡 Backend connection failed. Make sure to run: cd backend && npm start');
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. The server is taking too long to respond. Please try again.';
      }
      
      toast.error(errorMessage, {
        position: "top-center",
        autoClose: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetailerSignup = () => {
    navigate('/admin/login');
  };
  
  const handleLoginRedirect = () => {
    navigate('/login', { state: { intendedRole } });
  };

  return (
    <div className={signupStyles.page}>
      <Link to="/login" className={signupStyles.backLink}>
        <FaArrowLeft className="mr-2" />
        Back to Login
      </Link>

      <div className={signupStyles.signupCard}>
        <div className={signupStyles.logoContainer}>
          <div className={signupStyles.logoOuter}>
            <div className={signupStyles.logoInner}>
              {intendedRole === 'farmer' ? (
                <GiFarmer className={signupStyles.logoIcon} />
              ) : (
                <FaUser className={signupStyles.logoIcon} />
              )}
            </div>
          </div>
        </div>

        <h2 className={signupStyles.title}>
          {intendedRole === 'farmer' ? 'Farmer Registration' : 'Create Account'}
        </h2>
        
        <div className="mb-4 text-center">
          <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
            intendedRole === 'farmer' 
              ? 'bg-amber-100 text-amber-800' 
              : 'bg-emerald-100 text-emerald-800'
          }`}>
            {intendedRole === 'farmer' ? '🌾 Signing up as Farmer' : '🛒 Signing up as Customer'}
          </span>
        </div>
        
        <p className="text-gray-500 text-sm mb-6 text-center">
          {intendedRole === 'farmer' 
            ? 'Register to start selling your farm produce' 
            : 'Sign up to get started with FreshBasket'}
        </p>

        {intendedRole === 'farmer' && (
          <div className="flex items-center justify-center mb-6">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 1 ? 'bg-amber-600 text-white' : 'bg-green-500 text-white'}`}>1</div>
            <div className={`w-16 h-1 ${step === 2 ? 'bg-amber-600' : 'bg-gray-300'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 2 ? 'bg-amber-600 text-white' : 'bg-gray-300 text-gray-600'}`}>2</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className={signupStyles.form}>
          {step === 1 ? (
            <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            {/* Name Field */}
            <div>
              <div className={`${signupStyles.inputContainer} !mb-2`}>
                <FaUser className={signupStyles.inputIcon} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Full Name"
                  className={signupStyles.input}
                  disabled={isLoading}
                />
              </div>
              {errors.name && <p className={signupStyles.error}>{errors.name}</p>}
            </div>

            {/* Email Field */}
            <div>
              <div className={`${signupStyles.inputContainer} !mb-2`}>
                <FaEnvelope className={signupStyles.inputIcon} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email Address"
                  className={signupStyles.input}
                  disabled={isLoading}
                />
              </div>
              {errors.email && <p className={signupStyles.error}>{errors.email}</p>}
            </div>
          </div>

          {/* FARMER ADDRESS SECTION - Only shown for farmers */}
          {intendedRole === 'farmer' && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                <FaMapMarkerAlt className="mr-2 text-amber-600" />
                Address Information
              </h3>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-800">
                  📍 Enter your 6-digit pincode first, and we'll automatically fill your city/town, district, and state!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                {/* Pincode Field */}
                <div>
                  <div className={`${signupStyles.inputContainer} !mb-2`}>
                    <FaMapMarkerAlt className={signupStyles.inputIcon} />
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      placeholder="Enter 6-digit Pincode"
                      className={signupStyles.input}
                      disabled={isLoading}
                      maxLength="6"
                    />
                    {fetchingLocation && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-600"></div>
                      </div>
                    )}
                  </div>
                  {errors.pincode && <p className={signupStyles.error}>{errors.pincode}</p>}
                </div>

                {/* City/Town Field (Read-only, auto-filled) */}
                <div>
                  <div className={`${signupStyles.inputContainer} !mb-2`}>
                    <FaMapMarkerAlt className={signupStyles.inputIcon} />
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      placeholder="City / Town (Auto-filled)"
                      className={`${signupStyles.input} bg-gray-100 cursor-not-allowed`}
                      disabled
                      readOnly
                    />
                  </div>
                </div>

                {/* District Field (Read-only, auto-filled) */}
                <div>
                  <div className={`${signupStyles.inputContainer} !mb-2`}>
                    <FaMapMarkerAlt className={signupStyles.inputIcon} />
                    <input
                      type="text"
                      name="district"
                      value={formData.district}
                      placeholder="District (Auto-filled)"
                      className={`${signupStyles.input} bg-gray-100 cursor-not-allowed`}
                      disabled
                      readOnly
                    />
                  </div>
                  {errors.district && <p className={signupStyles.error}>{errors.district}</p>}
                </div>

                {/* State Field (Read-only, auto-filled) */}
                <div>
                  <div className={`${signupStyles.inputContainer} !mb-2`}>
                    <FaMapMarkerAlt className={signupStyles.inputIcon} />
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      placeholder="State (Auto-filled)"
                      className={`${signupStyles.input} bg-gray-100 cursor-not-allowed`}
                      disabled
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Password Field */}
          <div className={signupStyles.inputContainer}>
            <FaLock className={signupStyles.inputIcon} />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password (min 8 characters)"
              className={signupStyles.passwordInput}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className={signupStyles.toggleButton}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              disabled={isLoading}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {errors.password && <p className={signupStyles.error}>{errors.password}</p>}

          {/* Terms Agreement */}
          <div className={signupStyles.termsContainer}>
            <label className={signupStyles.termsLabel}>
              <input
                type="checkbox"
                name="remember"
                checked={formData.remember}
                onChange={handleChange}
                className={signupStyles.termsCheckbox}
                disabled={isLoading}
              />
              I agree to the Terms and Conditions
            </label>
          </div>
          {errors.remember && <p className={signupStyles.error}>{errors.remember}</p>}
          
          {/* Farmer Notice */}
          {intendedRole === 'farmer' && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800">
                ⚠️ <strong>Note:</strong> Your farmer account will require admin approval before you can login and start selling.
              </p>
            </div>
          )}

          {intendedRole === 'farmer' && step === 1 ? (
             <button 
              type="submit" 
              className={signupStyles.submitButton}
              disabled={isLoading || fetchingLocation}
            >
              Next Step
            </button>
          ) : (
             <div className="flex space-x-3 w-full">
              {intendedRole === 'farmer' && step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                >
                  Back
                </button>
              )}
              <button 
                type="submit" 
                className={`${signupStyles.submitButton} flex-[2]`}
                disabled={isLoading || (intendedRole === 'farmer' && fetchingLocation)}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </span>
                ) : fetchingLocation ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Fetching Location...
                  </span>
                ) : (
                  'Sign Up'
                )}
              </button>
            </div>
          )}
          
          </>
          ) : (
            <>
              {/* Step 2 Form Fields for Farmers */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                  <span className="mr-2 text-amber-600 px-2 rounded bg-amber-100">2</span>
                  Professional Details
                </h3>

                {/* Certification Field */}
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Certification</label>
                  <select
                    name="certification"
                    value={formData.certification}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    <option value="None">None</option>
                    <option value="FSSAI">FSSAI</option>
                    <option value="Organic">Organic</option>
                  </select>
                  {errors.certification && <p className={signupStyles.error}>{errors.certification}</p>}
                </div>

                {/* Experience Field */}
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Experience (Years)</label>
                  <input
                    type="number"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    min="0"
                    placeholder="E.g. 5"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {errors.experience && <p className={signupStyles.error}>{errors.experience}</p>}
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                >
                  Back
                </button>
                <button 
                  type="submit" 
                  className={`${signupStyles.submitButton} flex-[2]`}
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : 'Register'}
                </button>
              </div>
            </>
          )}
        </form>

        {/* Google Sign-in (Only for customers) */}
        {intendedRole === 'customer' && (
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>
          
            <div className="mt-6">
              <GoogleLoginButton />
            </div>
          </div>
        )}

        {/* Retailer Signup Button */}
        <div className="mt-6">
          <button
            onClick={handleRetailerSignup}
            className="w-full flex items-center justify-center px-4 py-3 border-2 border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-all duration-200 font-semibold group"
          >
            <FaStore className="mr-2 group-hover:scale-110 transition-transform" />
            Are you a Retailer? Register Here
          </button>
        </div>

        <p className={signupStyles.signinText}>
          Already have an account?{" "}
          <button
            onClick={handleLoginRedirect}
            className={signupStyles.signinLink}
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};

export default Signup;