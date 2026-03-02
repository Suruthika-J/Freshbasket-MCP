import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiLogOut, FiUser, FiBell, FiSearch, FiSettings } from 'react-icons/fi';

const TopNavbar = ({ onLogout, adminUser }) => {
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
                {/* Bell - Aesthetic only for now */}
                <div className="relative cursor-pointer hover:bg-gray-100 p-2.5 rounded-xl transition-all duration-200">
                    <FiBell size={20} className="text-gray-600" />
                    <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white shadow-sm" />
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
