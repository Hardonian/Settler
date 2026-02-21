
import React from 'react';

const PipelineDrawer: React.FC = () => {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 transform rounded-t-3xl bg-background-light dark:bg-[#111a22] border-t border-slate-200 dark:border-slate-800 shadow-2xl transition-transform translate-y-[calc(100%-80px)] hover:translate-y-0 group">
      {/* Drag Handle */}
      <div className="flex w-full justify-center pt-3 pb-1 cursor-grab">
        <div className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-600"></div>
      </div>
      <div className="flex flex-col h-[85vh] overflow-y-auto px-5 pb-6">
        {/* Header (Visible when collapsed) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800/50">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Selected Pipeline</span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">payment_reconciliation_v2</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500 ring-1 ring-inset ring-green-500/20">Running</span>
            <div aria-checked="true" className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-primary transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2" role="switch">
              <span className="sr-only">Use setting</span>
              <span aria-hidden="true" className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-5"></span>
            </div>
          </div>
        </div>
        {/* Detail Content */}
        <div className="space-y-6 pt-6 opacity-40 group-hover:opacity-100 transition-opacity duration-300">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white dark:bg-[#192633] p-3 border border-slate-200 dark:border-slate-700">
              <div className="text-slate-500 dark:text-slate-400 text-xs mb-1">Latency (P99)</div>
              <div className="text-lg font-bold dark:text-white">245ms</div>
            </div>
            <div className="rounded-xl bg-white dark:bg-[#192633] p-3 border border-slate-200 dark:border-slate-700">
              <div className="text-slate-500 dark:text-slate-400 text-xs mb-1">Processed</div>
              <div className="text-lg font-bold dark:text-white">1.2M</div>
            </div>
          </div>
          {/* Flow Visualization */}
          <div className="rounded-xl bg-white dark:bg-[#192633] p-4 border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-4 relative">
            {/* Connecting Line */}
            <div className="absolute left-[24px] top-8 bottom-8 w-0.5 bg-slate-200 dark:bg-slate-700"></div>
            {/* Step 1 */}
            <div className="relative w-full flex items-center gap-4 z-10">
              <div className="h-12 w-12 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-500 shrink-0 bg-white dark:bg-[#192633]">
                <span className="material-symbols-outlined">input</span>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Stripe Connect</h4>
                <p className="text-xs text-slate-500">Source: API v2</p>
              </div>
              <button className="text-slate-400">
                <span className="material-symbols-outlined">edit</span>
              </button>
            </div>
            {/* Step 2 */}
            <div className="relative w-full flex items-center gap-4 z-10">
              <div className="h-12 w-12 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-500 shrink-0 bg-white dark:bg-[#192633]">
                <span className="material-symbols-outlined">transform</span>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Normalization</h4>
                <p className="text-xs text-slate-500">Map: standard_currency</p>
              </div>
              <button className="text-slate-400">
                <span className="material-symbols-outlined">edit</span>
              </button>
            </div>
            {/* Step 3 */}
            <div className="relative w-full flex items-center gap-4 z-10">
              <div className="h-12 w-12 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-500 shrink-0 bg-white dark:bg-[#192633]">
                <span className="material-symbols-outlined">output</span>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">S3 Bucket</h4>
                <p className="text-xs text-slate-500">Destination: settled-trans</p>
              </div>
              <button className="text-slate-400">
                <span className="material-symbols-outlined">edit</span>
              </button>
            </div>
          </div>
          {/* Config as Code Action */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Configuration</h3>
            <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-lg hover:bg-blue-600 active:scale-[0.98] transition-all">
              <span className="material-symbols-outlined">commit</span>
              Generate Patch / Open PR
            </button>
            <p className="text-xs text-center text-slate-500 px-4">This will generate a Terraform configuration patch based on current settings and open a PR in your connected repository.</p>
          </div>
          {/* Version History */}
          <div className="flex flex-col gap-3 pt-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Deployment History</h3>
            <div className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#192633] divide-y divide-slate-100 dark:divide-slate-800">
              {/* History Item 1 */}
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">v1.4.2</span>
                    <span className="text-xs text-slate-500">Deployed by @jdoe</span>
                  </div>
                </div>
                <span className="text-xs font-mono text-slate-400">2d ago</span>
              </div>
              {/* History Item 2 */}
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-slate-400"></div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">v1.4.1</span>
                    <span className="text-xs text-slate-500">Rolled back (Auto)</span>
                  </div>
                </div>
                <span className="text-xs font-mono text-slate-400">5d ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PipelineDrawer;
