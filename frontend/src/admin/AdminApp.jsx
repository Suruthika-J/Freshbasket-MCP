// frontend/src/admin/AdminApp.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layout and Components
import AdminLayout from './components/AdminLayout';
import AdminDashboardPage from './pages/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import AddItemPage from './components/AddItem';
import ListItemsPage from './components/ListItems';
import OrdersPage from './components/Orders';
import DeliveryAgents from './components/DeliveryAgents';
import AdminReturnRequests from './components/AdminReturnRequests';
import FarmerManagement from './components/FarmerManagement';
import AdminChat from './components/AdminChat';

import '@fortawesome/fontawesome-free/css/all.min.css';

// Logout Confirmation Dialog Component
const LogoutDialog = ({ isOpen, onConfirm, onCancel, userName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 max-w-sm w-full border border-gray-100 animate-in zoom-in duration-300">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-red-50 rounded-full">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </div>

        <h3 className="text-xl font-black text-gray-900 text-center mb-2 tracking-tight">
          Confirm Logout
        </h3>

        <p className="text-gray-500 text-sm text-center font-medium mb-8 leading-relaxed">
          Are you sure you want to end your session, {userName}? You will need to sign in again to access the dashboard.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full px-4 py-3 text-white bg-red-600 hover:bg-red-700 rounded-2xl transition-all duration-200 font-bold shadow-lg shadow-red-200"
          >
            Yes, Log out
          </button>
          <button
            onClick={onCancel}
            className="w-full px-4 py-3 text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all duration-200 font-bold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

function AdminApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Check for existing session on app load
  useEffect(() => {
    const checkExistingSession = () => {
      try {
        const sessionData = localStorage.getItem('adminSession');
        if (sessionData) {
          const { token, user } = JSON.parse(sessionData);
          if (token && user) {
            setIsAuthenticated(true);
            setAdminUser(user);
          }
        }
      } catch (error) {
        console.error('Error checking existing session:', error);
        localStorage.removeItem('adminSession');
      } finally {
        setLoading(false);
      }
    };

    checkExistingSession();
  }, []);

  const handleLogin = () => {
    try {
      const sessionData = localStorage.getItem('adminSession');
      if (sessionData) {
        const { user } = JSON.parse(sessionData);
        setIsAuthenticated(true);
        setAdminUser(user);
        toast.success(`Access Granted. Welcome, ${user.name}!`);
      }
    } catch (error) {
      console.error('Error during login:', error);
      toast.error('Login synchronization error.');
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = () => {
    localStorage.removeItem('adminSession');
    setIsAuthenticated(false);
    setAdminUser(null);
    setShowLogoutDialog(false);
    window.location.href = '/';
  };

  const handleLogoutCancel = () => {
    setShowLogoutDialog(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-emerald-500 mx-auto mb-6 shadow-lg shadow-emerald-500/20" />
          <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] italic">Initializing Secure Environment...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Routes>
          <Route path="/login" element={<AdminLogin onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/admin/login" replace />} />
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} theme="light" />
      </>
    );
  }

  return (
    <>
      <Routes>
        <Route element={<AdminLayout onLogout={handleLogoutClick} adminUser={adminUser} />}>
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/dashboard" element={<AdminDashboardPage />} />
          <Route path="/add-item" element={<AddItemPage />} />
          <Route path="/list-items" element={<ListItemsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/agents" element={<DeliveryAgents />} />
          <Route path="/returns" element={<AdminReturnRequests />} />
          <Route path="/farmers" element={<FarmerManagement />} />
          <Route path="/chat" element={<AdminChat />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>

      <LogoutDialog
        isOpen={showLogoutDialog}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
        userName={adminUser?.name || 'Admin'}
      />

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}

export default AdminApp;