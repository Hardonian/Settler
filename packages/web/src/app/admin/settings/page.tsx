import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings - Admin',
  description: 'Admin settings and configuration',
};

export default function AdminSettingsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Settings</h1>
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <p className="text-slate-600 dark:text-slate-400">
          Admin settings interface coming soon. This will allow you to configure system-wide settings.
        </p>
      </div>
    </div>
  );
}
