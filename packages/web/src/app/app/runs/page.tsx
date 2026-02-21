
import React from 'react';

const RunsPage: React.FC = () => {
  return (
    <div className="bg-background min-h-screen text-text-main font-display pb-24 relative selection:bg-primary/20">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border-light">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight text-text-main">Execution Control</h1>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-full hover:bg-surface-highlight transition-colors text-text-secondary">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>
          </div>
        </div>
        <div className="px-4 pb-4">
          <div className="bg-surface rounded-xl p-4 border border-border-light shadow-sm flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <h2 className="font-semibold text-sm text-text-main">Queue is Active</h2>
              </div>
              <p className="text-xs text-text-secondary">2 active runs processing</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input defaultChecked className="sr-only peer" type="checkbox" value="" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
            </label>
          </div>
        </div>
      </header>
      <main className="px-4 py-2 space-y-6">
        <section>
          <button className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
            <span className="material-symbols-outlined">play_arrow</span>
            Trigger New Run
          </button>
          <div className="flex gap-2 mt-3 justify-center">
            <div className="flex items-center gap-2 px-3 py-1 bg-surface-highlight rounded-full border border-border-light">
              <span className="material-symbols-outlined text-amber-600 text-[16px]">science</span>
              <span className="text-xs text-text-secondary font-medium">Dry-Run: Off</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-surface-highlight rounded-full border border-border-light">
              <span className="material-symbols-outlined text-purple-600 text-[16px]">low_priority</span>
              <span className="text-xs text-text-secondary font-medium">Priority: High</span>
            </div>
          </div>
        </section>
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-text-main">Active Runs</h3>
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-primary border border-blue-100 text-xs font-bold">2 Running</span>
          </div>
          <div className="space-y-3">
            <div className="bg-white rounded-xl p-4 border border-border-light shadow-[0_2px_8px_rgba(0,0,0,0.04)] relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-primary"></div>
              <div className="flex justify-between items-start mb-3 pl-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-text-secondary font-medium">#8821</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wider">Reconcile</span>
                  </div>
                  <h4 className="font-bold text-text-main mt-1 text-base">Daily Batch Settlement</h4>
                </div>
                <button aria-label="Abort Run" className="text-text-tertiary hover:text-red-500 transition-colors p-1 bg-gray-50 hover:bg-red-50 rounded-lg">
                  <span className="material-symbols-outlined">cancel</span>
                </button>
              </div>
              <div className="flex items-center justify-between text-xs text-text-secondary mb-2 pl-2">
                <div className="flex items-center gap-1 font-mono cursor-pointer hover:text-primary transition-colors bg-surface-highlight px-2 py-1 rounded border border-border-light">
                  <span className="material-symbols-outlined text-[14px] text-text-tertiary">fingerprint</span>
                  <span className="font-bold text-text-main">8f7a...9b1</span>
                </div>
                <span className="font-semibold text-primary">65%</span>
              </div>
              <div className="w-full bg-surface-highlight rounded-full h-2.5 mb-4 overflow-hidden pl-2">
                <div className="bg-primary h-2.5 rounded-full relative" style={{ width: '65%' }}>
                  <div className="absolute inset-0 bg-white/30 w-full h-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12"></div>
                </div>
              </div>
              <div className="flex gap-2 pl-2">
                <button className="flex-1 py-2 px-3 rounded-lg border border-border-light bg-surface hover:bg-surface-highlight text-xs font-semibold text-text-secondary transition-colors">
                  View Live Logs
                </button>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-border-light shadow-[0_2px_8px_rgba(0,0,0,0.04)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
              <div className="flex justify-between items-start mb-3 pl-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-text-secondary font-medium">#8822</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-wider">Dry-Run</span>
                  </div>
                  <h4 className="font-bold text-text-main mt-1 text-base">Staging Sync</h4>
                </div>
                <button aria-label="Abort Run" className="text-text-tertiary hover:text-red-500 transition-colors p-1 bg-gray-50 hover:bg-red-50 rounded-lg">
                  <span className="material-symbols-outlined">cancel</span>
                </button>
              </div>
              <div className="flex items-center justify-between text-xs text-text-secondary mb-2 pl-2">
                <div className="flex items-center gap-1 font-mono cursor-pointer hover:text-primary transition-colors bg-surface-highlight px-2 py-1 rounded border border-border-light">
                  <span className="material-symbols-outlined text-[14px] text-text-tertiary">fingerprint</span>
                  <span className="font-bold text-text-main">2c3d...a4f</span>
                </div>
                <span className="font-semibold text-amber-600">12%</span>
              </div>
              <div className="w-full bg-surface-highlight rounded-full h-2.5 mb-4 overflow-hidden pl-2">
                <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: '12%' }}></div>
              </div>
              <div className="flex gap-2 pl-2">
                <button className="flex-1 py-2 px-3 rounded-lg border border-border-light bg-surface hover:bg-surface-highlight text-xs font-semibold text-text-secondary transition-colors">
                  View Live Logs
                </button>
              </div>
            </div>
          </div>
        </section>
        <section className="pb-6">
          <h3 className="text-lg font-bold text-text-main mb-3">Run History</h3>
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 mb-2">
            <button className="px-4 py-1.5 rounded-full bg-primary text-white text-sm font-semibold whitespace-nowrap shadow-sm">All Runs</button>
            <button className="px-4 py-1.5 rounded-full bg-white border border-border-light text-text-secondary text-sm font-medium whitespace-nowrap hover:bg-surface-highlight hover:text-text-main transition-colors">Success</button>
            <button className="px-4 py-1.5 rounded-full bg-white border border-border-light text-text-secondary text-sm font-medium whitespace-nowrap hover:bg-surface-highlight hover:text-text-main transition-colors">Failed</button>
            <button className="px-4 py-1.5 rounded-full bg-white border border-border-light text-text-secondary text-sm font-medium whitespace-nowrap hover:bg-surface-highlight hover:text-text-main transition-colors">Dry-Run</button>
          </div>
          <div className="bg-white rounded-xl border border-border-light divide-y divide-border-light shadow-sm">
            <div className="p-4 flex items-center justify-between group hover:bg-surface-highlight transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-emerald-600 text-sm font-bold">check_circle</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-text-main text-sm">Run #8820</span>
                    <span className="text-xs text-text-tertiary">2m ago</span>
                  </div>
                  <span className="text-xs font-mono text-text-secondary bg-surface rounded px-1 -ml-1 mt-0.5 inline-block w-fit font-semibold">Trace: 9a2b...3c4</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 rounded-lg text-text-tertiary hover:text-primary hover:bg-primary/10 transition-colors" title="View Trace">
                  <span className="material-symbols-outlined text-[20px]">visibility</span>
                </button>
                <button className="p-2 rounded-lg text-text-tertiary hover:text-primary hover:bg-primary/10 transition-colors" title="View Artifacts">
                  <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                </button>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between group hover:bg-surface-highlight transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-red-600 text-sm font-bold">error</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-text-main text-sm">Run #8819</span>
                    <span className="text-xs text-text-tertiary">15m ago</span>
                  </div>
                  <span className="text-xs font-mono text-text-secondary bg-surface rounded px-1 -ml-1 mt-0.5 inline-block w-fit font-semibold">Trace: 7d8e...1f2</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 rounded-lg text-text-tertiary hover:text-primary hover:bg-primary/10 transition-colors" title="View Trace">
                  <span className="material-symbols-outlined text-[20px]">visibility</span>
                </button>
                <button className="p-2 rounded-lg text-text-tertiary hover:text-primary hover:bg-primary/10 transition-colors" title="View Artifacts">
                  <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                </button>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between group hover:bg-surface-highlight transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-emerald-600 text-sm font-bold">check_circle</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-text-main text-sm">Run #8818</span>
                    <span className="text-xs text-text-tertiary">1h ago</span>
                  </div>
                  <span className="text-xs font-mono text-text-secondary bg-surface rounded px-1 -ml-1 mt-0.5 inline-block w-fit font-semibold">Trace: 4b5c...8d9</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 rounded-lg text-text-tertiary hover:text-primary hover:bg-primary/10 transition-colors" title="View Trace">
                  <span className="material-symbols-outlined text-[20px]">visibility</span>
                </button>
                <button className="p-2 rounded-lg text-text-tertiary hover:text-primary hover:bg-primary/10 transition-colors" title="View Artifacts">
                  <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                </button>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between group hover:bg-surface-highlight transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-amber-600 text-sm font-bold">science</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-text-main text-sm">Run #8817</span>
                    <span className="text-xs text-text-tertiary">3h ago</span>
                  </div>
                  <span className="text-xs font-mono text-text-secondary bg-surface rounded px-1 -ml-1 mt-0.5 inline-block w-fit font-semibold">Trace: 1a2b...3c4</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 rounded-lg text-text-tertiary hover:text-primary hover:bg-primary/10 transition-colors" title="View Trace">
                  <span className="material-symbols-outlined text-[20px]">visibility</span>
                </button>
                <button className="p-2 rounded-lg text-text-tertiary hover:text-primary hover:bg-primary/10 transition-colors" title="View Artifacts">
                  <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                </button>
              </div>
            </div>
          </div>
          <button className="w-full mt-4 py-3 text-sm text-text-secondary hover:text-primary font-medium text-center border border-border-light rounded-xl bg-white hover:bg-surface-highlight transition-all">
            View Older Runs
          </button>
        </section>
      </main>
    </div>
  );
};

export default RunsPage;
