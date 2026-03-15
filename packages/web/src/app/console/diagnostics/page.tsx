/**
 * Diagnostics Page
 *
 * Gated admin/console page showing system health and diagnostics.
 */

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/shared/db/prismaClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { redirect } from "next/navigation";

interface DiagnosticItem {
  name: string;
  status: "ok" | "warning" | "error";
  category: "health" | "configuration" | "auth" | "data" | "integration";
  message: string;
  detail: string;
  value?: string | number;
}

async function getDiagnostics(): Promise<DiagnosticItem[]> {
  const diagnostics: DiagnosticItem[] = [];
  const hasSupabaseEnv = Boolean(
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Check Supabase connection
  if (!hasSupabaseEnv) {
    diagnostics.push({
      name: "Supabase Connection",
      status: "warning",
      category: "configuration",
      message: "Supabase environment variables are not configured",
      detail:
        "Console data backed by Supabase is intentionally unavailable in this runtime until SUPABASE_URL and SUPABASE_ANON_KEY are provided.",
    });
  } else {
    try {
      const supabase = await createClient();
      const { error } = await supabase.from("tenants").select("id").limit(1);
      if (error) {
        // Log error but don't throw - graceful degradation
        diagnostics.push({
          name: "Supabase Connection",
          status: "error",
          category: "health",
          message: error.message || "Connection failed",
          detail:
            "Authenticated route hydration and tenant-backed data reads are currently degraded because Supabase rejected the probe query.",
        });
        // Continue to next check instead of throwing
      } else {
        diagnostics.push({
          name: "Supabase Connection",
          status: "ok",
          category: "health",
          message: "Connected successfully",
          detail: "Supabase is reachable for tenant and authenticated console queries.",
        });
      }
    } catch (err) {
      diagnostics.push({
        name: "Supabase Connection",
        status: "error",
        category: "health",
        message: err instanceof Error ? err.message : "Connection failed",
        detail:
          "Runtime could not initialize the Supabase client. Authenticated routes may still render but should be treated as degraded.",
      });
    }
  }

  // Check Prisma connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    diagnostics.push({
      name: "Database Connection",
      status: "ok",
      category: "health",
      message: "Connected successfully",
      detail: "Prisma can execute queries against the configured primary database.",
    });
  } catch (err) {
    diagnostics.push({
      name: "Database Connection",
      status: "error",
      category: "health",
      message: err instanceof Error ? err.message : "Connection failed",
      detail: "Database-backed operator surfaces are unavailable until connectivity is restored.",
    });
  }

  // Check Stripe configuration
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (stripeSecret && stripeWebhookSecret) {
    diagnostics.push({
      name: "Stripe Configuration",
      status: "ok",
      category: "integration",
      message: "Stripe keys configured",
      detail: "Checkout and billing portal routes are allowed to call Stripe.",
    });
  } else {
    diagnostics.push({
      name: "Stripe Configuration",
      status: "warning",
      category: "configuration",
      message: "Stripe keys not configured",
      detail:
        "Billing pages can render, but upgrade, checkout, and portal actions should be treated as disabled in this environment.",
    });
  }

  // Get last webhook received
  try {
    const lastWebhook = await prisma.stripeEvent.findFirst({
      orderBy: { receivedAt: "desc" },
      select: { receivedAt: true, type: true, status: true },
    });
    if (lastWebhook) {
      diagnostics.push({
        name: "Last Stripe Webhook",
        status: lastWebhook.status === "processed" ? "ok" : "warning",
        category: "integration",
        message: `${lastWebhook.type} - ${lastWebhook.status}`,
        detail:
          "This reflects persisted webhook processing state and may lag if background workers are not running.",
        value: lastWebhook.receivedAt.toISOString(),
      });
    } else {
      diagnostics.push({
        name: "Last Stripe Webhook",
        status: "warning",
        category: "data",
        message: "No webhooks received yet",
        detail:
          "No webhook events have been persisted in this environment yet; this is not an auth failure by itself.",
      });
    }
  } catch {
    diagnostics.push({
      name: "Last Stripe Webhook",
      status: "error",
      category: "integration",
      message: "Failed to query webhooks",
      detail: "Webhook health could not be verified because the stripe_events query failed.",
    });
  }

  // Get last reconciliation run
  try {
    const lastRun = await prisma.reconciliationRun.findFirst({
      orderBy: { startedAt: "desc" },
      select: { id: true, status: true, startedAt: true, matchedCount: true },
    });
    if (lastRun) {
      diagnostics.push({
        name: "Last Reconciliation Run",
        status:
          lastRun.status === "completed" ? "ok" : lastRun.status === "failed" ? "error" : "warning",
        category: "data",
        message: `Status: ${lastRun.status}, Matched: ${lastRun.matchedCount || 0}`,
        detail:
          "This value comes from persisted reconciliation runs. Pending status means execution did not fully complete yet.",
        value: lastRun.startedAt.toISOString(),
      });
    } else {
      diagnostics.push({
        name: "Last Reconciliation Run",
        status: "warning",
        category: "data",
        message: "No reconciliation runs yet",
        detail:
          "No run data exists yet for this tenant context. Create a run to validate this pipeline end-to-end.",
      });
    }
  } catch {
    diagnostics.push({
      name: "Last Reconciliation Run",
      status: "error",
      category: "data",
      message: "Failed to query reconciliation runs",
      detail: "Reconciliation history could not be read due to a database or authorization error.",
    });
  }

  // Check environment variables
  const requiredEnvVars = [
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ];
  const missingEnvVars = requiredEnvVars.filter(
    (key) => !process.env[key] && !process.env[`NEXT_PUBLIC_${key}`]
  );
  if (missingEnvVars.length === 0) {
    diagnostics.push({
      name: "Environment Variables",
      status: "ok",
      category: "configuration",
      message: "All required env vars present",
      detail: "Core runtime environment contracts are satisfied for authenticated route execution.",
    });
  } else {
    diagnostics.push({
      name: "Environment Variables",
      status: "warning",
      category: "configuration",
      message: `Missing: ${missingEnvVars.join(", ")}`,
      detail:
        "The console remains reachable, but missing variables will degrade auth/session hydration and dependent API actions.",
    });
  }

  return diagnostics;
}

