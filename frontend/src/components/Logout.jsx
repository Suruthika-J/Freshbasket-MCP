// frontend/src/components/Logout.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaSignOutAlt } from 'react-icons/fa';

const Logout = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Automatically clear auth data and redirect on component mount
        const performLogout = () => {
            // Clear all stored auth data
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            localStorage.removeItem('userRole');
            localStorage.removeItem('token');
            sessionStorage.clear();
            
            // Notify the rest of the app
            window.dispatchEvent(new Event('authStateChanged'));
            
            // Show success toast
            toast.success('Logged out successfully!', {
                position: "top-center",
                autoClose: 2000,
            });
            
            // Redirect to home page after a short delay
            setTimeout(() => {
                navigate('/', { replace: true });
            }, 1000);
        };

        performLogout();
    }, [navigate]);

    // Manual logout handler (in case user clicks the button)
    const handleLogout = () => {
        // Clear stored auth data
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('userRole');
        localStorage.removeItem('token');
        sessionStorage.clear();
        
        // Notify the rest of the app
        window.dispatchEvent(new Event('authStateChanged'));
        
        // Show success toast
        toast.success('Logged out successfully!', {
            position: "top-center",
            autoClose: 2000,
        });
        
        // Redirect to home
        setTimeout(() => {
            navigate('/', { replace: true });
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center transform transition-all duration-500 hover:scale-105">
                {/* Animated Icon */}
                <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse shadow-lg">
                    <FaSignOutAlt className="text-white text-3xl" />
                </div>

                {/* Title */}
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                    Logging Out...
                </h2>
                
                {/* Description */}
                <p className="text-gray-600 mb-6">
                    Redirecting you to the home page
                </p>

                {/* Loading Spinner */}
                <div className="flex justify-center mb-6">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-red-600"></div>
                </div>

                {/* Manual Logout Button (backup) */}
                <button
                    onClick={handleLogout}
                    className="flex items-center justify-center mx-auto px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-red-500/50 transform hover:scale-105"
                >
                    <FaSignOutAlt className="mr-2" />
                    Click here if not redirected
                </button>

                {/* Info Text */}
                <p className="mt-6 text-sm text-gray-500">
                    Thank you for using FreshBasket!
                </p>
            </div>
        </div>
    );
};

export default Logout;