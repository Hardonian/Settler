
import React from 'react';

const FreezeToggle: React.FC = () => {
  return (
    <section className="p-4">
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-danger text-[20px]">lock_clock</span>
              <h2 className="text-base font-bold text-text-main-light dark:text-text-main-dark">Freeze System</h2>
            </div>
            <p className="text-sm text-text-muted-light dark:text-text-muted-dark leading-relaxed">
              Switch to Read-Only Mode for emergency safety. All write operations will be blocked.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
            <input className="sr-only peer" type="checkbox" value="" />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 dark:peer-focus:ring-primary/30 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-danger"></div>
          </label>
        </div>
        <div className="mt-3 flex items-center gap-2 bg-emerald-500/10 rounded-lg px-3 py-2 border border-emerald-500/20">
          <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">System is currently Operational</span>
        </div>
      </div>
    </section>
  );
};

export default FreezeToggle;
