import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Branding - Admin',
  description: 'Manage tenant branding settings',
};

export default function AdminBrandingPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Branding Management</h1>
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <p className="text-slate-600 dark:text-slate-400">
          Branding management interface coming soon. This will allow you to customize tenant branding, logos, and themes.
        </p>
      </div>
    </div>
  );
}
