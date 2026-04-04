/**
 * Admin Support Inbox
 *
 * View and manage support tickets
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRole, UserRole } from "@/shared/auth/roles";
import { SupportInbox } from "@/components/support/SupportInbox";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function SupportContent() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/console");
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
            <CardDescription>This page is restricted to administrators only.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return <SupportInbox userId={user.id} />;
}

export default function SupportPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Support intake inbox</h1>
        <p className="text-muted-foreground mt-2">
          Tenant-submitted reconciliation and platform issues with run context where available
        </p>
      </div>
      <ErrorBoundary componentName="SupportPage">
        <Suspense fallback={<div>Loading...</div>}>
          <SupportContent />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
