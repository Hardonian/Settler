import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings - Admin',
  description: 'Admin settings and configuration',
};

import { redirect } from 'next/navigation';

export default function AdminSettingsPage() {
  // Redirect to admin dashboard - settings can be managed through console
  redirect('/admin');
}
