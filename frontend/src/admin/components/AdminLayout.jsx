import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

const AdminLayout = ({ onLogout, adminUser }) => {
    return (
        <div className="min-h-screen bg-[#f8fafc] flex">
            {/* Sidebar - Fixed width 256px */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-grow ml-64 flex flex-col min-h-screen transition-all duration-300">
                <TopNavbar onLogout={onLogout} adminUser={adminUser} />

                {/* Child Routes Rendered Here */}
                <main className="flex-grow p-8 flex flex-col gap-8 pb-20">
                    <Outlet />
                </main>

                {/* Footer inside layout */}
                <footer className="mt-auto py-8 px-10 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center text-gray-400 gap-4">
                    <p className="text-sm font-black uppercase tracking-[0.2em]">© {new Date().getFullYear()} FreshBasket Admin Panel. Master Access.</p>
                    <div className="flex gap-6 text-xs font-black uppercase tracking-widest transition-all">
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
