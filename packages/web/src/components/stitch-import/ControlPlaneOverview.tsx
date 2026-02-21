
import React from 'react';

const ControlPlaneOverview: React.FC = () => {
  return (
    <main className="flex-1 overflow-y-auto pb-24 no-scrollbar">
      <header className="sticky top-0 z-20 bg-surface-header/95 backdrop-blur-md border-b border-border-strong px-4 py-3 flex items-center justify-between shadow-sm-subtle">
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center shadow-md shadow-blue-900/10">
            <span className="material-symbols-outlined text-[20px]">domain</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider leading-none mb-0.5">Workspace</span>
            <div className="flex items-center gap-1 text-sm font-bold text-text-primary leading-none">
              Acme Corp / Prod
              <span className="material-symbols-outlined text-[16px] text-text-muted group-hover:text-primary transition-colors">expand_more</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center cursor-pointer relative" htmlFor="freeze-toggle">
            <div className="relative">
              <input className="sr-only" id="freeze-toggle" type="checkbox" />
              <div className="w-10 h-6 bg-gray-200 rounded-full shadow-inner border border-gray-300 transition-colors duration-300 ease-in-out peer-checked:bg-red-100 peer-checked:border-red-200"></div>
              <div className="absolute w-4 h-4 bg-white rounded-full shadow border border-gray-300 left-1 top-1 transition-transform duration-300 ease-in-out peer-checked:translate-x-full peer-checked:border-red-500 peer-checked:bg-red-600"></div>
            </div>
            <span className="sr-only">Freeze System</span>
          </label>
          <button className="w-9 h-9 rounded-full bg-white border border-border-strong flex items-center justify-center text-text-secondary shadow-sm hover:bg-gray-50 relative">
            <span className="material-symbols-outlined text-[20px]">account_circle</span>
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
          </button>
        </div>
      </header>
      <div className="w-full flex justify-center py-3">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-text-muted/70 bg-gray-100 px-3 py-1 rounded-full">
          <span className="material-symbols-outlined text-[12px] animate-spin">sync</span>
          Live Updates
        </div>
      </div>
      <div className="px-4 mb-6">
        <div className="relative overflow-hidden rounded-xl bg-white border-l-4 border-red-500 shadow-card p-4 flex items-start gap-3">
          <div className="bg-red-50 rounded-full p-2 shrink-0 flex items-center justify-center border border-red-100">
            <span className="material-symbols-outlined text-red-600 text-[20px]">emergency_home</span>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-900 mb-0.5 flex items-center gap-2">
              CRITICAL ALERT
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">P0</span>
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">Webhook latency &gt; 500ms in EU-West region. Automatic scaling in progress.</p>
          </div>
          <button className="shrink-0 text-gray-400 hover:text-gray-600 p-1">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      </div>
      <div className="px-4 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            System Health
          </h2>
          <span className="px-2.5 py-1 rounded-md bg-green-50 text-green-700 text-[11px] font-bold uppercase tracking-wider border border-green-200 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block mr-1"></span>
            Stable
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-surface-card rounded-xl p-4 border border-border-subtle flex flex-col justify-between h-[120px] shadow-card hover:border-border-strong transition-colors">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Uptime (24h)</span>
              <span className="material-symbols-outlined text-primary text-[20px] bg-blue-50 p-1 rounded-md">activity_zone</span>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 tracking-tight">99.98<span className="text-lg text-gray-500">%</span></div>
              <div className="flex items-center gap-1 mt-1 text-xs font-bold text-green-600 bg-green-50 w-fit px-1.5 py-0.5 rounded">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                +0.01%
              </div>
            </div>
          </div>
          <div className="bg-surface-card rounded-xl p-4 border border-border-subtle flex flex-col justify-between h-[120px] shadow-card hover:border-border-strong transition-colors">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Backlog Queue</span>
              <span className="material-symbols-outlined text-orange-600 text-[20px] bg-orange-50 p-1 rounded-md">layers</span>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 tracking-tight">452</div>
              <div className="flex items-center gap-1 mt-1 text-xs font-bold text-green-600 bg-green-50 w-fit px-1.5 py-0.5 rounded">
                <span className="material-symbols-outlined text-[14px]">trending_down</span>
                -12% Items
              </div>
            </div>
          </div>
        </div>
        <div className="w-full bg-white rounded-xl p-5 border border-orange-200 shadow-card relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-full bg-gradient-to-l from-orange-50 via-white to-white opacity-80"></div>
          <div className="relative z-10 flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-orange-800 uppercase tracking-wider flex items-center gap-2 bg-orange-100/50 px-2 py-1 rounded">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              Mismatch Anomaly Risk
            </span>
            <span className="material-symbols-outlined text-orange-600 text-[22px]">warning</span>
          </div>
          <div className="relative z-10 flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">12 Spikes</div>
              <div className="text-xs font-medium text-gray-500 mt-1">Detected in last 60m</div>
            </div>
            <button className="bg-white text-gray-700 text-xs font-bold px-4 py-2 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 hover:text-primary hover:border-primary/30 transition-all">
              View Log
            </button>
          </div>
        </div>
      </div>
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Active Runs</h2>
          <button className="text-primary text-sm font-semibold hover:text-primary-hover transition-colors bg-blue-50 px-3 py-1 rounded-full">See All (3)</button>
        </div>
        <div className="space-y-4">
          <div className="bg-surface-card rounded-xl p-0 border border-border-subtle shadow-card overflow-hidden">
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-primary shadow-sm">
                    <span className="material-symbols-outlined">sync</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Run #8821</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">Running</span>
                      <span className="text-xs text-gray-400 font-mono font-medium">2m 14s</span>
                    </div>
                  </div>
                </div>
                <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">more_vert</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 py-3 border-t border-dashed border-gray-200">
                <div>
                  <div className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1">Volume</div>
                  <div className="text-sm font-bold text-gray-900">$1.2M</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1">Trace ID</div>
                  <div className="text-sm font-mono text-gray-600 flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded w-fit border border-gray-200">
                    trc_8a9...b2
                    <button className="text-gray-400 hover:text-primary ml-1">
                      <span className="material-symbols-outlined text-[14px]">content_copy</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex border-t border-gray-200 bg-gray-50/50">
              <button className="flex-1 h-10 text-red-600 text-xs font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5 border-r border-gray-200">
                <span className="material-symbols-outlined text-[18px]">cancel</span>
                Abort
              </button>
              <button className="flex-1 h-10 text-gray-700 text-xs font-bold hover:bg-gray-100 transition-colors flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">visibility</span>
                Details
              </button>
            </div>
          </div>
          <div className="bg-surface-card rounded-xl p-0 border border-border-subtle shadow-card overflow-hidden">
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
                    <span className="material-symbols-outlined">replay</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Run #8820</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Retrying</span>
                      <span className="text-xs text-gray-400 font-mono font-medium">0m 45s</span>
                    </div>
                  </div>
                </div>
                <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">more_vert</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 py-3 border-t border-dashed border-gray-200">
                <div>
                  <div className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1">Volume</div>
                  <div className="text-sm font-bold text-gray-900">$850K</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1">Trace ID</div>
                  <div className="text-sm font-mono text-gray-600 flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded w-fit border border-gray-200">
                    trc_2c4...e1
                    <button className="text-gray-400 hover:text-primary ml-1">
                      <span className="material-symbols-outlined text-[14px]">content_copy</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex border-t border-gray-200 bg-gray-50/50">
              <button className="flex-1 h-10 text-red-600 text-xs font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5 border-r border-gray-200">
                <span className="material-symbols-outlined text-[18px]">cancel</span>
                Abort
              </button>
              <button className="flex-1 h-10 text-gray-700 text-xs font-bold hover:bg-gray-100 transition-colors flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">visibility</span>
                Details
              </button>
            </div>
          </div>
          <div className="bg-surface-card rounded-xl p-0 border border-border-subtle shadow-sm opacity-80 overflow-hidden">
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600">
                    <span className="material-symbols-outlined">pending</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Run #8819</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200">Queued</span>
                      <span className="text-xs text-gray-400 font-mono font-medium">--:--</span>
                    </div>
                  </div>
                </div>
                <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">more_vert</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 py-3 border-t border-dashed border-gray-200">
                <div>
                  <div className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1">Volume</div>
                  <div className="text-sm font-bold text-gray-900">$3.4M</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1">Trace ID</div>
                  <div className="text-sm font-mono text-gray-600 flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded w-fit border border-gray-200">
                    trc_x91...p0
                    <button className="text-gray-400 hover:text-primary ml-1">
                      <span className="material-symbols-outlined text-[14px]">content_copy</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex border-t border-gray-200 bg-gray-50/50">
              <button className="flex-1 h-10 text-gray-700 text-xs font-bold hover:bg-gray-100 transition-colors flex items-center justify-center gap-1.5 w-full">
                <span className="material-symbols-outlined text-[18px]">visibility</span>
                Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ControlPlaneOverview;
