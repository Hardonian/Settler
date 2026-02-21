
import React from 'react';

const ResultsTable: React.FC = () => {
  return (
    <main className="flex-1 overflow-y-auto overflow-x-hidden pb-24">
      {/* Filter Pills */}
      <div className="flex gap-2 px-4 py-4 overflow-x-auto no-scrollbar whitespace-nowrap">
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-white text-sm font-medium shadow-sm shadow-primary/20">
          <span>All Status</span>
          <span className="material-symbols-outlined text-[16px]">expand_more</span>
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-200 dark:bg-surface-dark border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium">
          <span className="material-symbols-outlined text-[16px] text-slate-400">calendar_today</span>
          <span>Last 24h</span>
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-200 dark:bg-surface-dark border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium">
          <span className="material-symbols-outlined text-[16px] text-slate-400">alt_route</span>
          <span>Payments_v2</span>
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-200 dark:bg-surface-dark border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium">
          <span className="material-symbols-outlined text-[16px] text-slate-400">filter_list</span>
          <span>More</span>
        </button>
      </div>
      {/* Summary Statistics */}
      <div className="grid grid-cols-3 gap-3 px-4 mb-6">
        <div className="flex flex-col gap-1 p-3 rounded-xl bg-white dark:bg-surface-dark border border-emerald-500/20 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-2 opacity-10">
            <span className="material-symbols-outlined text-4xl text-emerald-500">check_circle</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium z-10">Matched</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white z-10">982</span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5 z-10">
            <span className="material-symbols-outlined text-[12px]">trending_up</span> 12%
          </span>
        </div>
        <div className="flex flex-col gap-1 p-3 rounded-xl bg-white dark:bg-surface-dark border border-rose-500/20 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 p-2 opacity-10">
            <span className="material-symbols-outlined text-4xl text-rose-500">cancel</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium z-10">Mismatch</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white z-10">14</span>
          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-0.5 z-10">
            <span className="material-symbols-outlined text-[12px]">trending_up</span> 2%
          </span>
        </div>
        <div className="flex flex-col gap-1 p-3 rounded-xl bg-white dark:bg-surface-dark border border-amber-500/20 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 p-2 opacity-10">
            <span className="material-symbols-outlined text-4xl text-amber-500">warning</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium z-10">Review</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white z-10">244</span>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-0.5 z-10">
            <span className="material-symbols-outlined text-[12px]">trending_down</span> 5%
          </span>
        </div>
      </div>
      {/* Results List */}
      <div className="px-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Recent Transactions</h2>
        {/* Card Item: Mismatch (Active/Open State Simulation) */}
        <div className="relative bg-white dark:bg-surface-dark rounded-xl p-4 shadow-sm border-l-4 border-rose-500 active:scale-[0.99] transition-transform">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-500 text-[20px]">error</span>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/10 px-2 py-0.5 rounded">Mismatched</span>
            </div>
            <span className="text-xs text-slate-400">10:42 AM</span>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <div className="text-sm text-slate-500 dark:text-slate-400 font-mono mb-1">Trace: <span className="text-slate-900 dark:text-white font-medium">8a9f...2b1</span></div>
              <div className="text-sm font-medium text-slate-900 dark:text-white">Tx Ref: #STR-29384</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pipeline: Payments_v2</div>
            </div>
            <button className="text-primary text-sm font-medium flex items-center">
              Details <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>
        {/* Card Item: Review Needed */}
        <div className="relative bg-white dark:bg-surface-dark rounded-xl p-4 shadow-sm border-l-4 border-amber-500 active:scale-[0.99] transition-transform">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500 text-[20px]">warning</span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 px-2 py-0.5 rounded">Needs Review</span>
            </div>
            <span className="text-xs text-slate-400">10:38 AM</span>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <div className="text-sm text-slate-500 dark:text-slate-400 font-mono mb-1">Trace: <span className="text-slate-900 dark:text-white font-medium">7c2d...9a4</span></div>
              <div className="text-sm font-medium text-slate-900 dark:text-white">Tx Ref: #INT-99210</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pipeline: Ledger_Main</div>
            </div>
            <button className="text-slate-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[20px]">more_vert</span>
            </button>
          </div>
        </div>
        {/* Card Item: Matched */}
        <div className="relative bg-white dark:bg-surface-dark rounded-xl p-4 shadow-sm border-l-4 border-emerald-500 active:scale-[0.99] transition-transform">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500 text-[20px]">check_circle</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-0.5 rounded">Matched</span>
            </div>
            <span className="text-xs text-slate-400">10:35 AM</span>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <div className="text-sm text-slate-500 dark:text-slate-400 font-mono mb-1">Trace: <span className="text-slate-900 dark:text-white font-medium">b41e...0f2</span></div>
              <div className="text-sm font-medium text-slate-900 dark:text-white">Tx Ref: #STR-29383</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pipeline: Payments_v2</div>
            </div>
            <button className="text-slate-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[20px]">more_vert</span>
            </button>
          </div>
        </div>
        {/* Card Item: Matched */}
        <div className="relative bg-white dark:bg-surface-dark rounded-xl p-4 shadow-sm border-l-4 border-emerald-500 active:scale-[0.99] transition-transform">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500 text-[20px]">check_circle</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-0.5 rounded">Matched</span>
            </div>
            <span className="text-xs text-slate-400">10:31 AM</span>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <div className="text-sm text-slate-500 dark:text-slate-400 font-mono mb-1">Trace: <span className="text-slate-900 dark:text-white font-medium">a12d...8c3</span></div>
              <div className="text-sm font-medium text-slate-900 dark:text-white">Tx Ref: #STR-29382</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pipeline: Payments_v2</div>
            </div>
            <button className="text-slate-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[20px]">more_vert</span>
            </button>
          </div>
        </div>
        <div className="h-24 w-full"></div> {/* Spacer for bottom sheet / nav */}
      </div>
    </main>
  );
};

export default ResultsTable;
