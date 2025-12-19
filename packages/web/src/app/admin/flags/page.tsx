import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Feature Flags - Admin',
  description: 'Manage feature flags across tenants',
};

export default function AdminFlagsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Feature Flags</h1>
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <p className="text-slate-600 dark:text-slate-400">
          Feature flags management interface coming soon. This will allow you to manage feature flags across all tenants.
        </p>
      </div>
    </div>
  );
}
