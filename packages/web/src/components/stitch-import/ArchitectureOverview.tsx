
import React from 'react';

const ArchitectureOverview: React.FC = () => {
  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased overflow-x-hidden">
      <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto shadow-2xl overflow-hidden bg-background-light dark:bg-background-dark">
        {/* Header / Navigation */}
        <div className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between p-4">
            <button className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">arrow_back</span>
            </button>
            <h1 className="text-base font-semibold text-slate-900 dark:text-white">Technical Architecture</h1>
            <button className="p-2 -mr-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">more_vert</span>
            </button>
          </div>
        </div>
        {/* Scrollable Content */}
        <div className="flex-1 flex flex-col pb-24">
          {/* Hero Section */}
          <div className="px-5 pt-6 pb-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="text-xs font-medium text-primary">System Online • v2.4.0</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-2 text-slate-900 dark:text-white">System Architecture</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Transparent, secure, and scalable design. Follow the flow below to understand how we process your data from ingestion to actionable artifacts.
            </p>
          </div>
          {/* Architecture Flow (Vertical Timeline) */}
          <div className="mt-8 px-5 relative">
            {/* Connecting Line Background */}
            <div className="absolute left-[38px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-primary/20 via-primary/50 to-primary/20"></div>
            {/* Step 1: Connections */}
            <div className="relative flex gap-4 mb-8 group cursor-pointer">
              <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-surface-dark border border-slate-700 flex items-center justify-center shadow-lg group-hover:border-primary group-hover:bg-primary/10 transition-all duration-300">
                <span className="material-symbols-outlined text-primary text-[20px]">hub</span>
              </div>
              <div className="flex-1 pt-1 pb-4 border-b border-slate-200 dark:border-slate-800/50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors">Connections</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Secure ingestion from external sources.</p>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 text-lg opacity-0 group-hover:opacity-100 transition-opacity -rotate-90 sm:rotate-0">chevron_right</span>
                </div>
                {/* Micro-interaction / Detail hint */}
                <div className="mt-3 flex gap-2">
                  <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">REST API</span>
                  <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">Webhooks</span>
                </div>
              </div>
            </div>
            {/* Step 2: Canonical Primitives */}
            <div className="relative flex gap-4 mb-8 group cursor-pointer">
              <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-surface-dark border border-slate-700 flex items-center justify-center shadow-lg group-hover:border-primary group-hover:bg-primary/10 transition-all duration-300">
                <span className="material-symbols-outlined text-primary text-[20px]">deployed_code</span>
              </div>
              <div className="flex-1 pt-1 pb-4 border-b border-slate-200 dark:border-slate-800/50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors">Canonical Primitives</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Standardizing raw data into usable blocks.</p>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 text-lg opacity-0 group-hover:opacity-100 transition-opacity -rotate-90 sm:rotate-0">chevron_right</span>
                </div>
                <div className="mt-3 bg-slate-900/50 rounded p-2 border border-slate-800/50">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    <span className="text-[10px] font-mono text-slate-400">Normalizing data structures...</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Step 3: Artifacts */}
            <div className="relative flex gap-4 mb-2 group cursor-pointer">
              <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-surface-dark border border-slate-700 flex items-center justify-center shadow-lg group-hover:border-primary group-hover:bg-primary/10 transition-all duration-300">
                <span className="material-symbols-outlined text-primary text-[20px]">description</span>
              </div>
              <div className="flex-1 pt-1 pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors">Artifacts</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Generating actionable outputs &amp; reports.</p>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 text-lg opacity-0 group-hover:opacity-100 transition-opacity -rotate-90 sm:rotate-0">chevron_right</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold rounded bg-primary/20 text-primary border border-primary/20">PDF</span>
                  <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold rounded bg-primary/20 text-primary border border-primary/20">JSON</span>
                </div>
              </div>
            </div>
          </div>
          {/* Divider */}
          <div className="h-px bg-slate-200 dark:bg-slate-800 my-8 mx-5"></div>
          {/* Security Section */}
          <div className="px-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Security Posture</h2>
              <a className="text-xs font-medium text-primary hover:text-primary/80" href="#">View Compliance</a>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {/* Security Card 1 */}
              <div className="p-4 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
                    <span className="material-symbols-outlined text-[24px]">lock_person</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white">Tenant Isolation</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Logical separation of customer data ensures your information remains private, even in a multi-tenant environment.
                    </p>
                  </div>
                </div>
              </div>
              {/* Security Card 2 */}
              <div className="p-4 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
                    <span className="material-symbols-outlined text-[24px]">history_edu</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white">Full Auditability</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Immutable logs for all system actions. Every read, write, and modification is tracked with timestamp precision.
                    </p>
                  </div>
                </div>
              </div>
              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="flex items-center justify-center gap-2 p-3 rounded-lg border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30">
                  <span className="material-symbols-outlined text-slate-400 text-[18px]">verified_user</span>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">SOC2 Type II</span>
                </div>
                <div className="flex items-center justify-center gap-2 p-3 rounded-lg border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30">
                  <span className="material-symbols-outlined text-slate-400 text-[18px]">shield</span>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">ISO 27001</span>
                </div>
              </div>
            </div>
          </div>
          {/* CTA Section */}
          <div className="mt-8 px-5 pb-6">
            <div className="rounded-xl bg-gradient-to-br from-surface-dark to-slate-900 border border-slate-800 p-5 relative overflow-hidden">
              {/* Abstract Background Pattern */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
              <h3 className="relative text-white font-semibold text-sm mb-1">Need technical due diligence?</h3>
              <p className="relative text-slate-400 text-xs mb-4">Contact our engineering team for deep dives.</p>
              <button className="relative w-full py-2.5 px-4 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">mail</span>
                Contact Engineering
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchitectureOverview;