export default async function DiagnosticsPage() {
  // Verify user is authenticated
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/console/diagnostics");
  }

  const diagnostics = await getDiagnostics();

  const getStatusIcon = (status: DiagnosticItem["status"]) => {
    switch (status) {
      case "ok":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusBadge = (status: DiagnosticItem["status"]) => {
    switch (status) {
      case "ok":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            OK
          </Badge>
        );
      case "warning":
        return (
          <Badge variant="default" className="bg-yellow-100 text-yellow-800">
            Warning
          </Badge>
        );
      case "error":
        return (
          <Badge variant="default" className="bg-red-100 text-red-800">
            Error
          </Badge>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">System Diagnostics</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Real-time system health and diagnostic information
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {diagnostics.map((item) => (
          <Card key={item.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{item.name}</CardTitle>
                {getStatusIcon(item.status)}
              </div>
              <CardDescription>{item.message}</CardDescription>
              <p className="text-xs text-muted-foreground">{item.detail}</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                {getStatusBadge(item.status)}
                <Badge variant="outline" className="uppercase">
                  {item.category}
                </Badge>
                {item.value && (
                  <span className="text-sm text-slate-500 font-mono">{item.value}</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Environment Information</CardTitle>
          <CardDescription>Runtime environment details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-sm">
            <div>
              <span className="text-slate-500">Node Version:</span>{" "}
              <span>{process.env.NODE_VERSION || "Unknown"}</span>
            </div>
            <div>
              <span className="text-slate-500">Environment:</span>{" "}
              <span>{process.env.NODE_ENV || "development"}</span>
            </div>
            <div>
              <span className="text-slate-500">Timestamp:</span>{" "}
              <span>{new Date().toISOString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
