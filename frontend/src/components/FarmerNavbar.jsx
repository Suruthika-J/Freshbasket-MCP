import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiHome, FiBarChart2, FiBox, FiClipboard, FiBell } from 'react-icons/fi';
import FarmerProfileDropdown from './FarmerProfileDropdown';

const FarmerNavbar = ({ farmerInfo }) => {
    const { t } = useTranslation('farmer');
    const location = useLocation();
    const navigate = useNavigate();

    const navItems = [
        { path: '/farmer-dashboard', label: t('navbar.dashboard'), icon: FiHome },
        { path: '/farmer/market-prices', label: t('navbar.dailyMarketPrice'), icon: FiBarChart2 },
        { path: '/farmer/add-product', label: t('navbar.addUpdateProducts'), icon: FiBox },
    ];

    return (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Brand/Logo */}
                    <div className="flex items-center">
                        <Link to="/farmer-dashboard" className="flex items-center gap-2 group">
                            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-200 group-hover:rotate-12 transition-transform">
                                <span className="text-xl">🌾</span>
                            </div>
                            <div className="hidden sm:block">
                                <span className="text-xl font-black tracking-tight text-gray-900">
                                    Fresh<span className="text-green-600">Basket</span>
                                </span>
                                <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest leading-none">
                                    {t('navbar.farmer')} Central
                                </p>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center justify-center flex-1 px-8 space-x-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${isActive
                                            ? 'bg-green-600 text-white shadow-md shadow-green-100'
                                            : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                                        }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Notifications */}
                        <button className="p-2 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all relative">
                            <FiBell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>

                        <div className="h-8 w-px bg-gray-100 mx-1 hidden sm:block"></div>

                        {/* Profile Dropdown */}
                        <FarmerProfileDropdown farmerInfo={farmerInfo} />
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default FarmerNavbar;
