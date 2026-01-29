// frontend/src/admin/components/AddAgent.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const AddAgent = ({ onAgentCreated }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: ''
    });
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
        
        // Validation
        if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
            toast.error('Name, email, and password are required');
            return;
        }

        if (formData.password.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(
                'http://localhost:4000/api/agents',
                formData
            );

            if (response.data.success) {
                toast.success('Delivery agent created successfully!');
                setFormData({
                    name: '',
                    email: '',
                    password: '',
                    phone: ''
                });
                
                // Callback to refresh agents list
                if (onAgentCreated) {
                    onAgentCreated();
                }
            }
        } catch (error) {
            console.error('Create agent error:', error);
            const message = error.response?.data?.message || 'Failed to create agent';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Add Delivery Agent</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <i className="fas fa-user"></i>
                        </span>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter agent's full name"
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <i className="fas fa-envelope"></i>
                        </span>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="agent@example.com"
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password *
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <i className="fas fa-lock"></i>
                        </span>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            minLength="8"
                            required
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Must be at least 8 characters
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number (Optional)
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <i className="fas fa-phone"></i>
                        </span>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="10-digit phone number"
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            maxLength="10"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200 font-medium"
                >
                    {loading ? (
                        <span className="flex items-center justify-center">
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                            Creating Agent...
                        </span>
                    ) : (
                        'Create Delivery Agent'
                    )}
                </button>
            </form>
        </div>
    );
};

export default AddAgent;