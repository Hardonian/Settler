/**
 * Tenant Observability Dashboard
 * 
 * Super admin page for observing all tenants, their metrics, and usage.
 * Privacy-compliant: PII is redacted.
 */

import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { isSuperAdmin } from '@/lib/auth/super-admin';
import { redirect } from 'next/navigation';
import { TenantsObservabilityDashboard } from '@/components/console/TenantsObservabilityDashboard';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function TenantsObservabilityContent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/signup?next=/console/admin/tenants');
  }
  
  // Check super admin access
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Super admin access required to view tenant observability dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              This page is only accessible to Settler management and super admins.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Tenant Observability Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Monitor all tenants, their usage, metrics, and health. All PII has been redacted for privacy compliance.
        </p>
      </div>
      
      <TenantsObservabilityDashboard />
    </div>
  );
}

export default function TenantsObservabilityPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-electric-cyan mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading tenant observability...</p>
          </div>
        </div>
      }
    >
      <TenantsObservabilityContent />
    </Suspense>
  );
}
