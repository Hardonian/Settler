/**
 * Environment Error Panel
 *
 * Displays a friendly error message when environment variables are missing.
 * Used instead of crashing with a 500 error.
 */

"use client";

import { AlertCircle, Rocket, Terminal, BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EnvErrorPanelProps {
  missingVars: string[];
  isFirstRun?: boolean;
}

export function EnvErrorPanel({ missingVars, isFirstRun = false }: EnvErrorPanelProps) {
  // Determine if this looks like a first-run scenario
  const hasSupabaseVars = missingVars.some((v) => v.includes("SUPABASE") || v.includes("DATABASE"));
  const isFirstRunScenario = isFirstRun || (hasSupabaseVars && missingVars.length <= 3);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <CardTitle>
              {isFirstRunScenario ? "Welcome to Settler" : "Configuration Required"}
            </CardTitle>
          </div>
          <CardDescription>
            {isFirstRunScenario
              ? "Let's get your development environment set up"
              : "Missing required environment variables"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isFirstRunScenario && (
            <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <Rocket className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                    First time running Settler?
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Follow these steps to get started:
                  </p>
                  <ol className="text-xs text-blue-700 dark:text-blue-300 mt-2 space-y-1 list-decimal list-inside">
                    <li>
                      Copy{" "}
                      <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">
                        .env.example
                      </code>{" "}
                      to{" "}
                      <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">.env.local</code>
                    </li>
                    <li>Add your Supabase credentials</li>
                    <li>
                      Run{" "}
                      <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">
                        pnpm db:push
                      </code>{" "}
                      to set up the database
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              {isFirstRunScenario
                ? "The following environment variables need to be configured:"
                : "The following required environment variables are missing:"}
            </p>
            <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400 space-y-1">
              {missingVars.map((key) => (
                <li
                  key={key}
                  className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded inline-block mr-2"
                >
                  {key}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Terminal className="h-4 w-4 text-slate-500 mt-0.5" />
              <p className="text-xs text-slate-600 dark:text-slate-400">
                <strong>Quick setup:</strong> Copy{" "}
                <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">.env.example</code> to{" "}
                <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">.env.local</code> and
                fill in your Supabase project details.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/" className="flex items-center gap-1">
                Go Home
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/console/setup-check" className="flex items-center gap-1">
                <Terminal className="h-3 w-3" />
                Run Diagnostics
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/docs/getting-started" className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                Setup Guide
              </Link>
            </Button>
          </div>

          {isFirstRunScenario && (
            <p className="text-xs text-center text-muted-foreground pt-2">
              Need help? Check the{" "}
              <Link href="/docs" className="underline hover:text-foreground">
                documentation
              </Link>{" "}
              or{" "}
              <Link href="/support" className="underline hover:text-foreground">
                contact support
              </Link>
              .
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
