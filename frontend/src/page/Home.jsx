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
        if (isAuthenticated) {
            if (userRole === 'admin') {
                navigate('/admin', { replace: true });
            } else if (userRole === 'agent') {
                navigate('/delivery-dashboard', { replace: true });
            } else if (userRole === 'farmer') {
                const userData = localStorage.getItem('userData');
                if (userData) {
                    try {
                        const user = JSON.parse(userData);
                        if (user.isApproved === true) {
                            navigate('/farmer-dashboard', { replace: true });
                        } else if (user.isApproved === false) {
                            navigate('/farmer-pending-approval', { replace: true });
                        }
                    } catch (e) {
                        console.error('Error parsing user data:', e);
                    }
                }
            }
        }
    }, [isAuthenticated, userRole, navigate]);

    if (isAuthenticated && userRole !== 'user') {
        return null;
    }

    return (
        <>
            {/* Banner shown for all visitors */}
            <BannerHome />

            {/* Items + Footer for logged-in customers */}
            {isAuthenticated && userRole === 'user' && (
                <>
                    <ItemsHome />
                    <Footer />
                </>
            )}

            {/* Welcome section for non-authenticated visitors */}
            {!isAuthenticated && (
                <div className="py-16 fb-bg-secondary">
                    <div className="max-w-4xl mx-auto px-4 text-center">
                        {/* Welcome Card */}
                        <div className="fb-card rounded-2xl p-8 md:p-12 transform transition-all duration-300">
                            {/* Icon */}
                            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                                style={{ background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-primary))' }}>
                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>

                            {/* Title */}
                            <h2 className="text-4xl font-bold fb-text mb-4">
                                Welcome to <span className="fb-text-primary">FreshBasket</span>
                            </h2>

                            {/* Subtitle */}
                            <p className="text-xl fb-text-secondary mb-8">
                                Your No-Middleman Platform
                            </p>

                            {/* Feature Cards */}
                            <div className="max-w-2xl mx-auto space-y-4 mb-8">
                                {/* Farmer Card */}
                                <div className="flex items-start gap-4 p-4 rounded-xl border fb-border fb-surface-alt transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg"
                                        style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
                                        <span className="text-2xl">🌾</span>
                                    </div>
                                    <div className="text-left flex-1">
                                        <h3 className="font-bold fb-text mb-1 text-lg">For Farmers</h3>
                                        <p className="text-sm fb-text-secondary">
                                            Sell your produce directly to customers at fair prices without any middlemen
                                        </p>
                                    </div>
                                </div>

                                {/* Customer Card */}
                                <div className="flex items-start gap-4 p-4 rounded-xl border fb-border fb-primary-subtle transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg"
                                        style={{ background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-primary))' }}>
                                        <span className="text-2xl">🛒</span>
                                    </div>
                                    <div className="text-left flex-1">
                                        <h3 className="font-bold fb-text mb-1 text-lg">For Customers</h3>
                                        <p className="text-sm fb-text-secondary">
                                            Buy fresh farm produce at the best prices directly from local farmers
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Call to Action */}
                            <div className="pt-4">
                                <p className="fb-text text-lg mb-4">
                                    Please login or signup to continue shopping or selling your produce
                                </p>
                                <p className="text-sm fb-text-secondary font-medium">
                                    ✨ Join thousands of satisfied farmers and customers today!
                                </p>
                            </div>
                        </div>

                        {/* Stats Section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                            <div className="fb-card rounded-xl p-6 transform transition-all duration-300 hover:scale-105">
                                <div className="text-3xl font-bold fb-text-primary mb-2">1000+</div>
                                <div className="fb-text-secondary">Active Farmers</div>
                            </div>
                            <div className="fb-card rounded-xl p-6 transform transition-all duration-300 hover:scale-105">
                                <div className="text-3xl font-bold mb-2" style={{ color: 'var(--color-info)' }}>5000+</div>
                                <div className="fb-text-secondary">Happy Customers</div>
                            </div>
                            <div className="fb-card rounded-xl p-6 transform transition-all duration-300 hover:scale-105">
                                <div className="text-3xl font-bold mb-2" style={{ color: 'var(--color-warning)' }}>100%</div>
                                <div className="fb-text-secondary">Fresh & Organic</div>
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