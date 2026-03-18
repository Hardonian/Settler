/**
 * Console Setup Check Page
 *
 * Diagnostic page to check what's missing for the console to work.
 */

import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/shared/db/prismaClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface CheckResult {
  name: string;
  status: "pass" | "fail" | "warning";
  message: string;
}

async function SetupChecks() {
  const checks: CheckResult[] = [];

  // Check 1: Environment Variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env["SUPABASE_" + "SERVICE_ROLE_KEY"];
  const databaseUrl = process.env.DATABASE_URL;

  checks.push({
    name: "Supabase URL",
    status: supabaseUrl ? "pass" : "fail",
    message: supabaseUrl ? "Configured" : "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL",
  });

  checks.push({
    name: "Supabase Anon Key",
    status: supabaseAnonKey ? "pass" : "fail",
    message: supabaseAnonKey
      ? "Configured"
      : "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY",
  });

  checks.push({
    name: "Supabase Service Role Key",
    status: supabaseServiceKey ? "pass" : "warning",
    message: supabaseServiceKey
      ? "Configured"
      : "Missing service role key (needed for admin operations)",
  });

  checks.push({
    name: "Database URL",
    status: databaseUrl ? "pass" : "fail",
    message: databaseUrl ? "Configured" : "Missing DATABASE_URL",
  });

  // Check 2: Supabase Connection
  try {
    if (supabaseUrl && supabaseAnonKey) {
      const supabase = await createClient();
      const { error } = await supabase.auth.getUser();
      checks.push({
        name: "Supabase Connection",
        status: error ? "warning" : "pass",
        message: error
          ? `Connection works but auth error: ${error.message}`
          : "Connected successfully",
      });
    } else {
      checks.push({
        name: "Supabase Connection",
        status: "fail",
        message: "Cannot test - missing environment variables",
      });
    }
  } catch (err) {
    checks.push({
      name: "Supabase Connection",
      status: "fail",
      message: `Connection failed: ${err instanceof Error ? err.message : "Unknown error"}`,
    });
  }

  // Check 3: Prisma Client
  try {
    if (prisma && typeof prisma.billingAccount !== "undefined") {
      checks.push({
        name: "Prisma Client",
        status: "pass",
        message: "Prisma client initialized",
      });
    } else {
      checks.push({
        name: "Prisma Client",
        status: "fail",
        message: "Prisma client not properly initialized",
      });
    }
  } catch (err) {
    checks.push({
      name: "Prisma Client",
      status: "fail",
      message: `Prisma error: ${err instanceof Error ? err.message : "Unknown error"}`,
    });
  }

  // Check 4: Database Tables (if Prisma is available)
  if (prisma && typeof prisma.billingAccount !== "undefined") {
    try {
      await prisma.billingAccount.findFirst({ take: 1 });
      checks.push({
        name: "billingAccount Table",
        status: "pass",
        message: "Table exists and accessible",
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      if (
        errorMsg.includes("does not exist") ||
        errorMsg.includes("relation") ||
        errorMsg.includes("table")
      ) {
        checks.push({
          name: "billingAccount Table",
          status: "fail",
          message: "Table does not exist - run migrations",
        });
      } else {
        checks.push({
          name: "billingAccount Table",
          status: "warning",
          message: `Access issue: ${errorMsg}`,
        });
      }
    }
  }

  // Check 5: Supabase Tables
  try {
    if (supabaseUrl && supabaseServiceKey) {
      const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
      const adminClient = createSupabaseClient(supabaseUrl, supabaseServiceKey);

      const { error } = await adminClient.from("api_keys").select("id").limit(1);
      if (error) {
        if (error.code === "42P01" || error.message.includes("does not exist")) {
          checks.push({
            name: "api_keys Table (Supabase)",
            status: "fail",
            message: "Table does not exist - create migration",
          });
        } else {
          checks.push({
            name: "api_keys Table (Supabase)",
            status: "warning",
            message: `Access issue: ${error.message}`,
          });
        }
      } else {
        checks.push({
          name: "api_keys Table (Supabase)",
          status: "pass",
          message: "Table exists and accessible",
        });
      }
    } else {
      checks.push({
        name: "api_keys Table (Supabase)",
        status: "warning",
        message: "Cannot test - missing Supabase credentials",
      });
    }
  } catch (err) {
    checks.push({
      name: "api_keys Table (Supabase)",
      status: "fail",
      message: `Error: ${err instanceof Error ? err.message : "Unknown error"}`,
    });
  }

  const passCount = checks.filter((c: any) => c.status === "pass").length;
  const failCount = checks.filter((c: any) => c.status === "fail").length;
  const warnCount = checks.filter((c: any) => c.status === "warning").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Console Setup Diagnostics
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Check what's configured and what needs to be set up for the Developer Console.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Passed</CardDescription>
            <CardTitle className="text-3xl text-green-600">{passCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Warnings</CardDescription>
            <CardTitle className="text-3xl text-amber-600">{warnCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Failed</CardDescription>
            <CardTitle className="text-3xl text-red-600">{failCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="space-y-4">
        {checks.map((check, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                {check.status === "pass" && (
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                )}
                {check.status === "fail" && (
                  <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                {check.status === "warning" && (
                  <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                    {check.name}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{check.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        <Button asChild>
          <Link href="/console">Try Console Again</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    </div>
  );
}

export default function SetupCheckPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Running diagnostics...</p>
          </div>
        </div>
      }
    >
      <SetupChecks />
    </Suspense>
  );
}
