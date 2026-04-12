import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import { FiMenu } from 'react-icons/fi';

const AdminLayout = ({ onLogout, adminUser }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#f8fafc] flex relative">
            {/* Mobile Overlay */}
            <div
                className={`admin-sidebar-overlay ${sidebarOpen ? 'is-open' : ''}`}
                onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar */}
            <div className={`admin-sidebar-mobile ${sidebarOpen ? 'is-open' : ''} fixed left-0 top-0 bottom-0 z-40 lg:static lg:transform-none lg:z-auto`}>
                <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>

            {/* Main Content Area */}
            <div className="admin-main-content flex-grow lg:ml-64 flex flex-col min-h-screen transition-all duration-300">
                {/* Mobile Header with Hamburger */}
                <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-30">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                        aria-label="Open sidebar"
                    >
                        <FiMenu className="w-6 h-6" />
                    </button>
                    <span className="font-black text-lg text-slate-900 italic">FreshBasket</span>
                    <div className="ml-auto flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-black text-sm shadow-md">
                            {adminUser?.name?.charAt(0) || 'A'}
                        </div>
                    </div>
                </div>

                <TopNavbar onLogout={onLogout} adminUser={adminUser} />

                {/* Child Routes Rendered Here */}
                <main className="flex-grow p-4 sm:p-6 lg:p-8 flex flex-col gap-6 lg:gap-8 pb-20">
                    <Outlet />
                </main>

                {/* Footer inside layout */}
                <footer className="mt-auto py-6 px-4 lg:px-10 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center text-gray-400 gap-4">
                    <p className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-center md:text-left">
                        © {new Date().getFullYear()} FreshBasket Admin Panel. Master Access.
                    </p>
                    <div className="flex gap-4 lg:gap-6 text-xs font-black uppercase tracking-widest transition-all">
                        <span className="hover:text-emerald-600 cursor-pointer">Security</span>
                        <span className="hover:text-emerald-600 cursor-pointer">Support</span>
                        <span className="hover:text-emerald-600 cursor-pointer">API Docs</span>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default AdminLayout;
