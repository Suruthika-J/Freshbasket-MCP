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
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setPendingFarmersCount(response.data.data.length);
      }
    } catch (error) {
      console.error('Error fetching pending farmers count:', error);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-emerald-700 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/admin" className="text-white text-xl">
              RushBasket Admin
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/admin/add-item"
              className={`text-white px-3 py-2 rounded-md text-sm flex items-center gap-1.5 ${
                isActive('/admin/add-item') ? 'bg-emerald-800' : 'hover:bg-emerald-600'
              }`}
            >
              <i className="fas fa-plus text-sm"></i>
              <span>Add Item</span>
            </Link>
            <Link
              to="/admin/list-items"
              className={`text-white px-3 py-2 rounded-md text-sm flex items-center gap-1.5 ${
                isActive('/admin/list-items') ? 'bg-emerald-800' : 'hover:bg-emerald-600'
              }`}
            >
              <i className="fas fa-list text-sm"></i>
              <span>List Items</span>
            </Link>
            <Link
              to="/admin/orders"
              className={`text-white px-3 py-2 rounded-md text-sm flex items-center gap-1.5 ${
                isActive('/admin/orders') ? 'bg-emerald-800' : 'hover:bg-emerald-600'
              }`}
            >
              <i className="fas fa-shopping-cart text-sm"></i>
              <span>Orders</span>
            </Link>
            <Link
              to="/admin/agents"
              className={`text-white px-3 py-2 rounded-md text-sm flex items-center gap-1.5 ${
                isActive('/admin/agents') ? 'bg-emerald-800' : 'hover:bg-emerald-600'
              }`}
            >
              <i className="fas fa-truck text-sm"></i>
              <span>Agents</span>
            </Link>
            <Link
              to="/admin/farmers"
              className={`text-white px-3 py-2 rounded-md text-sm flex items-center gap-1.5 relative ${
                isActive('/admin/farmers') ? 'bg-emerald-800' : 'hover:bg-emerald-600'
              }`}
            >
              <i className="fas fa-tractor text-sm"></i>
              <span>Farmers</span>
              {pendingFarmersCount > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center font-medium">
                  {pendingFarmersCount}
                </span>
              )}
            </Link>
            <Link
              to="/admin/returns"
              className={`text-white px-3 py-2 rounded-md text-sm flex items-center gap-1.5 ${
                isActive('/admin/returns') ? 'bg-emerald-800' : 'hover:bg-emerald-600'
              }`}
            >
              <i className="fas fa-undo text-sm"></i>
              <span>Returns</span>
            </Link>
          </div>

          {/* Notification Icon, User Info & Logout */}
          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-white hover:text-emerald-200 transition-colors relative p-2"
              >
                <i className="fas fa-bell text-lg"></i>
                {pendingFarmersCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {pendingFarmersCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50 border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-sm text-gray-900">Notifications</h3>
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
                            <i className="fas fa-tractor text-amber-600"></i>
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
                        <i className="fas fa-bell-slash text-gray-300 text-3xl mb-2"></i>
                        <p className="text-sm text-gray-500">No new notifications</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Name */}
            <span className="text-white text-sm hidden sm:flex items-center gap-1.5">
              <i className="fas fa-user-shield text-sm"></i>
              <span>{adminUser?.name || 'Admin User'}</span>
            </span>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Click outside to close notifications */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        ></div>
      )}
    </nav>
  );
};

export default AdminNavbar;