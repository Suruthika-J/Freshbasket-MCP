//  frontend/src/admin/components/AddAgentForm.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const AddAgentForm = ({ onAgentAdded }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: ''
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name.trim()) {
            toast.error('Agent name is required');
            return;
        }

        if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
            toast.error('Valid email is required');
            return;
        }

        if (formData.password.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
            toast.error('Phone number must be exactly 10 digits');
            return;
        }

        setLoading(true);

        try {
            console.log('📤 Creating agent with data:', { 
                name: formData.name, 
                email: formData.email, 
                phone: formData.phone 
            });

            // 🔑 Get admin token from localStorage
            const session = JSON.parse(localStorage.getItem('adminSession'));
            const token = session?.token;

            if (!token) {
                toast.error('Admin session expired. Please log in again.');
                setLoading(false);
                return;
            }

            // 📨 Send POST request with token in header
            const response = await axios.post(
                'http://localhost:4000/api/agents',
                formData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            console.log('✅ Response:', response.data);

            if (response.data.success) {
                toast.success(response.data.message);

                // Reset form
                setFormData({
                    name: '',
                    email: '',
                    password: '',
                    phone: ''
                });

                // Notify parent component
                if (onAgentAdded) {
                    onAgentAdded();
                }
            }
        } catch (error) {
            console.error('❌ Create agent error:', error);
            console.error('❌ Error response:', error.response?.data);

            const message = error.response?.data?.message || 'Failed to create delivery agent';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Add Delivery Agent</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Full Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <i className="fas fa-user absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter agent's full name"
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>
                </div>

                {/* Email Address */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <i className="fas fa-envelope absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="agent@example.com"
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>
                </div>

                {/* Password */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <i className="fas fa-lock absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            minLength={8}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Must be at least 8 characters
                    </p>
                </div>

                {/* Phone Number (Optional) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number (Optional)
                    </label>
                    <div className="relative">
                        <i className="fas fa-phone absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="10-digit phone number"
                            pattern="\d{10}"
                            maxLength={10}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Enter 10-digit phone number without country code
                    </p>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={() => {
                            setFormData({
                                name: '',
                                email: '',
                                password: '',
                                phone: ''
                            });
                        }}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                        disabled={loading}
                    >
                        Clear Form
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                    >
                        {loading ? (
                            <>
                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                Creating...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-user-plus mr-2"></i>
                                Create Delivery Agent
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddAgentForm;
