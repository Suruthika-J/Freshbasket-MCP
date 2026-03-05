import React from 'react';
import DashboardAlertSummary from '../components/DashboardAlertSummary';
import OrderChart from '../components/OrderChart';

const AdminDashboardPage = () => {
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            {/* Header with visual separator */}
            <div className="flex flex-col gap-1 border-l-4 border-emerald-500 pl-6 border-b border-gray-100/50 pb-8">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-tight">Master Analytics <span className="text-emerald-500">Dashboard</span></h1>
                <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[10px] italic">Platform health, sales trends, and user activities.</p>
            </div>

            {/* Alert Summary Section */}
            <section className="animate-in fade-in slide-in-from-top-4 duration-500 delay-300">
                <DashboardAlertSummary />
            </section>

            {/* Main Stats with existing OrderChart UI */}
            <section className="bg-white rounded-[3rem] border border-gray-100 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500 group transition-all hover:shadow-2xl">
                <div className="bg-emerald-50/50 px-10 py-8 border-b border-gray-100 flex justify-between items-center group-hover:bg-emerald-50 transition-colors">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Sales & Logistics Intelligence</h2>
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mt-1">Real-time order distribution and revenue metrics.</p>
                    </div>
                    <div className="flex items-center gap-2 px-6 py-2 bg-white/80 backdrop-blur-md border border-emerald-100 rounded-2xl shadow-sm italic text-xs font-bold text-emerald-800">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Stats Sync
                    </div>
                </div>

                <div className="p-10 -m-10 min-h-[600px] relative">
                    {/* 
             NOTE: We pass isStandalone={true} to OrderChart so it renders as 
             part of this page instead of a fixed modal.
          */}
                    <OrderChart
                        isOpen={true}
                        onClose={() => { }}
                        isStandalone={true}
                    />
                </div>
            </section>


        </div>
    );
};

export default AdminDashboardPage;
