
import React from 'react';

const IntegrationList: React.FC = () => {
  return (
    <main className="flex-1 px-4 py-6 space-y-8 pb-32">
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-semibold text-slate-800">Active Services</h2>
          <button className="text-xs font-medium text-primary hover:text-primary-dark">View All</button>
        </div>
        <div className="group bg-white rounded-xl border border-slate-200 overflow-hidden shadow-card hover:shadow-lg transition-all duration-300">
          <div className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-md">
                  <svg fill="currentColor" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.285 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">GitHub</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Healthy
                    </span>
                    <span className="text-xs text-slate-500 font-medium">• Repo:Read</span>
                  </div>
                </div>
              </div>
              <div className="relative">
                <button className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                  <span className="material-symbols-outlined text-slate-400">more_vert</span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Expires</p>
                <p className="text-sm font-semibold text-slate-700">28 days</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Privilege</p>
                <div className="flex items-center gap-1 text-amber-600">
                  <span className="material-symbols-outlined text-[14px]">shield</span>
                  <span className="text-xs font-semibold">Read-Only</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="flex-1 h-9 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-primary/10">
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                Rotate Token
              </button>
              <button className="flex-1 h-9 rounded-lg bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors border border-slate-200 flex items-center justify-center gap-1.5 shadow-sm">
                <span className="material-symbols-outlined text-[16px]">settings_ethernet</span>
                Test
              </button>
            </div>
          </div>
          <div className="border-t border-slate-100 bg-slate-50/50">
            <details className="group/accordion">
              <summary className="flex items-center justify-between px-5 py-3 cursor-pointer list-none hover:bg-slate-50 transition-colors">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">history</span>
                  Recent Activity
                </span>
                <span className="material-symbols-outlined text-slate-400 text-[18px] transition-transform group-open/accordion:rotate-180">expand_more</span>
              </summary>
              <div className="px-5 pb-4 space-y-2 border-t border-slate-100 bg-white pt-3">
                <div className="flex justify-between items-center text-xs border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                  <span className="text-slate-500 font-mono">2023-10-24 14:32:01</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">200 OK</span>
                </div>
                <div className="flex justify-between items-center text-xs border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                  <span className="text-slate-500 font-mono">2023-10-24 12:15:44</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">200 OK</span>
                </div>
                <div className="flex justify-between items-center text-xs border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                  <span className="text-slate-500 font-mono">2023-10-23 09:10:12</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-600 border border-amber-100">429 Rate Limit</span>
                </div>
                <a className="block pt-3 text-center text-xs font-medium text-primary hover:text-primary-dark hover:underline" href="#">View Full Audit Log</a>
              </div>
            </details>
          </div>
        </div>
        <div className="group bg-white rounded-xl border border-slate-200 overflow-hidden shadow-card hover:shadow-lg transition-all duration-300">
          <div className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-[#4A154B] flex items-center justify-center text-white shadow-md">
                  <svg fill="currentColor" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.52v-6.315zm8.834-5.04a2.528 2.528 0 0 1 2.521-2.521A2.528 2.528 0 0 1 20.211 10.124a2.528 2.528 0 0 1-2.521 2.521h-2.522v-2.52zm-1.263 0a2.528 2.528 0 0 1-2.521 2.521 2.527 2.527 0 0 1-2.52-2.521V5.042a2.528 2.528 0 0 1 2.52-2.52 2.528 2.528 0 0 1 2.521 2.52v6.314zM8.834 3.79a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.52v2.523H8.834zM10.1 5.042a2.528 2.528 0 0 1 2.52-2.52 2.528 2.528 0 0 1 2.522 2.52v6.313A2.528 2.528 0 0 1 12.62 13.894a2.528 2.528 0 0 1-2.52-2.52V5.042zM15.165 8.834a2.528 2.528 0 0 1 2.52 2.521A2.528 2.528 0 0 1 15.165 13.876a2.528 2.528 0 0 1-2.52-2.521v-2.522h2.52zM13.894 10.1a2.528 2.528 0 0 1-2.52 2.52 2.527 2.527 0 0 1-2.521-2.52v-6.313A2.528 2.528 0 0 1 11.374 1.264a2.528 2.528 0 0 1 2.52 2.521v6.313z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Slack</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      Degraded
                    </span>
                    <span className="text-xs text-slate-500 font-medium">• Webhook</span>
                  </div>
                </div>
              </div>
              <div className="relative">
                <button className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                  <span className="material-symbols-outlined text-slate-400">more_vert</span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Expires</p>
                <p className="text-sm font-semibold text-slate-700">Never</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Privilege</p>
                <div className="flex items-center gap-1 text-slate-500">
                  <span className="material-symbols-outlined text-[14px]">lock_open</span>
                  <span className="text-xs font-semibold">Write-Only</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="flex-1 h-9 rounded-lg bg-primary hover:bg-primary-dark text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-primary/20">
                <span className="material-symbols-outlined text-[16px]">send</span>
                Test Message
              </button>
              <button className="flex-1 h-9 rounded-lg bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors border border-slate-200 flex items-center justify-center gap-1.5 shadow-sm">
                <span className="material-symbols-outlined text-[16px]">tune</span>
                Config
              </button>
            </div>
          </div>
        </div>
        <div className="group bg-white rounded-xl border border-slate-200 overflow-hidden shadow-card hover:shadow-lg transition-all duration-300">
          <div className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md">
                  <span className="material-symbols-outlined text-2xl">webhook</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Custom Hook</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-600 border border-red-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                      Expired
                    </span>
                  </div>
                </div>
              </div>
              <div className="relative">
                <button className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                  <span className="material-symbols-outlined text-slate-400">more_vert</span>
                </button>
              </div>
            </div>
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Endpoint</p>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded border border-slate-200 shadow-inner">
                <code className="text-xs font-mono text-slate-600 truncate flex-1">https://api.mysite.com/hook/v1/payment_events</code>
                <button className="hover:text-primary text-slate-400 transition-colors">
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="flex-1 h-9 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-red-200">
                <span className="material-symbols-outlined text-[16px]">key_off</span>
                Renew Secret
              </button>
            </div>
          </div>
        </div>
      </section>
      <hr className="border-slate-200" />
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800 px-1">Available to Connect</h2>
        <div className="grid grid-cols-2 gap-4">
          <button className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-md transition-all duration-200 group text-center shadow-soft">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <svg fill="currentColor" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.53 2C6.454 1.96 2.073 5.923 2 11h9.53V2zM12.47 2v9h9.53C21.93 5.96 17.546 2.077 12.47 2zM2 13c.073 5.077 4.454 9.04 9.53 9V13H2zm19.47 0H12.47l.06 9C17.576 21.93 21.96 18.01 22 13z"></path>
              </svg>
            </div>
            <span className="text-sm font-semibold text-slate-900">Jira</span>
            <span className="text-xs text-slate-500 mt-1">Issue Tracking</span>
          </button>
          <button className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-md transition-all duration-200 group text-center shadow-soft">
            <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">cloud_queue</span>
            </div>
            <span className="text-sm font-semibold text-slate-900">AWS</span>
            <span className="text-xs text-slate-500 mt-1">Cloud Watch</span>
          </button>
        </div>
      </section>
    </main>
  );
};

export default IntegrationList;
