import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    FiUser, FiSettings, FiLogOut, FiMoon, FiSun,
    FiGlobe, FiChevronDown, FiPackage, FiShoppingBag, FiMapPin
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const FarmerProfileDropdown = ({ farmerInfo }) => {
    const { t, i18n } = useTranslation('farmer');
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        toast.info(t('navbar.logout') + '...', { position: 'top-center', autoClose: 1200 });
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('userRole');
        window.dispatchEvent(new Event('authStateChanged'));
        setTimeout(() => navigate('/', { replace: true }), 400);
    };

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        setIsOpen(false);
    };

    const getInitials = (name) => {
        if (!name) return 'F';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    const languages = [
        { code: 'en', label: 'English', flag: '🇺🇸' },
        { code: 'ta', label: 'தமிழ்', flag: '🇮🇳' }
    ];

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-green-50 transition-all border border-transparent hover:border-green-100"
            >
                <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white">
                    {getInitials(farmerInfo?.name)}
                </div>
                <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-gray-800 leading-none">{farmerInfo?.name}</p>
                    <p className="text-[10px] text-green-600 font-medium uppercase mt-1">{t('navbar.farmer')}</p>
                </div>
                <FiChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-[1000] animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-50 mb-1">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-lg">
                                {getInitials(farmerInfo?.name)}
                            </div>
                            <div className="overflow-hidden">
                                <p className="font-bold text-gray-900 truncate">{farmerInfo?.name}</p>
                                <p className="text-xs text-gray-500 truncate">{farmerInfo?.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Language Selector */}
                    <div className="px-4 py-2 border-b border-gray-50">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 ml-1">{t('navbar.selectLanguage')}</p>
                        <div className="flex gap-1">
                            {languages.map((lng) => (
                                <button
                                    key={lng.code}
                                    onClick={() => changeLanguage(lng.code)}
                                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${i18n.language === lng.code
                                        ? 'bg-green-600 text-white shadow-md'
                                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    <span>{lng.flag}</span>
                                    <span>{lng.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Navigation Items */}
                    <div className="px-2 py-1">
                        <MenuItem
                            icon={FiUser}
                            label={t('navbar.profileSettings')}
                            onClick={() => {
                                if (window.location.pathname !== '/farmer-dashboard') {
                                    navigate('/farmer-dashboard', { state: { openProfile: true } });
                                } else {
                                    window.dispatchEvent(new CustomEvent('switchFarmerTab', { detail: 'profile' }));
                                }
                                setIsOpen(false);
                            }}
                        />
                        <MenuItem
                            icon={FiPackage}
                            label={t('navbar.myProducts')}
                            onClick={() => {
                                if (window.location.pathname !== '/farmer-dashboard') {
                                    navigate('/farmer-dashboard', { state: { tab: 'products' } });
                                } else {
                                    window.dispatchEvent(new CustomEvent('switchFarmerTab', { detail: 'products' }));
                                }
                                setIsOpen(false);
                            }}
                        />
                        <MenuItem
                            icon={FiShoppingBag}
                            label={t('navbar.customerOrders')}
                            onClick={() => {
                                if (window.location.pathname !== '/farmer-dashboard') {
                                    navigate('/farmer-dashboard', { state: { tab: 'orders' } });
                                } else {
                                    window.dispatchEvent(new CustomEvent('switchFarmerTab', { detail: 'orders' }));
                                }
                                setIsOpen(false);
                            }}
                        />
                    </div>

                    {/* Logout */}
                    <div className="px-2 pt-1 mt-1 border-t border-gray-50">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        >
                            <FiLogOut className="w-4 h-4" />
                            {t('navbar.logout')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const MenuItem = ({ icon: Icon, label, onClick }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-xl transition-all group"
    >
        <Icon className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors" />
        <span className="flex-1 text-left">{label}</span>
    </button>
);

export default FarmerProfileDropdown;
