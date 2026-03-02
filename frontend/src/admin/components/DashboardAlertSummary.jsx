import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import axios from 'axios';
import {
    FiAlertTriangle, FiBell, FiCheckCircle, FiDollarSign,
    FiUsers, FiRotateCcw, FiMessageSquare, FiArrowRight
} from 'react-icons/fi';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const DashboardAlertSummary = () => {
    const [counts, setCounts] = useState({
        pendingFarmers: 0,
        pendingReturns: 0,
        unreadMessages: 0
    });
    const [loading, setLoading] = useState(true);

    const fetchCounts = async () => {
        try {
            const sessionData = localStorage.getItem('adminSession');
            if (!sessionData) return;
            const { token } = JSON.parse(sessionData);

            const response = await axios.get(`${API_BASE_URL}/api/user/admin/summary-counts`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setCounts(response.data.summary);
            }
        } catch (error) {
            console.error('Error fetching summary counts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCounts();
    }, []);

    const alerts = [
        {
            label: 'Farmer Approvals',
            count: counts.pendingFarmers,
            link: '/admin/farmers',
            icon: <FiUsers />,
            color: 'amber',
            description: 'New farmers awaiting platform registration approval.'
        },
        {
            label: 'Pending Returns',
            count: counts.pendingReturns,
            link: '/admin/returns',
            icon: <FiRotateCcw />,
            color: 'orange',
            description: 'Customer return requests that require manual review.'
        },
        {
            label: 'Unread Messages',
            count: counts.unreadMessages,
            link: '/admin/chat',
            icon: <FiMessageSquare />,
            color: 'blue',
            description: 'Messages from farmers needing admin attention.'
        }
    ];

    const totalAlerts = counts.pendingFarmers + counts.pendingReturns + counts.unreadMessages;

    if (loading) return null;

    return (
        <div className="flex flex-col gap-6">
            {/* Alert Banner */}
            <div className={`p-6 rounded-[2.5rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-300 shadow-2xl relative overflow-hidden ${totalAlerts > 0
                    ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white'
                    : 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white'
                }`}>
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white font-black text-xl">
                            {totalAlerts > 0 ? <FiAlertTriangle /> : <FiCheckCircle />}
                        </div>
                        <h2 className="text-2xl font-black tracking-tight">{totalAlerts > 0 ? `${totalAlerts} Critical Attention Points` : 'System Stable. Zero Alerts.'}</h2>
                    </div>
                    <p className="text-white/80 font-medium text-sm translate-x-13">{totalAlerts > 0 ? 'Action items detected across farmers, returns, and messages.' : 'All platform registrations and requests are fully processed.'}</p>
                </div>

                {totalAlerts > 0 && (
                    <div className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl transition-all cursor-default border border-white/10 shadow-lg">
                        <span className="font-black text-lg">{totalAlerts}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Remaining Alerts</span>
                    </div>
                )}

                {/* Dynamic background element for aesthetic */}
                <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute left-0 bottom-0 w-48 h-48 bg-black/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            </div>

            {/* Alert Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {alerts.map((alert) => (
                    <NavLink
                        key={alert.label}
                        to={alert.link}
                        className={`flex flex-col p-6 rounded-[2rem] border bg-white shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden relative ${alert.count > 0 ? `border-${alert.color}-100` : 'border-gray-100 opacity-60'
                            }`}
                    >
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all duration-300 ${alert.count > 0
                                    ? `bg-${alert.color}-100 text-${alert.color}-600 group-hover:bg-${alert.color}-600 group-hover:text-white group-hover:rotate-12 group-hover:scale-110 shadow-lg shadow-${alert.color}-100`
                                    : 'bg-gray-100 text-gray-400'
                                }`}>
                                {alert.icon}
                            </div>
                            {alert.count > 0 && (
                                <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${`bg-${alert.color}-500 text-white shadow-md shadow-${alert.color}-500/20`
                                    }`}>
                                    {alert.count} Pending
                                </div>
                            )}
                        </div>

                        <h3 className="text-lg font-black text-gray-900 mb-1 group-hover:translate-x-1 transition-transform relative z-10">{alert.label}</h3>
                        <p className="text-xs text-gray-500 font-medium mb-4 relative z-10 leading-relaxed uppercase tracking-wide opacity-70">{alert.description}</p>

                        <div className="mt-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative z-10">
                            <span className={`group-hover:mr-2 transition-all ${alert.count > 0 ? `text-${alert.color}-600` : 'text-gray-400'}`}>
                                {alert.count > 0 ? 'Resolve Now' : 'Zero Pending'}
                            </span>
                            <FiArrowRight />
                        </div>

                        {/* Subtle card background glow on hover */}
                        <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-0 group-hover:opacity-10 transition-all blur-2xl ${`bg-${alert.color}-600`
                            }`} />
                    </NavLink>
                ))}
            </div>
        </div>
    );
};

export default DashboardAlertSummary;
