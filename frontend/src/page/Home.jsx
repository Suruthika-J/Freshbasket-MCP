// frontend/src/page/Home.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BannerHome from '../components/BannerHome';
import ItemsHome from '../components/ItemsHome';
import Footer from '../components/Footer';

const Home = () => {
    const navigate = useNavigate();
    const isAuthenticated = Boolean(localStorage.getItem('authToken'));
    const userRole = localStorage.getItem('userRole');

    useEffect(() => {
        // ========== ROLE-BASED REDIRECT ==========
        if (isAuthenticated) {
            if (userRole === 'admin') {
                navigate('/admin', { replace: true });
            } else if (userRole === 'agent') {
                navigate('/delivery-dashboard', { replace: true });
            } else if (userRole === 'farmer') {
                // ========== CHECK FARMER APPROVAL STATUS ==========
                const userData = localStorage.getItem('userData');
                if (userData) {
                    try {
                        const user = JSON.parse(userData);
                        console.log('🌾 Farmer home check - isApproved:', user.isApproved);
                        
                        if (user.isApproved === true) {
                            navigate('/farmer-dashboard', { replace: true });
                        } else if (user.isApproved === false) {
                            // Unapproved farmer - redirect to pending approval page
                            navigate('/farmer-pending-approval', { replace: true });
                        }
                        // If isApproved is undefined, farmer stays on home (just registered)
                    } catch (e) {
                        console.error('Error parsing user data:', e);
                    }
                }
            }
            // If regular customer, stay on home page with full functionality
        }
    }, [isAuthenticated, userRole, navigate]);

    // Don't render anything for authenticated non-customer users to prevent white page flash
    if (isAuthenticated && userRole !== 'user') {
        return null;
    }

    return (
        <>
            {/* ========== BANNER SHOWN FOR ALL VISITORS ========== */}
            <BannerHome />

            {/* ========== ITEMS SHOWN FOR LOGGED-IN CUSTOMERS ========== */}
            {isAuthenticated && userRole === 'user' && (
                <>
                    <ItemsHome />
                    <Footer />
                </>
            )}

            {/* ========== WELCOME MESSAGE FOR NON-AUTHENTICATED USERS ========== */}
            {!isAuthenticated && (
                <div className="py-16 bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
                    <div className="max-w-4xl mx-auto px-4 text-center">
                        {/* Welcome Card */}
                        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 transform transition-all duration-300 hover:shadow-2xl">
                            {/* Icon */}
                            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                                <svg 
                                    className="w-10 h-10 text-white" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth={2} 
                                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
                                    />
                                </svg>
                            </div>
                            
                            {/* Title */}
                            <h2 className="text-4xl font-bold text-gray-800 mb-4">
                                Welcome to FreshBasket
                            </h2>
                            
                            {/* Subtitle */}
                            <p className="text-xl text-gray-600 mb-8">
                                Your No-Middleman Platform
                            </p>
                            
                            {/* Feature Cards */}
                            <div className="max-w-2xl mx-auto space-y-4 mb-8">
                                {/* Farmer Card */}
                                <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
                                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                                        <span className="text-2xl">🌾</span>
                                    </div>
                                    <div className="text-left flex-1">
                                        <h3 className="font-bold text-gray-800 mb-1 text-lg">For Farmers</h3>
                                        <p className="text-sm text-gray-600">
                                            Sell your produce directly to customers at fair prices without any middlemen
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Customer Card */}
                                <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200 transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
                                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                                        <span className="text-2xl">🛒</span>
                                    </div>
                                    <div className="text-left flex-1">
                                        <h3 className="font-bold text-gray-800 mb-1 text-lg">For Customers</h3>
                                        <p className="text-sm text-gray-600">
                                            Buy fresh farm produce at the best prices directly from local farmers
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Call to Action */}
                            <div className="pt-4">
                                <p className="text-gray-500 text-lg mb-4">
                                    Please login or signup to continue shopping or selling your produce
                                </p>
                                <p className="text-sm text-gray-400">
                                    ✨ Join thousands of satisfied farmers and customers today!
                                </p>
                            </div>
                        </div>

                        {/* Stats Section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                            <div className="bg-white rounded-xl shadow-md p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
                                <div className="text-3xl font-bold text-emerald-600 mb-2">1000+</div>
                                <div className="text-gray-600">Active Farmers</div>
                            </div>
                            <div className="bg-white rounded-xl shadow-md p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
                                <div className="text-3xl font-bold text-blue-600 mb-2">5000+</div>
                                <div className="text-gray-600">Happy Customers</div>
                            </div>
                            <div className="bg-white rounded-xl shadow-md p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
                                <div className="text-3xl font-bold text-amber-600 mb-2">100%</div>
                                <div className="text-gray-600">Fresh & Organic</div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Footer */}
                    <Footer />
                </div>
            )}
        </>
    );
};

export default Home;