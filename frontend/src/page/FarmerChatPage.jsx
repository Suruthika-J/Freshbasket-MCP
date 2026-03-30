import React, { useState, useEffect } from 'react';
import FarmerNavbar from '../components/FarmerNavbar';
import FarmerChat from '../components/FarmerChat';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const FarmerChatPage = () => {
    const [farmerInfo, setFarmerInfo] = useState(null);

    useEffect(() => {
        const fetchFarmerInfo = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const response = await axios.get(`${API_BASE_URL}/api/user/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data.success) {
                    setFarmerInfo(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching farmer info:', error);
            }
        };
        fetchFarmerInfo();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            <FarmerNavbar farmerInfo={farmerInfo} />
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Chat with Admin</h1>
                    <p className="text-gray-500 font-medium mt-1">Direct support for your farming business.</p>
                </div>
                <FarmerChat />
            </main>
        </div>
    );
};

export default FarmerChatPage;
