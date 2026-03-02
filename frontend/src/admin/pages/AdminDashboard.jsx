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

            {/* Quick Access Grid - Optional but adds to premium feel */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-12">
                <div className="p-8 bg-slate-900 rounded-[2rem] text-white flex flex-col gap-4 border border-slate-800 shadow-2xl relative overflow-hidden group">
                    <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400 z-10">Sales Goal</h4>
                    <p className="text-4xl font-black z-10 tracking-tight">₹45.2K</p>
                    <div className="h-1.5 bg-slate-800 rounded-full w-full mt-2 overflow-hidden z-10">
                        <div className="bg-emerald-500 h-full w-[65%] group-hover:w-[75%] transition-all duration-1000" />
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold z-10 transition-all group-hover:text-emerald-300 tracking-[0.1em]">75% OF MONTHLY TARGET REACHED</p>

                    <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
                </div>

                {/* Placeholder for future detailed stats cards */}
                {[1, 2, 3].map(i => (
                    <div key={i} className="p-8 bg-white/50 border border-gray-100 rounded-[2rem] flex flex-col gap-2 opacity-50 backdrop-blur-sm grayscale group hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                        <div className="w-12 h-12 rounded-2xl bg-gray-100" />
                        <div className="h-4 bg-gray-100 rounded-full w-24" />
                        <div className="h-2 bg-gray-100 rounded-full w-full" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminDashboardPage;
