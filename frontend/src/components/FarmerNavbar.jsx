import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiHome, FiBarChart2, FiBox, FiClipboard, FiBell, FiMessageSquare, FiMenu, FiX } from 'react-icons/fi';
import FarmerProfileDropdown from './FarmerProfileDropdown';

const FarmerNavbar = ({ farmerInfo }) => {
    const { t } = useTranslation('farmer');
    const location = useLocation();
    const navigate = useNavigate();

    const [pendingOrders, setPendingOrders] = useState(0);
    const [lowStockCount, setLowStockCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const notificationsRef = useRef(null);
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            const [ordersRes, productsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/farmer/analytics/order-status`, config),
                axios.get(`${API_BASE_URL}/api/farmer/analytics/products`, config)
            ]);

            if (ordersRes.data?.success && ordersRes.data.statusDistribution) {
                const pending = ordersRes.data.statusDistribution.find(s => s._id === 'pending');
                setPendingOrders(pending?.count || 0);
            }
            
            if (productsRes.data?.success && productsRes.data.inventoryStatus) {
                setLowStockCount(productsRes.data.inventoryStatus.length || 0);
            }
        } catch (error) {
            console.error('Error fetching farmer notifications:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const intervalId = setInterval(fetchNotifications, 30000);
        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location]);

    const totalNotifications = pendingOrders + lowStockCount;

    const navItems = [
        { path: '/farmer-dashboard', label: t('navbar.dashboard'), icon: FiHome },
        { path: '/farmer/market-prices', label: t('navbar.dailyMarketPrice'), icon: FiBarChart2 },
        { path: '/farmer/add-product', label: t('navbar.addUpdateProducts'), icon: FiBox },
        { path: '/farmer/chat', label: 'Chat Support', icon: FiMessageSquare },
    ];

    return (
        <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Brand/Logo */}
                    <div className="flex items-center">
                        <Link to="/farmer-dashboard" className="flex items-center gap-2 group">
                            <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-200 group-hover:rotate-12 transition-transform">
                                <span className="text-lg">🌾</span>
                            </div>
                            <div className="hidden sm:block">
                                <span className="text-lg font-black tracking-tight text-gray-900">
                                    Fresh<span className="text-green-600">Basket</span>
                                </span>
                                <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest leading-none">
                                    {t('navbar.farmer')} Central
                                </p>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center justify-center flex-1 px-6 space-x-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${isActive
                                        ? 'bg-green-600 text-white shadow-md shadow-green-100'
                                        : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                                        }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                                    <span className="whitespace-nowrap">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Notifications */}
                        <div className="relative" ref={notificationsRef}>
                            <button 
                                className="p-2 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all relative"
                                onClick={() => setShowNotifications(!showNotifications)}
                                aria-label="Notifications"
                            >
                                <FiBell className="w-5 h-5" />
                                {totalNotifications > 0 && (
                                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                                        <span className="text-[8px] text-white font-bold">{totalNotifications > 9 ? '9+' : totalNotifications}</span>
                                    </span>
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            {showNotifications && (
                                <div className="absolute right-0 mt-3 w-72 sm:w-80 bg-white rounded-2xl shadow-xl z-50 border border-gray-100 overflow-hidden">
                                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                        <h3 className="text-sm font-bold text-gray-900">Alerts</h3>
                                        {totalNotifications > 0 && (
                                            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                                {totalNotifications} New
                                            </span>
                                        )}
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {totalNotifications > 0 ? (
                                            <>
                                                {pendingOrders > 0 && (
                                                    <Link
                                                        to="/farmer-dashboard"
                                                        onClick={() => setShowNotifications(false)}
                                                        className="block px-4 py-4 hover:bg-gray-50 transition-colors border-b border-gray-50 group"
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className="bg-blue-100 rounded-xl p-2 flex-shrink-0">
                                                                <FiClipboard className="w-4 h-4 text-blue-600" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-semibold text-gray-900 mb-0.5">New Pending Orders</p>
                                                                <p className="text-xs text-gray-500">
                                                                    You have {pendingOrders} pending order{pendingOrders > 1 ? 's' : ''} to review.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                )}
                                                {lowStockCount > 0 && (
                                                    <Link
                                                        to="/farmer/add-product"
                                                        onClick={() => setShowNotifications(false)}
                                                        className="block px-4 py-4 hover:bg-gray-50 transition-colors group"
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className="bg-orange-100 rounded-xl p-2 flex-shrink-0">
                                                                <FiBox className="w-4 h-4 text-orange-600" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-semibold text-gray-900 mb-0.5">Low Stock Alert</p>
                                                                <p className="text-xs text-gray-500">
                                                                    {lowStockCount} product{lowStockCount > 1 ? 's are' : ' is'} critically low.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                )}
                                            </>
                                        ) : (
                                            <div className="px-4 py-8 text-center">
                                                <FiBell className="text-gray-300 text-2xl mx-auto mb-2" />
                                                <p className="text-sm font-medium text-gray-900">All caught up!</p>
                                                <p className="text-xs text-gray-500 mt-1">No pending alerts.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="h-6 w-px bg-gray-100 mx-1 hidden sm:block"></div>

                        {/* Profile Dropdown - Desktop */}
                        <div className="hidden sm:block">
                            <FarmerProfileDropdown farmerInfo={farmerInfo} />
                        </div>

                        {/* Mobile Hamburger */}
                        <button
                            className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                        >
                            {mobileMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            {mobileMenuOpen && (
                <div className="lg:hidden border-t border-gray-100 bg-white shadow-lg">
                    {/* Mobile Profile */}
                    <div className="px-4 py-3 border-b border-gray-100 sm:hidden">
                        <FarmerProfileDropdown farmerInfo={farmerInfo} />
                    </div>
                    
                    <nav className="px-4 py-3 space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${isActive
                                        ? 'bg-green-600 text-white shadow-sm'
                                        : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                                    }`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            )}
        </nav>
    );
};

export default FarmerNavbar;
