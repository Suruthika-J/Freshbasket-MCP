import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaUserPlus, FaUser, FaPhone, FaLock, FaCertificate, FaBriefcase, FaEye, FaEyeSlash } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const CreateFarmer = ({ onClose, refreshList }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    certification: 'None',
    experience: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = JSON.parse(localStorage.getItem('adminSession'))?.token;

      if (!token) {
        toast.error('Authentication required');
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/user/admin/create-farmer`,
        {
          name: formData.name,
          phone: formData.phone,
          password: formData.password || undefined,
          certification: formData.certification,
          experience: formData.experience ? Number(formData.experience) : 0
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success(`Farmer account created successfully! Password: ${response.data.credentials.password}`, {
          autoClose: 10000,
        });
        
        if (refreshList) refreshList();
        if (onClose) onClose();
      } else {
        toast.error(response.data.message || 'Failed to create farmer account');
      }
    } catch (error) {
      console.error('Create farmer error:', error);
      toast.error(error.response?.data?.message || 'Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-[60]"
      style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.15)' }}>
      <div className="rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all duration-300 bg-white border border-gray-200">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <FaUserPlus className="mr-3" /> Create Farmer Account
          </h2>
          <button onClick={onClose} className="text-white hover:text-red-200 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Full Name <span className="text-red-500">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="text-gray-400" />
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter farmer's full name"
                className="pl-10 w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Phone Number <span className="text-red-500">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaPhone className="text-gray-400" />
              </div>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                pattern="\d{10}"
                title="Please enter a valid 10-digit phone number"
                placeholder="10-digit mobile number"
                className="pl-10 w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Password (Optional)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Leave blank to auto-generate"
                className="pl-10 w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-green-600"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">If left blank, a random password will be generated and shown after creation.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Certification</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaCertificate className="text-gray-400" />
                </div>
                <select
                  name="certification"
                  value={formData.certification}
                  onChange={handleChange}
                  className="pl-10 w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                >
                  <option value="None">None</option>
                  <option value="FSSAI">FSSAI</option>
                  <option value="Organic">Organic</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Experience (Years)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaBriefcase className="text-gray-400" />
                </div>
                <input
                  type="number"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  min="0"
                  placeholder="0"
                  className="pl-10 w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold flex items-center justify-center disabled:opacity-70"
            >
              {loading ? (
                <span className="flex items-center space-x-2">
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Creating...</span>
                </span>
              ) : 'Create Farmer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFarmer;
