/**
 * Investor & Partner Proof Page
 *
 * PHASE 7: INVESTOR & PARTNER PROOF MODE
 *
 * Read-only metrics views for external scrutiny.
 * Clear articulation of defensibility and scalability.
 */

import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, TrendingUp, Zap, Lock } from "lucide-react";

export const revalidate = 3600;

type InvestorMetrics = {
  totalTenants: number;
  totalReconciliations: number;
  totalRecords: number;
  activeSubscriptions: number;
  source: "live" | "fallback";
};

const FALLBACK_METRICS: InvestorMetrics = {
  totalTenants: 0,
  totalReconciliations: 0,
  totalRecords: 0,
  activeSubscriptions: 0,
  source: "fallback",
};

async function loadInvestorMetrics(): Promise<InvestorMetrics> {
  try {
    const { prisma } = await import("@/shared/db/prismaClient");

    const [totalTenants, totalReconciliations, totalRecordsProcessed, activeSubscriptions] =
      await Promise.all([
        prisma.tenant.count({
          where: { isActive: true },
        }),
        prisma.reconResult.count({
          where: {
            status: "completed",
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),
        prisma.usageEvent.aggregate({
          where: {
            eventType: {
              startsWith: "value:records_processed",
            },
            timestamp: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
          _sum: {
            quantity: true,
          },
        }),
        prisma.subscription.count({
          where: {
            status: {
              in: ["active", "trialing"],
            },
          },
        }),
      ]);

    return {
      totalTenants,
      totalReconciliations,
      totalRecords: Number(totalRecordsProcessed._sum.quantity) || 0,
      activeSubscriptions,
      source: "live",
    };
  } catch {
    return FALLBACK_METRICS;
  }
}

async function InvestorProofContent() {
  const metrics = await loadInvestorMetrics();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Settler: Product Proof</h1>
        <p className="text-muted-foreground">
          Measurable value, defensible technology, scalable operations
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Tenants</CardDescription>
            <CardTitle className="text-3xl">{metrics.totalTenants.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Last 30 days</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Reconciliations Completed</CardDescription>
            <CardTitle className="text-3xl">
              {metrics.totalReconciliations.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Last 30 days</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Records Processed</CardDescription>
            <CardTitle className="text-3xl">{metrics.totalRecords.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Last 30 days</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Subscriptions</CardDescription>
            <CardTitle className="text-3xl">
              {metrics.activeSubscriptions.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Current</div>
          </CardContent>
        </Card>
      </div>

      {metrics.source === "fallback" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Live metrics unavailable</CardTitle>
            <CardDescription>
              Rendering fallback values because optional data services are not configured in this
              environment.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Defensibility */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <CardTitle>Defensibility</CardTitle>
          </div>
          <CardDescription>Why this is hard to replicate</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">1. Data Normalization Engine</h3>
            <p className="text-sm text-muted-foreground">
              The verified adapter registry normalizes supported payment and ledger sources into a
              consistent schema. Coverage is evidenced by registry and adapter-contract checks.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">2. Intelligent Matching Algorithms</h3>
            <p className="text-sm text-muted-foreground">
              Deterministic matching is the default, with explicit tolerances and replayable run
              serialization. Optional ML-assisted matching stays outside the deterministic boundary.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">3. Real-time Processing Infrastructure</h3>
            <p className="text-sm text-muted-foreground">
              Stateless reconciliation jobs can be distributed across workers. Throughput and
              latency are deployment-specific and must be demonstrated with target-environment load
              evidence.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">4. Schema Drift Detection</h3>
            <p className="text-sm text-muted-foreground">
              Automatic detection of schema changes in source systems, preventing silent failures.
              Requires contract versioning and migration systems.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Scalability */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <CardTitle>Scalability</CardTitle>
          </div>
          <CardDescription>What scales automatically</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Horizontal Scaling</h3>
            <p className="text-sm text-muted-foreground">
              Stateless reconciliation jobs can run in parallel across multiple workers. Database
              connection pooling and query optimization handle increased load.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Cost Efficiency</h3>
            <p className="text-sm text-muted-foreground">
              Scale-to-zero deployment options reduce idle compute, while database, queue, and
              observability costs remain workload- and provider-dependent.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Multi-tenancy</h3>
            <p className="text-sm text-muted-foreground">
              Tenant isolation at the database level ensures security and performance. Each tenant's
              data is logically separated but physically co-located for efficiency.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Unit Economics */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            <CardTitle>Unit Economics</CardTitle>
          </div>
          <CardDescription>Commercial metrics require source-backed diligence data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                Average Revenue Per User (ARPU)
              </div>
              <div className="text-2xl font-bold text-foreground">Confidential</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                Customer Acquisition Cost (CAC)
              </div>
              <div className="text-2xl font-bold text-foreground">Not published</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Lifetime Value (LTV)</div>
              <div className="text-2xl font-bold text-foreground">Not published</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">LTV:CAC Ratio</div>
              <div className="text-2xl font-bold text-foreground">Not published</div>
            </div>
          </div>
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>Evidence boundary:</strong> This public product surface does not synthesize
              unit economics. Current cohort definitions, source exports, and calculation periods
              belong in the confidential diligence package.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security & Compliance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-red-600" />
            <CardTitle>Security & Compliance</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge>SOC 2 program — incomplete</Badge>
            <Badge>Regulatory scope — deployment review</Badge>
            <Badge>Tenant isolation checks</Badge>
            <Badge>Audit Logging</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Security controls are described by their verification evidence. No certification or
            regulatory attestation is represented as complete on this page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function InvestorProofPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading proof data...</p>
          </div>
        </div>
      }
    >
      <InvestorProofContent />
    </Suspense>
  );
}
