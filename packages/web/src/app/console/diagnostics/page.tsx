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
  message: string;
  value?: string | number;
}

async function getDiagnostics(): Promise<DiagnosticItem[]> {
  const diagnostics: DiagnosticItem[] = [];

  // Check Supabase connection
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("tenants").select("id").limit(1);
    if (error) {
      // Log error but don't throw - graceful degradation
      diagnostics.push({
        name: "Supabase Connection",
        status: "error",
        message: error.message || "Connection failed",
      });
      // Continue to next check instead of throwing
    } else {
      diagnostics.push({
        name: "Supabase Connection",
        status: "ok",
        message: "Connected successfully",
      });
    }
  } catch (err) {
    diagnostics.push({
      name: "Supabase Connection",
      status: "error",
      message: err instanceof Error ? err.message : "Connection failed",
    });
  }

  // Check Prisma connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    diagnostics.push({
      name: "Database Connection",
      status: "ok",
      message: "Connected successfully",
    });
  } catch (err) {
    diagnostics.push({
      name: "Database Connection",
      status: "error",
      message: err instanceof Error ? err.message : "Connection failed",
    });
  }

  // Check Stripe configuration
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (stripeSecret && stripeWebhookSecret) {
    diagnostics.push({
      name: "Stripe Configuration",
      status: "ok",
      message: "Stripe keys configured",
    });
  } else {
    diagnostics.push({
      name: "Stripe Configuration",
      status: "warning",
      message: "Stripe keys not configured",
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
        message: `${lastWebhook.type} - ${lastWebhook.status}`,
        value: lastWebhook.receivedAt.toISOString(),
      });
    } else {
      diagnostics.push({
        name: "Last Stripe Webhook",
        status: "warning",
        message: "No webhooks received yet",
      });
    }
  } catch (err) {
    diagnostics.push({
      name: "Last Stripe Webhook",
      status: "error",
      message: "Failed to query webhooks",
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
        message: `Status: ${lastRun.status}, Matched: ${lastRun.matchedCount || 0}`,
        value: lastRun.startedAt.toISOString(),
      });
    } else {
      diagnostics.push({
        name: "Last Reconciliation Run",
        status: "warning",
        message: "No reconciliation runs yet",
      });
    }
  } catch (err) {
    diagnostics.push({
      name: "Last Reconciliation Run",
      status: "error",
      message: "Failed to query reconciliation runs",
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
      message: "All required env vars present",
    });
  } else {
    diagnostics.push({
      name: "Environment Variables",
      status: "warning",
      message: `Missing: ${missingEnvVars.join(", ")}`,
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
    redirect("/auth/login");
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
        <p className="text-gray-600 dark:text-gray-400">
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
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                {getStatusBadge(item.status)}
                {item.value && (
                  <span className="text-sm text-gray-500 font-mono">{item.value}</span>
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
              <span className="text-gray-500">Node Version:</span>{" "}
              <span>{process.env.NODE_VERSION || "Unknown"}</span>
            </div>
            <div>
              <span className="text-gray-500">Environment:</span>{" "}
              <span>{process.env.NODE_ENV || "development"}</span>
            </div>
            <div>
              <span className="text-gray-500">Timestamp:</span>{" "}
              <span>{new Date().toISOString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
