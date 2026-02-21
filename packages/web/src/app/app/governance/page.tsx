
import RoleMatrix from '@/components/stitch-import/RoleMatrix';
import PolicyViewer from '@/components/stitch-import/PolicyViewer';
import FreezeToggle from '@/components/stitch-import/FreezeToggle';

export default function GovernancePage() {
  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-text-main-light dark:text-text-main-dark min-h-screen flex flex-col antialiased">
      <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="flex items-center justify-center p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-text-main-light dark:text-text-main-dark">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold">Governance</h1>
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-xs font-semibold text-text-main-light dark:text-text-main-dark">Finance Prod</span>
          <span className="material-symbols-outlined text-sm text-text-muted-light dark:text-text-muted-dark">expand_more</span>
        </button>
      </header>
      <main className="flex-1 overflow-y-auto pb-24">
        <FreezeToggle />
        <RoleMatrix />
        <div className="h-px bg-border-light dark:bg-border-dark mx-4 my-4"></div>
        <PolicyViewer />
        <div className="h-px bg-border-light dark:bg-border-dark mx-4 my-4"></div>
        <section className="px-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted-light dark:text-text-muted-dark mb-4">Recent Mutations</h3>
          <div className="relative pl-4 border-l border-border-light dark:border-border-dark space-y-6">
            {/* Timeline Item 1 */}
            <div className="relative">
              <div className="absolute -left-[21px] top-1 bg-background-light dark:bg-background-dark p-1">
                <div className="w-2 h-2 rounded-full bg-primary ring-4 ring-background-light dark:ring-background-dark"></div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-start">
                  <p className="text-xs font-bold text-text-main-light dark:text-text-main-dark">Policy Update: <span className="font-mono text-primary">Auth_V2</span></p>
                  <span className="text-[10px] text-text-muted-light dark:text-text-muted-dark">2m ago</span>
                </div>
                <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Modified restrict level from 'Internal' to 'Confidential'.</p>
                <div className="flex items-center gap-2 mt-1">
                  <img alt="User Avatar" className="w-4 h-4 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwZCMVpvPStX536RGGR0JBAem5WCuS5NmpSbhKBF6kSb__B0Ad0lOkQuVwNDWJWA7c-4zOiU529P66Xew9KSOeWgAjb8i-RG-0U_dKm4Vlt9KWcMUMBLXOccXoaflD1YtadPwlMtab-NG4wwQIfOaT44JZn77Pft9mFAQgs1qHIn2ya32Lww8VLkCQTolB0puW0zYkL7SYl7Aj3rFfXdSQ-e-Qn0coYJ_SnJgywuFfqgp0HSC-OMN7nnlvOXlA2znEeoa5bWpexPAN" />
                  <span className="text-[10px] font-medium text-text-main-light dark:text-text-main-dark">Alex M.</span>
                </div>
              </div>
            </div>
            {/* Timeline Item 2 */}
            <div className="relative">
              <div className="absolute -left-[21px] top-1 bg-background-light dark:bg-background-dark p-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-background-light dark:ring-background-dark"></div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-start">
                  <p className="text-xs font-bold text-text-main-light dark:text-text-main-dark">New Role Assigned</p>
                  <span className="text-[10px] text-text-muted-light dark:text-text-muted-dark">15m ago</span>
                </div>
                <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Assigned 'Analyst' role to <span className="text-primary hover:underline cursor-pointer">@sarah_j</span>.</p>
                <div className="flex items-center gap-2 mt-1">
                  <img alt="User Avatar" className="w-4 h-4 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9Yv0WEBbld7af6SBSl-BRr2OnZOE7OikL7DVOmVnROvVAkNBq0i__7NEQ3FJUZfuSLMbMWQc6R9ieEcXOylVoJOSxSxYIuUWJ7NR6CblEN3TtZqEp6MqHX09Az1fmcD4ZU4e8dBFnied7FyA716wEks5waN_RA-6f2TxhDaox8UQVr6BJ6jwn6W28FTCpmNPq9V-oimWIJY47KpI61y-AsNTK5xCstx_9MZu4mQWWOqkRCHPAF-y1u6JKQ4l504qXDpNhmnh5gky-" />
                  <span className="text-[10px] font-medium text-text-main-light dark:text-text-main-dark">Marcus R.</span>
                </div>
              </div>
            </div>
            {/* Timeline Item 3 */}
            <div className="relative">
              <div className="absolute -left-[21px] top-1 bg-background-light dark:bg-background-dark p-1">
                <div className="w-2 h-2 rounded-full bg-danger ring-4 ring-background-light dark:ring-background-dark"></div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-start">
                  <p className="text-xs font-bold text-text-main-light dark:text-text-main-dark">Failed Login Attempt</p>
                  <span className="text-[10px] text-text-muted-light dark:text-text-muted-dark">1h ago</span>
                </div>
                <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Multiple failed attempts from IP 192.168.x.x detected.</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[8px] text-white">S</span>
                  <span className="text-[10px] font-medium text-text-main-light dark:text-text-main-dark">System</span>
                </div>
              </div>
            </div>
            {/* Timeline Item 4 */}
            <div className="relative pb-4">
              <div className="absolute -left-[21px] top-1 bg-background-light dark:bg-background-dark p-1">
                <div className="w-2 h-2 rounded-full bg-slate-500 ring-4 ring-background-light dark:ring-background-dark"></div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-start">
                  <p className="text-xs font-bold text-text-main-light dark:text-text-main-dark">Workspace Config</p>
                  <span className="text-[10px] text-text-muted-light dark:text-text-muted-dark">2h ago</span>
                </div>
                <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Updated reconciliation batch size limit.</p>
                <div className="flex items-center gap-2 mt-1">
                  <img alt="User Avatar" className="w-4 h-4 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAdTI33VXLdArt-9B7Aw7gxO2Oevi6lJybcUx9wUX0USWbyGXHhbLay6zzMc9TWV8a2Ohg9e2Rd7bq7s1pSSFKbaR48J_5Tz2agtkto6IuN_hu2GHSUFGKmHxrqo3zghKOluDAZIsY9sNPefZwHoetZoqQPdLN6zpwCGyJccUIZrd58H2OxdE_5f_CqkVz7NcOxSwlhDygh8Gd2TVWI2HIpLkWKF1lFWIWfHw5Bzn9Zl1Qgf64CQ3P8n3XGP5VpH2v__Ag9mc75DWJg" />
                  <span className="text-[10px] font-medium text-text-main-light dark:text-text-main-dark">Alex M.</span>
                </div>
              </div>
            </div>
          </div>
          <button className="w-full py-3 text-xs text-primary font-medium hover:bg-primary/5 rounded-lg transition-colors mt-2 mb-6">View All Activity</button>
        </section>
      </main>
    </div>
  );
}
