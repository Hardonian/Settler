
import React from 'react';

const TracesPage: React.FC = () => {
  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display antialiased selection:bg-primary/30">
      <div className="relative min-h-screen w-full flex flex-col mx-auto max-w-md bg-background-light dark:bg-background-dark shadow-2xl overflow-hidden border-x border-slate-200 dark:border-slate-800">
        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-md bg-background-light/90 dark:bg-background-dark/90 border-b border-slate-200 dark:border-slate-800 px-4 pt-12 pb-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button className="text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-white transition-colors">
                <span className="material-symbols-outlined text-2xl">arrow_back</span>
              </button>
              <h1 className="text-lg font-bold tracking-tight">Trace Explorer</h1>
            </div>
            <button className="text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-white transition-colors relative">
              <span className="material-symbols-outlined text-2xl">notifications</span>
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-error"></span>
            </button>
          </div>
          {/* Search */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </div>
            <input className="w-full bg-white dark:bg-surface-darker border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent block pl-10 p-2.5 placeholder-slate-400 transition-all shadow-sm" placeholder="Search Trace ID..." type="text" value="8f7a-2b1c" />
            <div className="absolute inset-y-0 right-0 pr-1.5 flex items-center">
              <button className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                Trace ID
              </button>
            </div>
          </div>
          {/* Quick Filters */}
          <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
            <button className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary dark:text-primary-400 text-xs font-medium rounded-full border border-primary/20">
              <span className="material-symbols-outlined text-[16px]">filter_list</span>
              Workspace
            </button>
            <button className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-surface-dark text-slate-600 dark:text-slate-400 text-xs font-medium rounded-full border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600">
              Pipeline
            </button>
            <button className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-surface-dark text-slate-600 dark:text-slate-400 text-xs font-medium rounded-full border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600">
              Date Range
            </button>
          </div>
        </header>
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-24">
          {/* Trace Summary Card */}
          <div className="p-4">
            <div className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-slate-200 dark:border-slate-700/50 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-50">
                <span className="material-symbols-outlined text-6xl text-slate-100 dark:text-slate-800 -rotate-12">fingerprint</span>
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Trace ID</p>
                    <div className="flex items-center gap-2">
                      <h2 className="font-mono text-xl font-bold text-slate-900 dark:text-white">#8f7a-2b1c</h2>
                      <button className="text-slate-400 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[16px]">content_copy</span>
                      </button>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                    Success
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Duration</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-200">420ms</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Started</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-200">Today, 10:42:15 AM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Timeline Section */}
          <div className="px-4 pb-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">timeline</span>
              Trace Journey
            </h3>
            <div className="relative pl-3">
              {/* Vertical Line */}
              <div className="absolute left-[19px] top-2 bottom-6 w-[2px] bg-slate-200 dark:bg-slate-700"></div>
              {/* Step 1: Sync (Completed) */}
              <div className="relative flex gap-4 mb-6 group">
                <div className="absolute left-[19px] top-8 h-full w-[2px] bg-primary origin-top"></div>
                <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center border-4 border-white dark:border-background-dark shadow-glow">
                  <span className="material-symbols-outlined text-white text-[16px]">sync_alt</span>
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Sync</h4>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">45ms</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-surface-dark/50 rounded p-2 border border-slate-100 dark:border-slate-800">
                    Source: <span className="font-mono text-primary">Postgres_Primary</span>
                  </div>
                </div>
              </div>
              {/* Step 2: Run (Completed) */}
              <div className="relative flex gap-4 mb-6">
                <div className="absolute left-[19px] top-8 h-full w-[2px] bg-primary origin-top"></div>
                <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center border-4 border-white dark:border-background-dark shadow-glow">
                  <span className="material-symbols-outlined text-white text-[16px]">play_arrow</span>
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Run</h4>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">120ms</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Executed pipeline <span className="text-slate-700 dark:text-slate-300 font-medium">Daily_Recon_v2</span></p>
                </div>
              </div>
              {/* Step 3: Rules (Completed) */}
              <div className="relative flex gap-4 mb-6">
                <div className="absolute left-[19px] top-8 h-full w-[2px] bg-success origin-top"></div>
                <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center border-4 border-white dark:border-background-dark shadow-glow">
                  <span className="material-symbols-outlined text-white text-[16px]">gavel</span>
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Rules</h4>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">85ms</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-success/10 text-success border border-success/20">
                      Match: 100%
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      3 Rules Applied
                    </span>
                  </div>
                </div>
              </div>
              {/* Step 4: Results (Warning/Attention) */}
              <div className="relative flex gap-4 mb-6">
                <div className="absolute left-[19px] top-8 h-full w-[2px] bg-slate-200 dark:bg-slate-700"></div>
                <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-success flex items-center justify-center border-4 border-white dark:border-background-dark">
                  <span className="material-symbols-outlined text-white text-[16px]">check_circle</span>
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Results</h4>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">150ms</span>
                  </div>
                  <div className="bg-surface-darker rounded-lg p-2 font-mono text-[10px] text-slate-300 border border-slate-700 overflow-x-auto">
                    <pre>{'{"status": "ok", "matched": 452, "unmatched": 0}'}</pre>
                  </div>
                </div>
              </div>
              {/* Step 5: Review (Pending) */}
              <div className="relative flex gap-4 mb-6">
                <div className="absolute left-[19px] top-8 h-full w-[2px] bg-slate-200 dark:bg-slate-700"></div>
                <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-surface-dark border border-slate-300 dark:border-slate-600 flex items-center justify-center border-4 border-white dark:border-background-dark">
                  <span className="material-symbols-outlined text-slate-400 text-[16px]">visibility</span>
                </div>
                <div className="flex-1 pt-1 opacity-60">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Review</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Auto-approved based on rules</p>
                </div>
              </div>
              {/* Step 6: Artifacts */}
              <div className="relative flex gap-4">
                <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-surface-dark border border-slate-300 dark:border-slate-600 flex items-center justify-center border-4 border-white dark:border-background-dark">
                  <span className="material-symbols-outlined text-slate-400 text-[16px]">description</span>
                </div>
                <div className="flex-1 pt-1 opacity-60">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Artifacts</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Generated 2 reports</p>
                </div>
              </div>
            </div>
          </div>
          {/* Related Objects */}
          <div className="p-4 mt-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Context &amp; Relations</h3>
            <div className="grid grid-cols-2 gap-3">
              {/* Card 1 */}
              <div className="bg-white dark:bg-surface-dark p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[16px]">database</span>
                  </div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Connection</span>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">Postgres_Primary</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                  <span className="text-[10px] text-slate-500">Active</span>
                </div>
              </div>
              {/* Card 2 */}
              <div className="bg-white dark:bg-surface-dark p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[16px]">hub</span>
                  </div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Pipeline</span>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">Daily_Recon_v2</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  <span className="text-[10px] text-slate-500">v2.1.0</span>
                </div>
              </div>
            </div>
          </div>
          {/* Raw Data Preview */}
          <div className="px-4 pb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Payload Preview</h3>
              <button className="text-primary text-xs font-medium hover:underline">View Full Log</button>
            </div>
            <div className="bg-slate-900 rounded-lg p-3 border border-slate-700 font-mono text-xs text-slate-300 overflow-hidden relative">
              <div className="absolute top-2 right-2 flex gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500/50"></span>
                <span className="w-2 h-2 rounded-full bg-yellow-500/50"></span>
                <span className="w-2 h-2 rounded-full bg-green-500/50"></span>
              </div>
              <pre className="overflow-x-auto no-scrollbar">
                {`{
  "trace_id": "8f7a-2b1c",
  "timestamp": "2023-10-27T10:42:15Z",
  "source": "api_gateway",
  "meta": {
    "region": "us-east-1",
    "retry_count": 0
  },
  "data": {
    "records_processed": 1500,
    "discrepancies": []
  }
}`}
              </pre>
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none"></div>
            </div>
          </div>
          {/* Bottom Spacer */}
          <div className="h-6"></div>
        </main>
      </div>
    </div>
  );
};

export default TracesPage;
