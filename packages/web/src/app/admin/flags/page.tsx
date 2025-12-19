import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Feature Flags - Admin',
  description: 'Manage feature flags across tenants',
};

import { redirect } from 'next/navigation';

export default function AdminFlagsPage() {
  // Redirect to console feature flags page
  redirect('/console/feature-flags');
}
