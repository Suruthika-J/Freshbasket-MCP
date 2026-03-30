import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { FiLogOut, FiUser, FiBell, FiSearch, FiSettings } from 'react-icons/fi';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const TopNavbar = ({ onLogout, adminUser }) => {
    const [pendingFarmersCount, setPendingFarmersCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationsRef = useRef(null);

    const fetchPendingFarmersCount = async () => {
        try {
            const token = JSON.parse(localStorage.getItem('adminSession'))?.token;
            if (!token) return;
            const response = await axios.get(
                `${API_BASE_URL}/api/user/admin/farmers/pending`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                setPendingFarmersCount(response.data.data.length);
            }
        } catch (error) {
            console.error('Error fetching pending farmers count:', error);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchPendingFarmersCount();
        
        // Polling every 30 seconds for dynamic updates
        const intervalId = setInterval(fetchPendingFarmersCount, 30000);
        
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

    return (
        <nav className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-30 transition-all duration-300">
            {/* Search Bar - Aesthetic Only */}
            <div className="hidden lg:flex items-center gap-3 bg-gray-50/50 p-2.5 rounded-2xl w-96 border border-gray-100 group transition-all duration-300 focus-within:ring-2 focus-within:ring-emerald-500/20 shadow-sm">
                <FiSearch className="text-gray-400 group-focus-within:text-emerald-500" />
                <input
                    type="text"
                    placeholder="Search stats, orders, items..."
                    className="bg-transparent border-none outline-none text-sm font-medium text-gray-700 w-full"
                />
            </div>

            {/* Right side: Actions + Profile */}
            <div className="flex items-center gap-6 ml-auto">
                {/* Notification Bell */}
                <div className="relative" ref={notificationsRef}>
                    <div 
                        className="relative cursor-pointer hover:bg-gray-100 p-2.5 rounded-xl transition-all duration-200"
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <FiBell size={20} className="text-gray-600" />
                        {pendingFarmersCount > 0 && (
                            <div className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                                <span className="text-[9px] text-white font-bold">{pendingFarmersCount > 9 ? '9+' : pendingFarmersCount}</span>
                            </div>
                        )}
                    </div>
                    
                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl z-50 border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                                {pendingFarmersCount > 0 && (
                                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                        {pendingFarmersCount} New
                                    </span>
                                )}
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {pendingFarmersCount > 0 ? (
                                    <Link
                                        to="/admin/farmers"
                                        onClick={() => setShowNotifications(false)}
                                        className="block px-4 py-4 hover:bg-gray-50 transition-colors border-b border-gray-50 group"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="bg-amber-100 rounded-xl p-2.5 flex-shrink-0 group-hover:bg-amber-200 transition-colors">
                                                <span className="text-amber-600 text-lg">🌾</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-gray-900 mb-0.5">
                                                    Farmer Registration
                                                </p>
                                                <p className="text-xs text-gray-500 line-clamp-2">
                                                    {pendingFarmersCount} Farmer{pendingFarmersCount > 1 ? 's' : ''} pending approval. Review their applications now.
                                                </p>
                                            </div>
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                                        </div>
                                    </Link>
                                ) : (
                                    <div className="px-4 py-8 text-center flex flex-col items-center justify-center">
                                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                            <FiBell className="text-gray-300 text-xl" />
                                        </div>
                                        <p className="text-sm font-medium text-gray-900">All caught up!</p>
                                        <p className="text-xs text-gray-500 mt-1">No new notifications right now</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Dropdown Simulation */}
                <div className="flex items-center gap-4 py-2 pl-4 pr-1 rounded-3xl border border-gray-100 hover:bg-gray-50 transition-all duration-300 cursor-pointer shadow-sm group">
                    <div className="hidden md:block text-right">
                        <p className="text-sm font-black text-gray-900 tracking-tight leading-tight">{adminUser?.name || 'Admin User'}</p>
                        <p className="text-[10px] uppercase font-black tracking-widest text-emerald-600 leading-tight">Master Admin</p>
                    </div>

                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
                        {adminUser?.name?.charAt(0) || 'A'}
                    </div>

                    <button
                        onClick={onLogout}
                        className="w-10 h-10 flex items-center justify-center text-red-500 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all duration-200 ml-2 group-hover:bg-red-50"
                        title="Sign Out"
                    >
                        <FiLogOut size={20} />
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default TopNavbar;
