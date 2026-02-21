
import React from 'react';

const SettingsPage: React.FC = () => {
  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display transition-colors duration-200">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-background-light dark:bg-background-dark shadow-2xl relative">
        {/* Top App Bar */}
        <header className="sticky top-0 z-10 flex items-center justify-between bg-surface-light/95 dark:bg-surface-dark/95 px-4 py-3 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
          <button className="flex h-10 w-10 items-center justify-start text-primary active:opacity-70 transition-opacity">
            <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
          </button>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Settings</h1>
          <button className="flex h-10 w-auto min-w-[40px] items-center justify-end text-base font-semibold text-primary active:opacity-70 transition-opacity">
            Done
          </button>
        </header>
        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar pb-8">
          {/* Profile Section */}
          <div className="mt-6 mb-6 px-4">
            <div className="flex flex-col items-center">
              <div className="relative mb-3">
                <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-surface-light dark:border-surface-dark shadow-md" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCf3kfs4MF98RUZzPUIK8Yl5FLmj-1zU3MWWx17mlQiXy0qFulaS7byKcQIOWsMCGS0laVQwt6DbnCfqr5Io0ZV1UcgV1nKUqjfcZJCG9rBoodHGMx3J9hkjCn6BHaEW7fIpAygZn_m_pbbBzb2lsz5ffUSxPo_RL_pO4l7L6YB6agQ8EnNVlGk_BwZ-jsdWSvjs1sNAOWr08DPK1RJgR0Pkc9eA-eh-5iRF2Ro9yRv19w_W83qMVeZ5ti_cGx42WHtyLciOSr1-w0a')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
                </div>
                <button className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-sm hover:bg-primary-dark transition-colors">
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Alex Miller</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Field Ops Manager</p>
            </div>
          </div>
          {/* Operational Alerts Group */}
          <div className="mb-6 px-4">
            <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Operational Alerts</h3>
            <div className="overflow-hidden rounded-xl bg-surface-light dark:bg-surface-dark shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10">
              {/* Item 1: Push Notifications */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-primary dark:bg-blue-900/20 dark:text-blue-400">
                    <span className="material-symbols-outlined">notifications</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base font-medium text-slate-900 dark:text-white">Push Notifications</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Direct alerts to device</span>
                  </div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input defaultChecked className="peer sr-only" type="checkbox" />
                  <div className="peer h-7 w-12 rounded-full bg-slate-200 dark:bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-6 after:w-6 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50"></div>
                </label>
              </div>
              {/* Item 2: SMS Critical Alerts */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
                    <span className="material-symbols-outlined">sms_failed</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base font-medium text-slate-900 dark:text-white">SMS Critical Alerts</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Emergency override</span>
                  </div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input defaultChecked className="peer sr-only" type="checkbox" />
                  <div className="peer h-7 w-12 rounded-full bg-slate-200 dark:bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-6 after:w-6 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50"></div>
                </label>
              </div>
              {/* Item 3: Email Digest */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                    <span className="material-symbols-outlined">mail</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base font-medium text-slate-900 dark:text-white">Daily Email Digest</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Summary at 08:00 AM</span>
                  </div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input className="peer sr-only" type="checkbox" />
                  <div className="peer h-7 w-12 rounded-full bg-slate-200 dark:bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-6 after:w-6 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50"></div>
                </label>
              </div>
            </div>
          </div>
          {/* Security Group */}
          <div className="mb-6 px-4">
            <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Security</h3>
            <div className="overflow-hidden rounded-xl bg-surface-light dark:bg-surface-dark shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10">
              {/* Item 1: Change Password */}
              <button className="flex w-full items-center justify-between border-b border-slate-100 dark:border-slate-800 p-4 active:bg-slate-50 dark:active:bg-slate-800 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <span className="material-symbols-outlined">lock</span>
                  </div>
                  <span className="text-base font-medium text-slate-900 dark:text-white">Change Password</span>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-[20px]">chevron_right</span>
              </button>
              {/* Item 2: 2FA */}
              <button className="flex w-full items-center justify-between border-b border-slate-100 dark:border-slate-800 p-4 active:bg-slate-50 dark:active:bg-slate-800 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                    <span className="material-symbols-outlined">shield</span>
                  </div>
                  <span className="text-base font-medium text-slate-900 dark:text-white">Two-Factor Authentication</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">On</span>
                  <span className="material-symbols-outlined text-slate-400 text-[20px]">chevron_right</span>
                </div>
              </button>
              {/* Item 3: Active Sessions */}
              <button className="flex w-full items-center justify-between p-4 active:bg-slate-50 dark:active:bg-slate-800 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <span className="material-symbols-outlined">devices</span>
                  </div>
                  <span className="text-base font-medium text-slate-900 dark:text-white">Active Sessions</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500 dark:text-slate-400">3 Devices</span>
                  <span className="material-symbols-outlined text-slate-400 text-[20px]">chevron_right</span>
                </div>
              </button>
            </div>
          </div>
          {/* General Group */}
          <div className="mb-8 px-4">
            <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">General</h3>
            <div className="overflow-hidden rounded-xl bg-surface-light dark:bg-surface-dark shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10">
              <button className="flex w-full items-center justify-between border-b border-slate-100 dark:border-slate-800 p-4 active:bg-slate-50 dark:active:bg-slate-800 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-base font-medium text-slate-900 dark:text-white">Help &amp; Support</span>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-[20px]">open_in_new</span>
              </button>
              <button className="flex w-full items-center justify-between p-4 active:bg-slate-50 dark:active:bg-slate-800 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-base font-medium text-slate-900 dark:text-white">Privacy Policy</span>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-[20px]">open_in_new</span>
              </button>
            </div>
          </div>
          {/* Logout Action */}
          <div className="px-4 mb-8">
            <button className="flex w-full items-center justify-center rounded-xl border border-red-200 bg-surface-light py-3.5 text-base font-semibold text-red-600 shadow-sm transition-colors hover:bg-red-50 dark:border-red-900/30 dark:bg-surface-dark dark:text-red-400 dark:hover:bg-red-900/20">
              Log Out
            </button>
            <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
              Settler App v4.2.0 (Build 3021)
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;
