
import React from 'react';

const OnboardingPage: React.FC = () => {
  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-text-main dark:text-slate-100 antialiased selection:bg-primary selection:text-white">
      <div className="relative flex h-full min-h-screen w-full flex-col max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 bg-background-light dark:bg-background-dark sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
          <button className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-text-main dark:text-white transition-colors">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h1 className="text-base font-semibold text-text-main dark:text-white tracking-tight">Settler Workspace</h1>
          <button className="flex items-center text-primary font-medium text-sm hover:text-primary-dark transition-colors px-2">
            Help
          </button>
        </header>
        {/* Progress Stepper */}
        <div className="w-full bg-background-light dark:bg-background-dark pt-6 pb-2 px-6">
          <div className="flex w-full items-center justify-center gap-3">
            <div className="h-1.5 w-8 rounded-full bg-primary"></div>
            <div className="h-1.5 w-8 rounded-full bg-slate-200 dark:bg-slate-700"></div>
            <div className="h-1.5 w-8 rounded-full bg-slate-200 dark:bg-slate-700"></div>
            <div className="h-1.5 w-8 rounded-full bg-slate-200 dark:bg-slate-700"></div>
          </div>
          <div className="mt-2 text-center">
            <span className="text-xs font-medium text-text-secondary dark:text-slate-400 uppercase tracking-wider">Step 1 of 4</span>
          </div>
        </div>
        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto px-6 py-4 pb-24">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-text-main dark:text-white tracking-tight mb-2">Set up your Workspace</h2>
            <p className="text-text-secondary dark:text-slate-400 text-sm leading-relaxed">Let's configure your secure, audit-ready environment. First, give it an identity.</p>
          </div>
          <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
            {/* Workspace Name */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-main dark:text-slate-200" htmlFor="workspace-name">
                Workspace Name
              </label>
              <div className="relative">
                <input className="form-input block w-full rounded-lg border-slate-300 dark:border-slate-700 bg-surface-light dark:bg-slate-800 text-text-main dark:text-white shadow-sm focus:border-primary focus:ring-primary h-12 px-4 transition-colors placeholder:text-slate-400" id="workspace-name" placeholder="e.g. Acme Corp" type="text" defaultValue="Acme Corp" />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-green-500">
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                </div>
              </div>
            </div>
            {/* Subdomain */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-main dark:text-slate-200" htmlFor="subdomain">
                Workspace URL
              </label>
              <div className="flex rounded-lg shadow-sm">
                <span className="inline-flex items-center rounded-l-lg border border-r-0 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 text-slate-500 dark:text-slate-400 sm:text-sm">
                  https://
                </span>
                <input className="block w-full min-w-0 flex-1 rounded-none rounded-r-lg border-slate-300 dark:border-slate-700 bg-surface-light dark:bg-slate-800 text-text-main dark:text-white focus:border-primary focus:ring-primary sm:text-sm h-12 px-4" id="subdomain" placeholder="acme" type="text" defaultValue="acme-production" />
              </div>
              <p className="text-xs text-text-secondary dark:text-slate-500">Your team will use this URL to access the platform.</p>
            </div>
            {/* Environment Type Selection */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-text-main dark:text-slate-200">
                  Tenant Mode
                </label>
                <button className="text-primary hover:text-primary-dark">
                  <span className="material-symbols-outlined text-[18px]">info</span>
                </button>
              </div>
              {/* Option 1: Multi-tenant */}
              <label className="relative flex cursor-pointer rounded-xl border-2 border-primary bg-primary-light/30 dark:bg-primary/10 p-4 shadow-sm focus:outline-none transition-all">
                <input aria-describedby="tenant-mode-0-description-0 tenant-mode-0-description-1" aria-labelledby="tenant-mode-0-label" defaultChecked className="sr-only" name="tenant-mode" type="radio" value="multi" />
                <span className="flex flex-1">
                  <span className="flex flex-col">
                    <span className="block text-sm font-bold text-primary dark:text-blue-400 flex items-center gap-2" id="tenant-mode-0-label">
                      <span className="material-symbols-outlined text-[20px]">hub</span>
                      Shared Environment
                    </span>
                    <span className="mt-1 flex items-center text-sm text-text-secondary dark:text-slate-400" id="tenant-mode-0-description-0">
                      Cost-effective multi-tenant setup. Best for development and staging.
                    </span>
                  </span>
                </span>
                <span aria-hidden="true" className="material-symbols-outlined text-primary dark:text-blue-400 text-[24px]">check_circle</span>
              </label>
              {/* Option 2: Dedicated */}
              <label className="relative flex cursor-pointer rounded-xl border border-slate-200 dark:border-slate-700 bg-surface-light dark:bg-slate-800 p-4 shadow-sm focus:outline-none hover:border-slate-300 dark:hover:border-slate-600 transition-all">
                <input aria-describedby="tenant-mode-1-description-0 tenant-mode-1-description-1" aria-labelledby="tenant-mode-1-label" className="sr-only" name="tenant-mode" type="radio" value="dedicated" />
                <span className="flex flex-1">
                  <span className="flex flex-col">
                    <span className="block text-sm font-bold text-text-main dark:text-slate-200 flex items-center gap-2" id="tenant-mode-1-label">
                      <span className="material-symbols-outlined text-[20px]">security</span>
                      Isolated Environment
                    </span>
                    <span className="mt-1 flex items-center text-sm text-text-secondary dark:text-slate-400" id="tenant-mode-1-description-0">
                      Dedicated resources for strict compliance. Best for production.
                    </span>
                  </span>
                </span>
                <span aria-hidden="true" className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-[24px]">radio_button_unchecked</span>
              </label>
            </div>
            {/* Compliance Quick Toggles */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-medium text-text-main dark:text-white mb-4">Audit-Ready Defaults</h3>
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-text-main dark:text-slate-200">SOC2 Logging Preset</span>
                  <span className="text-xs text-text-secondary dark:text-slate-500">Enables 90-day retention</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input defaultChecked className="sr-only peer" type="checkbox" value="" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-text-main dark:text-slate-200">Enforce 2FA</span>
                  <span className="text-xs text-text-secondary dark:text-slate-500">Require for all admins</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input defaultChecked className="sr-only peer" type="checkbox" value="" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </form>
        </main>
        {/* Sticky Footer */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800 p-4 z-20">
          <div className="flex gap-3">
            <button className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-text-main dark:text-white rounded-lg font-semibold text-sm transition-colors" type="button">
              Save Draft
            </button>
            <button className="flex-[2] py-3 px-4 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold text-sm shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2" type="button">
              Next Step
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
