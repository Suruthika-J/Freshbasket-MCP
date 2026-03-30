import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useChat } from '../../ChatContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const AdminNavbar = ({ onLogout, adminUser }) => {
  const location = useLocation();
  const [pendingFarmersCount, setPendingFarmersCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef(null);
  const { unreadTotal } = useChat();

  useEffect(() => {
    fetchPendingFarmersCount();
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

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: '/admin/add-item', icon: 'fas fa-plus', label: 'Add Item' },
    { path: '/admin/list-items', icon: 'fas fa-list', label: 'List Items' },
    { path: '/admin/orders', icon: 'fas fa-shopping-cart', label: 'Orders' },
    { path: '/admin/agents', icon: 'fas fa-truck', label: 'Agents' },
    { path: '/admin/farmers', icon: 'fas fa-tractor', label: 'Farmers', badge: pendingFarmersCount },
    { path: '/admin/returns', icon: 'fas fa-undo', label: 'Returns' },
    { path: '/admin/chat', icon: 'fas fa-comments', label: 'Messages', badge: unreadTotal },
  ];

  return (
    <nav style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }} className="shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/admin" className="text-white text-xl font-bold tracking-wide">
              🌿 FreshBasket Admin
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map(({ path, icon, label, badge }) => (
              <Link
                key={path}
                to={path}
                className={`text-white px-3 py-2 rounded-md text-sm flex items-center gap-1.5 relative transition-colors ${isActive(path)
                  ? 'bg-black/20 font-semibold'
                  : 'hover:bg-white/10'
                  }`}
              >
                <i className={`${icon} text-sm`} />
                <span>{label}</span>
                {badge > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-xs rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center font-medium">
                    {badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Right side: Notification + User + Logout */}
          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-white hover:text-green-200 transition-colors relative p-2"
              >
                <i className="fas fa-bell text-lg" />
                {pendingFarmersCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] sm:text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium shadow">
                    {pendingFarmersCount > 9 ? '9+' : pendingFarmersCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl z-50 border border-gray-100 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                    {pendingFarmersCount > 0 && (
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">
                        {pendingFarmersCount} New
                      </span>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {pendingFarmersCount > 0 ? (
                      <Link
                        to="/admin/farmers"
                        onClick={() => setShowNotifications(false)}
                        className="block px-4 py-4 hover:bg-gray-50 transition-colors border-b border-gray-100 group"
                      >
                        <div className="flex items-start gap-4">
                          <div className="bg-amber-100 rounded-xl p-2.5 flex-shrink-0 group-hover:bg-amber-200 transition-colors">
                            <i className="fas fa-tractor text-amber-600 text-lg" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">
                              {pendingFarmersCount} Farmer{pendingFarmersCount > 1 ? 's' : ''} Pending Approval
                            </p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              Review and approve new farmer applications to grant them platform access.
                            </p>
                          </div>
                          <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                        </div>
                      </Link>
                    ) : (
                      <div className="px-4 py-10 text-center flex flex-col items-center justify-center">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                            <i className="fas fa-bell-slash text-gray-400 text-xl" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">No new notifications</p>
                        <p className="text-xs text-gray-500 mt-1">You're all caught up!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Name */}
            <span className="text-white text-sm hidden sm:flex items-center gap-1.5 font-medium ml-2">
              <i className="fas fa-user-shield text-sm" />
              <span>{adminUser?.name || 'Admin User'}</span>
            </span>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="bg-red-500/90 hover:bg-red-600 text-white px-5 py-2 rounded-lg text-sm transition-all font-semibold shadow-sm ml-2"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;