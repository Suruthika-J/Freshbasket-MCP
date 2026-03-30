import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
    FiHome, FiPlusCircle, FiList, FiShoppingCart,
    FiTruck, FiUsers, FiRotateCcw, FiMessageSquare,
    FiChevronRight, FiGrid, FiStar
} from 'react-icons/fi';
import { useChat } from '../../ChatContext';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const Sidebar = () => {
    const { unreadTotal } = useChat();
    const [counts, setCounts] = useState({
        pendingFarmers: 0,
        pendingReturns: 0
    });

    const fetchCounts = async () => {
        try {
            const sessionData = localStorage.getItem('adminSession');
            if (!sessionData) return;
            const { token } = JSON.parse(sessionData);

            const response = await axios.get(`${API_BASE_URL}/api/user/admin/summary-counts`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setCounts({
                    pendingFarmers: response.data.summary.pendingFarmers,
                    pendingReturns: response.data.summary.pendingReturns
                });
            }
        } catch (error) {
            console.error('Error fetching summary counts:', error);
        }
    };

    useEffect(() => {
        fetchCounts();
        const interval = setInterval(fetchCounts, 60000);
        return () => clearInterval(interval);
    }, []);

    const menuItems = [
        { path: '/admin/dashboard', icon: <FiGrid />, label: 'Dashboard' },
        { path: '/admin/add-item', icon: <FiPlusCircle />, label: 'Add Items' },
        { path: '/admin/list-items', icon: <FiList />, label: 'List Items' },
        { path: '/admin/orders', icon: <FiShoppingCart />, label: 'Orders' },
        { path: '/admin/agents', icon: <FiTruck />, label: 'Delivery Agents' },
        {
            path: '/admin/farmers',
            icon: <FiUsers />,
            label: 'Farmers',
            badge: counts.pendingFarmers,
            badgeColor: 'bg-amber-500'
        },
        {
            path: '/admin/returns',
            icon: <FiRotateCcw />,
            label: 'Returns',
            badge: counts.pendingReturns,
            badgeColor: 'bg-orange-500'
        },
        {
            path: '/admin/chat',
            icon: <FiMessageSquare />,
            label: 'Messages',
            badge: unreadTotal,
            badgeColor: 'bg-blue-500'
        },
        { path: '/admin/feedback', icon: <FiStar />, label: 'Feedback & Reviews' }
    ];

    return (
        <aside className="w-64 bg-slate-900 h-screen fixed left-0 top-0 text-slate-300 flex flex-col z-40 transition-all duration-300 shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                    <FiHome size={22} strokeWidth={2.5} />
                </div>
                <span className="font-black text-xl text-white tracking-tight italic">FreshBasket</span>
            </div>

            <nav className="flex-grow p-4 space-y-2 overflow-y-auto custom-scrollbar pt-8">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-200 group relative ${isActive
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 font-bold'
                                : 'hover:bg-slate-800 hover:text-white font-medium'
                            }`
                        }
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-xl opacity-80 group-hover:opacity-100 transition-opacity">
                                {item.icon}
                            </span>
                            <span className="text-sm tracking-wide">{item.label}</span>
                        </div>

                        {item.badge > 0 && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black text-white ${item.badgeColor} shadow-sm`}>
                                {item.badge}
                            </span>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="p-6 border-t border-slate-800 bg-slate-900/50">
                <div className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-2xl border border-slate-700/50">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-black text-white">
                        AD
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-xs font-black text-white truncate text-ellipsis">System Admin</p>
                        <p className="text-[10px] text-slate-500 truncate text-ellipsis font-bold uppercase tracking-widest">Master Panel</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
