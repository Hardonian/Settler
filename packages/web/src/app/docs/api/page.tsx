import { Metadata } from "next";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowRight, CheckCircle2, FileJson, LifeBuoy, ShieldCheck, Terminal } from "lucide-react";

export const metadata: Metadata = {
  title: "API Reference | Settler Docs",
  description:
    "Production-facing API surfaces for deterministic runs, replayable evidence, and tenant-safe reconciliation workflows.",
};

type Endpoint = {
  method: "GET" | "POST";
  path: string;
  summary: string;
  details: string;
};

const coreEndpoints: Endpoint[] = [
  {
    method: "POST",
    path: "/api/v1/runs",
    summary: "Create reconciliation run",
    details:
      "Creates a tenant-scoped run. Requires Idempotency-Key and returns canonical run identifiers for downstream evidence and replay.",
  },
  {
    method: "GET",
    path: "/api/v1/runs",
    summary: "List runs",
    details:
      "Returns deterministic lifecycle, summary semantics, and provenance metadata for each run in the authenticated tenant.",
  },
  {
    method: "GET",
    path: "/api/v1/runs/{id}",
    summary: "Get run detail",
    details:
      "Provides canonical run/detail truth for a single run, including status labeling and machine-readable contract fields.",
  },
  {
    method: "GET",
    path: "/api/v1/runs/{id}/evidence",
    summary: "Fetch evidence payload",
    details:
      "Returns replay- and support-safe evidence artifacts for audit, operator handoff, and downstream control workflows.",
  },
  {
    method: "POST",
    path: "/api/v1/runs/{id}/replay",
    summary: "Replay run",
    details:
      "Re-executes a prior run contract to verify deterministic behavior and produce fresh traceable output.",
  },
  {
    method: "GET",
    path: "/api/v1/health | /api/v1/ready | /api/v1/meta",
    summary: "Health and posture probes",
    details:
      "Use liveness, readiness, and metadata probes to decide when to route traffic and surface explicit degraded states.",
  },
];

const errorCodes = [
  "SETTLER_AUTH_REQUIRED",
  "SETTLER_RATE_LIMITED",
  "SETTLER_TENANT_REQUIRED",
  "SETTLER_INVALID_INPUT",
  "SETTLER_CONFLICT",
  "SETTLER_NOT_FOUND",
  "SETTLER_NOT_IMPLEMENTED",
  "SETTLER_INTERNAL",
];

const curlCreateRun = `curl -X POST \"https://your-host/api/v1/runs\" \\
  -H \"X-API-Key: set_live_***\" \\
  -H \"Idempotency-Key: run-2026-04-close-001\" \\
  -H \"Content-Type: application/json\" \\
  -d '{
    "name": "April close - Stripe vs Bank",
    "sourceAdapter": "stripe",
    "targetAdapter": "bank_csv",
    "rules": []
  }'`;

const curlReadEvidence = `curl \"https://your-host/api/v1/runs/<run_id>/evidence\" \\
  -H \"X-API-Key: set_live_***\"`;

function MethodBadge({ method }: { method: Endpoint["method"] }) {
  return (
    <Badge
      variant="outline"
      className={
        method === "GET"
          ? "border-emerald-500/40 text-emerald-500"
          : "border-blue-500/40 text-blue-500"
      }
    >
      {method}
    </Badge>
  );
}

export default function DocsApiPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="border-b border-border/50 bg-muted/20 pt-24 pb-12 sm:pt-28 sm:pb-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Badge variant="outline" className="mb-5">
            API Product Surface
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            API reference (truthful, tenant-safe)
          </h1>
          <p className="mt-4 max-w-3xl text-muted-foreground">
            Settler APIs expose deterministic run execution, evidence retrieval, replay, and health
            posture. Contracts are designed for operator workflows and audit handoff, not dashboard
            theatre.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/openapi.json">
                Download v1 OpenAPI
                <FileJson className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/api/docs/openapi">
                Console API schema
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[2fr,1fr] lg:px-8 lg:py-14">
        <section className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Integration baseline</CardTitle>
              <CardDescription>
                Minimum contract expectations before first production call.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                • Authenticate with tenant-scoped API keys via{" "}
                <code className="text-foreground">X-API-Key</code>.
              </p>
              <p>
                • Send <code className="text-foreground">Idempotency-Key</code> on run creation to
                prevent duplicate financial actions.
              </p>
              <p>
                • Expect RFC7807-style problem responses and machine-readable{" "}
                <code className="text-foreground">code</code> values.
              </p>
              <p>
                • Use <code className="text-foreground">x-request-id</code> for support escalation
                and run-level traceability.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">Core endpoints</h2>
            <div className="space-y-3">
              {coreEndpoints.map((endpoint) => (
                <Card key={`${endpoint.method}-${endpoint.path}`}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <MethodBadge method={endpoint.method} />
                      <code className="rounded bg-muted px-2 py-1 text-sm text-foreground">
                        {endpoint.path}
                      </code>
                    </div>
                    <CardTitle className="text-base">{endpoint.summary}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 text-sm text-muted-foreground">
                    {endpoint.details}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Terminal className="h-4 w-4" />
                  Create run
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs text-foreground">
                  {curlCreateRun}
                </pre>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Terminal className="h-4 w-4" />
                  Fetch evidence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs text-foreground">
                  {curlReadEvidence}
                </pre>
              </CardContent>
            </Card>
          </div>
        </section>

        <aside className="space-y-4">
          <Alert>
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Degraded-state contract</AlertTitle>
            <AlertDescription>
              Readiness and rate-limit surfaces are explicit. If a dependency degrades, operators
              should still receive machine-visible status, not silent success.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Problem codes</CardTitle>
              <CardDescription>Stable error semantics for workflow automation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {errorCodes.map((code) => (
                <div
                  key={code}
                  className="rounded border border-border/60 bg-muted/30 px-2 py-1 font-mono text-xs"
                >
                  {code}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Need help integrating?</CardTitle>
              <CardDescription>
                For enterprise onboarding, include request IDs, endpoint path, and tenant scope in
                support intake.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/docs/support">
                  <LifeBuoy className="mr-2 h-4 w-4" />
                  Support intake
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-start">
                <Link href="/docs/auth">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Auth details
                </Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </main>

      <Footer />
    </div>
  );
}
