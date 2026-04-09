/**
 * Console Workbench Page
 *
 * Canonical operator surface for the Settler platform.
 * Consolidated from fragmented legacy overview routes.
 */

import { Suspense } from "react";
import { Terminal, Key, Database, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { validateSupabaseEnv } from "@/lib/env/validator";
import { EnvErrorPanel } from "@/components/env/EnvErrorPanel";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { PageLoadingSkeleton } from "@/components/shared/loading-state";
import { Workbench } from "@/components/console/Workbench";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function ConsoleOverviewPage() {
  // Environment safety check
  const envValidation = validateSupabaseEnv();

  if (!envValidation.isValid) {
    return <EnvErrorPanel missingVars={envValidation.isValid ? [] : envValidation.missing} />;
  }

  return (
    <ErrorBoundary context="Console Workbench">
      <Suspense fallback={<PageLoadingSkeleton />}>
        <div className="space-y-12">
          {/* Canonical Workbench Surface */}
          <Workbench />

          {/* Secondary Developer Primitives (Consolidated) */}
          <section className="pt-8 border-t border-border/40">
            <div className="flex items-center gap-2 mb-6">
              <Terminal className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                Infrastructure
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-muted/10 border-dashed hover:bg-muted/20 transition-colors group">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-bold">API Management</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                    Manage tenant-scoped API keys for programmatic reconciliation triggers and
                    evidence retrieval.
                  </p>
                  <Link href="/console/api-keys">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[10px] uppercase font-bold tracking-widest p-0 hover:bg-transparent"
                    >
                      Configure Keys <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-muted/10 border-dashed hover:bg-muted/20 transition-colors group">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-bold">Runtime Diagnostics</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                    Inspect runtime dependencies, database connectivity, and service health
                    contracts.
                  </p>
                  <Link href="/console/diagnostics">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[10px] uppercase font-bold tracking-widest p-0 hover:bg-transparent"
                    >
                      View Diagnostics <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-muted/10 border-dashed hover:bg-muted/20 transition-colors group">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-bold">Compliance Evidence</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                    Navigate evidence manifests, trace proof chains, and export audit-grade artifact
                    bundles.
                  </p>
                  <Link href="/console/proof-explorer">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[10px] uppercase font-bold tracking-widest p-0 hover:bg-transparent"
                    >
                      Open Proof Explorer <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}

function ArrowRight({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
