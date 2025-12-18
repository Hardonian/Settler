/**
 * Ops Briefings Page
 * 
 * View weekly founder briefings
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserRole, UserRole } from '@/shared/auth/roles';
import { BriefingsView } from '@/components/ops/BriefingsView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function BriefingsContent() {
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
              You need super admin privileges to access Founder Briefings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <BriefingsView userId={user.id} />;
}

export default function BriefingsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Founder Briefings</h1>
        <p className="text-muted-foreground mt-2">
          Weekly automated briefings summarizing operational insights and recommendations
        </p>
      </div>
      <ErrorBoundary componentName="BriefingsPage">
        <Suspense fallback={<div>Loading...</div>}>
          <BriefingsContent />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
