
import React from 'react';

const ConnectionsTable: React.FC = () => {
  return (
    <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-24 bg-slate-50">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[20px]">search</span>
        <input className="w-full bg-white border border-slate-200 rounded-lg py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary focus:border-primary shadow-sm placeholder-slate-400 text-slate-700" placeholder="Search connections..." type="text" />
      </div>
      <div className="group bg-white rounded-xl p-4 border border-slate-200 shadow-card hover:shadow-card-hover active:scale-[0.99] transition-all duration-200 ease-out cursor-pointer relative overflow-hidden">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#635BFF]/10 border border-[#635BFF]/20 flex items-center justify-center text-[#635BFF] font-bold text-lg">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 leading-tight">Stripe Payments</h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Production Environment</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="material-symbols-outlined text-[16px] font-variation-settings-FILL1">check_circle</span>
            <span className="text-[11px] font-bold uppercase tracking-wide">Healthy</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-3 mt-1">
          <div className="flex gap-6">
            <div className="flex flex-col">
              <span className="text-slate-400 font-medium mb-0.5 uppercase text-[10px] tracking-wider">Error Rate</span>
              <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded w-fit">0.1%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-400 font-medium mb-0.5 uppercase text-[10px] tracking-wider">Freshness</span>
              <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded w-fit">2m ago</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors text-xl">arrow_forward</span>
        </div>
      </div>
      <div className="group bg-white rounded-xl p-4 border border-red-200 shadow-sm active:scale-[0.99] transition-all duration-200 ease-out cursor-pointer relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-600"></div>
        <div className="flex items-start justify-between mb-3 pl-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#29B5E8]/10 border border-[#29B5E8]/20 flex items-center justify-center text-[#29B5E8]">
              <span className="material-symbols-outlined">ac_unit</span>
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 leading-tight">Snowflake Warehouse</h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Analytics DB</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 text-red-800 border border-red-200">
            <span className="material-symbols-outlined text-[16px] font-variation-settings-FILL1">error</span>
            <span className="text-[11px] font-bold uppercase tracking-wide">Error</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-3 mt-1 pl-2">
          <div className="flex gap-6">
            <div className="flex flex-col">
              <span className="text-slate-400 font-medium mb-0.5 uppercase text-[10px] tracking-wider">Error Rate</span>
              <span className="font-mono font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded w-fit border border-red-100">12%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-400 font-medium mb-0.5 uppercase text-[10px] tracking-wider">Freshness</span>
              <span className="font-mono font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded w-fit border border-red-100">4h ago</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors text-xl">arrow_forward</span>
        </div>
      </div>
      <div className="group bg-white rounded-xl p-4 border border-slate-200 shadow-card hover:shadow-card-hover active:scale-[0.99] transition-all duration-200 ease-out cursor-pointer relative overflow-hidden">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#00A1E0]/10 border border-[#00A1E0]/20 flex items-center justify-center text-[#00A1E0]">
              <span className="material-symbols-outlined">cloud</span>
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 leading-tight">Salesforce CRM</h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Sales Data</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
            <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
            <span className="text-[11px] font-bold uppercase tracking-wide">Syncing</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-3 mt-1">
          <div className="flex gap-6">
            <div className="flex flex-col">
              <span className="text-slate-400 font-medium mb-0.5 uppercase text-[10px] tracking-wider">Error Rate</span>
              <span className="font-mono font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded w-fit border border-slate-100">--</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-400 font-medium mb-0.5 uppercase text-[10px] tracking-wider">Freshness</span>
              <span className="font-mono font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded w-fit border border-slate-100">--</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors text-xl">arrow_forward</span>
        </div>
      </div>
      <div className="group bg-white rounded-xl p-4 border border-slate-200 shadow-card hover:shadow-card-hover active:scale-[0.99] transition-all duration-200 ease-out cursor-pointer relative overflow-hidden">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#336791]/10 border border-[#336791]/20 flex items-center justify-center text-[#336791]">
              <span className="material-symbols-outlined">database</span>
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 leading-tight">Production Postgres</h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5">User Data</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="material-symbols-outlined text-[16px] font-variation-settings-FILL1">check_circle</span>
            <span className="text-[11px] font-bold uppercase tracking-wide">Healthy</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-3 mt-1">
          <div className="flex gap-6">
            <div className="flex flex-col">
              <span className="text-slate-400 font-medium mb-0.5 uppercase text-[10px] tracking-wider">Error Rate</span>
              <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded w-fit">0.02%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-400 font-medium mb-0.5 uppercase text-[10px] tracking-wider">Freshness</span>
              <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded w-fit">10m ago</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors text-xl">arrow_forward</span>
        </div>
      </div>
    </main>
  );
};

export default ConnectionsTable;
