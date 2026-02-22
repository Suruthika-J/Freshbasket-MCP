// frontend/src/admin/components/AdminNavbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const AdminNavbar = ({ onLogout, adminUser }) => {
  const location = useLocation();
  const [pendingFarmersCount, setPendingFarmersCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchPendingFarmersCount();
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
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-white hover:text-green-200 transition-colors relative p-2"
              >
                <i className="fas fa-bell text-lg" />
                {pendingFarmersCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {pendingFarmersCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50 border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {pendingFarmersCount > 0 ? (
                      <Link
                        to="/admin/farmers"
                        onClick={() => setShowNotifications(false)}
                        className="block px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
                      >
                        <div className="flex items-start gap-3">
                          <div className="bg-amber-100 rounded-full p-2 flex-shrink-0">
                            <i className="fas fa-tractor text-amber-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">
                              {pendingFarmersCount} Farmer{pendingFarmersCount > 1 ? 's' : ''} Pending Approval
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Review and approve new farmer registrations
                            </p>
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <div className="px-4 py-8 text-center">
                        <i className="fas fa-bell-slash text-gray-300 text-3xl mb-2" />
                        <p className="text-sm text-gray-500">No new notifications</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Name */}
            <span className="text-white text-sm hidden sm:flex items-center gap-1.5">
              <i className="fas fa-user-shield text-sm" />
              <span>{adminUser?.name || 'Admin User'}</span>
            </span>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm transition-colors font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Click outside to close notifications */}
      {showNotifications && (
        <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
      )}
    </nav>
  );
};

export default AdminNavbar;