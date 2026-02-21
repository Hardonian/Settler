
import React from 'react';

const RoleMatrix: React.FC = () => {
  return (
    <section className="px-4 pb-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted-light dark:text-text-muted-dark">Access Control</h3>
        <button className="text-primary text-xs font-semibold hover:underline">Manage Roles</button>
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-3 flex flex-col items-start">
          <span className="text-2xl font-bold text-text-main-light dark:text-text-main-dark">3</span>
          <span className="text-xs text-text-muted-light dark:text-text-muted-dark mt-1 font-medium">Active Roles</span>
        </div>
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-3 flex flex-col items-start">
          <span className="text-2xl font-bold text-text-main-light dark:text-text-main-dark">12</span>
          <span className="text-xs text-text-muted-light dark:text-text-muted-dark mt-1 font-medium">Permissions</span>
        </div>
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-3 flex flex-col items-start relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-2 bg-orange-500 rounded-full m-2"></div>
          <span className="text-2xl font-bold text-text-main-light dark:text-text-main-dark">5</span>
          <span className="text-xs text-text-muted-light dark:text-text-muted-dark mt-1 font-medium">Requests</span>
        </div>
      </div>
      {/* Role Horizontal Scroll */}
      <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
        {/* Role Card 1 */}
        <div className="min-w-[140px] bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-3 flex flex-col gap-2 relative group">
          <div className="flex justify-between items-start">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
            </div>
            <span className="material-symbols-outlined text-text-muted-light dark:text-text-muted-dark text-[16px]">more_vert</span>
          </div>
          <div>
            <p className="text-sm font-bold text-text-main-light dark:text-text-main-dark">Admin</p>
            <p className="text-[10px] text-text-muted-light dark:text-text-muted-dark mt-0.5">Full Access</p>
          </div>
        </div>
        {/* Role Card 2 */}
        <div className="min-w-[140px] bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-3 flex flex-col gap-2 relative group">
          <div className="flex justify-between items-start">
            <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
              <span className="material-symbols-outlined text-[18px]">analytics</span>
            </div>
            <span className="material-symbols-outlined text-text-muted-light dark:text-text-muted-dark text-[16px]">more_vert</span>
          </div>
          <div>
            <p className="text-sm font-bold text-text-main-light dark:text-text-main-dark">Analyst</p>
            <p className="text-[10px] text-text-muted-light dark:text-text-muted-dark mt-0.5">Read &amp; Report</p>
          </div>
        </div>
        {/* Role Card 3 */}
        <div className="min-w-[140px] bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-3 flex flex-col gap-2 relative group">
          <div className="flex justify-between items-start">
            <div className="w-8 h-8 rounded-full bg-slate-500/10 flex items-center justify-center text-slate-500">
              <span className="material-symbols-outlined text-[18px]">visibility</span>
            </div>
            <span className="material-symbols-outlined text-text-muted-light dark:text-text-muted-dark text-[16px]">more_vert</span>
          </div>
          <div>
            <p className="text-sm font-bold text-text-main-light dark:text-text-main-dark">Viewer</p>
            <p className="text-[10px] text-text-muted-light dark:text-text-muted-dark mt-0.5">Read Only</p>
          </div>
        </div>
        {/* Add Role Card */}
        <div className="min-w-[60px] flex items-center justify-center border-2 border-dashed border-border-light dark:border-border-dark rounded-lg p-3 hover:bg-surface-light dark:hover:bg-surface-dark/50 transition-colors cursor-pointer">
          <span className="material-symbols-outlined text-text-muted-light dark:text-text-muted-dark">add</span>
        </div>
      </div>
    </section>
  );
};

export default RoleMatrix;
