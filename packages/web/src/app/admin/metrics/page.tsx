/**
 * Admin Metrics Dashboard Page
 * 
 * Executive dashboard for viewing key business metrics.
 */

import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/shared/db/prismaClient';
import { ExecutiveDashboard } from '@/components/console/ExecutiveDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function AdminMetricsContent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Please sign in to access the admin dashboard.
        </p>
      </div>
    );
  }

  // Check if user is admin
  const userProfile = await prisma.user.findUnique({
    where: { id: user.id },
  });

  const isAdmin = userProfile?.metadata?.['role'] === 'admin';

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          You do not have permission to access this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Executive Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Key business metrics and KPIs
        </p>
      </div>

      <ExecutiveDashboard />
    </div>
  );
}

export default function AdminMetricsPage() {
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Suspense
            fallback={
              <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-96 w-full" />
              </div>
            }
          >
            <AdminMetricsContent />
          </Suspense>
        </div>
      </div>
      <Footer />
    </>
  );
}
