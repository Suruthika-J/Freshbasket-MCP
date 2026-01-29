// frontend/src/admin/AdminApp.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminNavbar from './components/AdminNavbar';
import AdminLogin from './components/AdminLogin';
import AddItemPage from './components/AddItem';
import ListItemsPage from './components/ListItems';
import OrdersPage from './components/Orders';
import DeliveryAgents from './components/DeliveryAgents';
import AdminReturnRequests from './components/AdminReturnRequests';
import FarmerManagement from './components/FarmerManagement';
import '@fortawesome/fontawesome-free/css/all.min.css';

// Logout Confirmation Dialog Component
const LogoutDialog = ({ isOpen, onConfirm, onCancel, userName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-green-700 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4 transform transition-all duration-200">
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
          Confirm Logout
        </h3>

        <p className="text-gray-600 text-center mb-6">
          Are you sure you want to logout, {userName}? You will need to sign in again to access the admin panel.
        </p>

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors duration-200 font-medium"
          >
            Yes, Logout
          </button>
        </div>
      </div>
    </div>
  );
};

function AdminApp() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Check for existing session on app load
  useEffect(() => {
    const checkExistingSession = () => {
      try {
        console.log('🔍 Checking admin session...');
        const sessionData = localStorage.getItem('adminSession');
        console.log('Session data found:', !!sessionData);

        if (sessionData) {
          const { token, user } = JSON.parse(sessionData);
          console.log('Parsed session:', { hasToken: !!token, user: user?.name });

          if (token && user) {
            setIsAuthenticated(true);
            setAdminUser(user);
            console.log('✅ Admin authenticated');
          } else {
            console.log('❌ Invalid session data');
          }
        } else {
          console.log('❌ No admin session found');
        }
      } catch (error) {
        console.error('❌ Error checking existing session:', error);
        localStorage.removeItem('adminSession');
      } finally {
        setLoading(false);
      }
    };

    checkExistingSession();
  }, []);

  const handleLogin = () => {
    try {
      console.log('🔑 Handling admin login...');
      const sessionData = localStorage.getItem('adminSession');
      if (sessionData) {
        const { user } = JSON.parse(sessionData);
        setIsAuthenticated(true);
        setAdminUser(user);
        toast.success(`Welcome back, ${user.name}!`, {
          position: "top-right",
          autoClose: 3000,
        });
        console.log('✅ Admin login successful');
      } else {
        console.log('❌ No session data after login');
      }
    } catch (error) {
      console.error('❌ Error during login:', error);
      toast.error('Login failed. Please try again.', {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = () => {
    const userName = adminUser?.name || 'Admin';
    localStorage.removeItem('adminSession');
    setIsAuthenticated(false);
    setAdminUser(null);
    setShowLogoutDialog(false);
    toast.success(`Goodbye, ${userName}! You have been logged out successfully.`, {
      position: "top-right",
      autoClose: 3000,
    });
    window.location.href = '/';
  };

  const handleLogoutCancel = () => {
    setShowLogoutDialog(false);
    toast.info('Logout cancelled. You remain logged in.', {
      position: "top-right",
      autoClose: 2000,
    });
  };

  console.log('🔄 AdminApp render:', { loading, isAuthenticated, adminUser: adminUser?.name });

  if (loading) {
    console.log('⏳ Showing loading screen');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('🔒 Showing login screen');
    return (
      <>
        <Routes>
          <Route path="/login" element={<AdminLogin onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/admin/login" replace />} />
        </Routes>
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

  console.log('✅ Showing authenticated admin panel');
  return (
    <>
      <div className="min-h-screen flex flex-col">
        <AdminNavbar onLogout={handleLogoutClick} adminUser={adminUser} />
        <main className="flex-grow bg-slate-50">
          <Routes>
            <Route path="/" element={<Navigate to="/admin/add-item" replace />} />
            <Route path="/add-item" element={<AddItemPage />} />
            <Route path="/list-items" element={<ListItemsPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/agents" element={<DeliveryAgents />} />
            <Route path="/returns" element={<AdminReturnRequests />} />
            <Route path="/farmers" element={<FarmerManagement />} />
            <Route path="*" element={<Navigate to="/admin/add-item" replace />} />
          </Routes>
        </main>

        <footer className="bg-emerald-800 text-white py-4">
          <div className="max-w-6xl mx-auto px-4 text-center text-sm">
            <p>© {new Date().getFullYear()} RushBasket Admin Panel. All rights reserved.</p>
          </div>
        </footer>
      </div>

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