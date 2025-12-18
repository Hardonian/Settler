/**
 * Ops Insights Page
 * 
 * View and manage operational insights
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserRole, UserRole } from '@/shared/auth/roles';
import { InsightsView } from '@/components/ops/InsightsView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { OpsIntelligenceErrorBoundary } from '@/components/ops/ErrorBoundary';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function InsightsContent() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/console');
  }

  // Check if user is admin
  const role = await getUserRole(user.id);
  const isAdmin = role === UserRole.SUPER_ADMIN;

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Access Denied
            </CardTitle>
            <CardDescription>
              This page is restricted to administrators only.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You need super admin privileges to access Ops Insights.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <InsightsView userId={user.id} />;
}

export default function InsightsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Ops Insights</h1>
        <p className="text-muted-foreground mt-2">
          Operational insights and recommendations from your system metrics
        </p>
      </div>
      <ErrorBoundary componentName="InsightsPage">
        <OpsIntelligenceErrorBoundary>
          <Suspense fallback={<div>Loading...</div>}>
            <InsightsContent />
          </Suspense>
        </OpsIntelligenceErrorBoundary>
      </ErrorBoundary>
    </div>
  );
}
