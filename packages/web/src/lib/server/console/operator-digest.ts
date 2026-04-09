/**
 * Evidence-backed operator digest for solo operators (no synthetic fleet health).
 */

import { createClient } from "@/lib/supabase/server";
import { getAccountPlanCode } from "@/domain/billing/entitlements";
import { getPlanConfig, mapLegacyPlanId } from "@/domain/billing/planConfig";
import { appLogger } from "@/lib/utils/logger";
import { prisma } from "@/shared/db/prismaClient";

export type DigestSeverity = "attention" | "degraded" | "info";

export interface OperatorDigestItem {
  id: string;
  severity: DigestSeverity;
  title: string;
  detail: string;
  href: string;
  evidence: Record<string, string | number | boolean | null>;
}

export interface OperatorDigest {
  generatedAt: string;
  degraded: boolean;
  degradedReason?: string;
  items: OperatorDigestItem[];
  billing?: {
    planCode: string;
    planName: string;
    reconciliationLimit: number | null;
    exceptionIncludedApprox: number | null;
    note: string;
  };
}

export async function getOperatorDigest(): Promise<OperatorDigest> {
  const generatedAt = new Date().toISOString();

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        generatedAt,
        degraded: false,
        items: [],
      };
    }

    const { data: memberships } = (await supabase
      .from("tenant_users" as never)
      .select("tenant_id, role")
      .eq("user_id", user.id)) as {
      data: Array<{ tenant_id: string | null; role: string | null }> | null;
    };

    const tenantIds = Array.from(
      new Set((memberships || []).map((m) => m.tenant_id).filter((id): id is string => Boolean(id)))
    );

    if (tenantIds.length === 0) {
      return {
        generatedAt,
        degraded: false,
        items: [
          {
            id: "no_workspace",
            severity: "attention",
            title: "No workspace membership",
            detail: "Create or join a workspace before reconciliation truth can be summarized.",
            href: "/console/onboarding",
            evidence: { tenantCount: 0 },
          },
        ],
      };
    }

    const items: OperatorDigestItem[] = [];

    const { count: integrationCountResult, error: integrationCountError } = await supabase
      .from("integration_credentials" as never)
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_connected", true);

    const integrationCount = integrationCountError != null ? -1 : (integrationCountResult ?? 0);

    const [
      tenantRows,
      runAgg,
      failedRuns7d,
      adjudicationCount,
      proofFinalized,
      evidenceTotal,
      degradedEvidence,
      scheduledJobs,
    ] = await Promise.all([
      prisma.tenant.findMany({
        where: { id: { in: tenantIds } },
        select: {
          id: true,
          name: true,
          isActive: true,
          billingAccountId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.reconciliationRun.groupBy({
        by: ["tenantId", "status"],
        where: { tenantId: { in: tenantIds } },
        _count: { _all: true },
      }),
      prisma.reconciliationRun.count({
        where: {
          tenantId: { in: tenantIds },
          status: "failed",
          startedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.exceptionAdjudicationMemory.count({
        where: { tenantId: { in: tenantIds } },
      }),
      prisma.proofPackage.count({
        where: { tenantId: { in: tenantIds }, status: "finalized" },
      }),
      prisma.evidenceArtifact.count({
        where: { tenantId: { in: tenantIds } },
      }),
      prisma.evidenceArtifact.count({
        where: { tenantId: { in: tenantIds }, degraded: true },
      }),
      prisma.reconJob.count({
        where: {
          tenantId: { in: tenantIds },
          deletedAt: null,
          scheduleCron: { not: null },
          NOT: { scheduleCron: "" },
        },
      }),
    ]);

    const unresolvedByTenant = await prisma.reconciliationMatch.groupBy({
      by: ["tenantId"],
      where: {
        tenantId: { in: tenantIds },
        reviewed: false,
        matchType: { in: ["unmatched", "conflict"] },
      },
      _count: { _all: true },
    });

    const unresolvedMap = new Map<string, number>(
      unresolvedByTenant.map((row: { tenantId: string; _count: { _all: number } }) => [
        row.tenantId,
        row._count._all,
      ])
    );

    for (const t of tenantRows) {
      const u = Number(unresolvedMap.get(t.id) ?? 0);
      if (!t.isActive) {
        items.push({
          id: `tenant_inactive_${t.id}`,
          severity: "attention",
          title: `Workspace inactive: ${t.name}`,
          detail: "Tenant is marked inactive in Prisma; review before treating as production.",
          href: "/console/organizations",
          evidence: { tenantId: t.id, unresolvedExceptions: u },
        });
      } else if (u >= 10) {
        items.push({
          id: `hot_exceptions_${t.id}`,
          severity: "attention",
          title: `Exception queue depth: ${t.name}`,
          detail: `${u} unmatched/conflict rows still need review for this workspace.`,
          href: "/console/exceptions",
          evidence: { tenantId: t.id, unresolvedExceptions: u },
        });
      } else if (u > 0) {
        items.push({
          id: `open_exceptions_${t.id}`,
          severity: "info",
          title: `Open exceptions: ${t.name}`,
          detail: `${u} exception row(s) awaiting review.`,
          href: "/console/exceptions",
          evidence: { tenantId: t.id, unresolvedExceptions: u },
        });
      }
    }

    const totalRuns = runAgg.reduce(
      (s: number, r: { _count: { _all: number } }) => s + r._count._all,
      0
    );
    if (totalRuns === 0) {
      items.push({
        id: "no_runs",
        severity: "attention",
        title: "No reconciliation runs on record",
        detail: "There is no run history to evaluate match quality or exception load.",
        href: "/console/runs",
        evidence: { runCount: 0 },
      });
    }

    if (failedRuns7d > 0) {
      items.push({
        id: "failed_runs_7d",
        severity: "degraded",
        title: "Failed runs in the last 7 days",
        detail: `${failedRuns7d} reconciliation run(s) failed in the rolling week.`,
        href: "/console/runs",
        evidence: { failedRuns7d },
      });
    }

    if (integrationCount === 0) {
      items.push({
        id: "no_integration",
        severity: "attention",
        title: "No connected integration",
        detail:
          "Supabase reports zero integration_credentials rows with is_connected=true for this user.",
        href: "/console/onboarding",
        evidence: { supabaseIntegrationCount: 0 },
      });
    } else if (integrationCount < 0) {
      items.push({
        id: "integration_unavailable",
        severity: "degraded",
        title: "Integration credential query unavailable",
        detail: "Could not read integration_credentials from Supabase.",
        href: "/console/setup-check",
        evidence: { supabaseError: true },
      });
    }

    if (degradedEvidence > 0) {
      items.push({
        id: "degraded_evidence",
        severity: "degraded",
        title: "Degraded evidence artifacts",
        detail: `${degradedEvidence} evidence artifact(s) explicitly marked degraded.`,
        href: "/console/proof-explorer",
        evidence: { degradedEvidence, totalEvidence: evidenceTotal },
      });
    }

    if (evidenceTotal > 0 && proofFinalized === 0) {
      items.push({
        id: "proof_gap",
        severity: "attention",
        title: "Evidence without finalized proof",
        detail:
          "Evidence artifacts exist but no finalized proof package yet — export posture is incomplete.",
        href: "/console/proof-explorer",
        evidence: { evidenceTotal, finalizedProofPackages: proofFinalized },
      });
    }

    if (totalRuns > 0 && scheduledJobs === 0) {
      items.push({
        id: "no_schedule",
        severity: "info",
        title: "No scheduled recon jobs",
        detail: "Runs exist but no recon_jobs row has schedule_cron set for these tenants.",
        href: "/console/schedules",
        evidence: { scheduledJobs, totalRuns },
      });
    }

    if (adjudicationCount === 0 && totalRuns > 0) {
      items.push({
        id: "no_adjudication",
        severity: "info",
        title: "No adjudication memory yet",
        detail:
          "Cross-run exception intelligence stays thin until at least one adjudication is recorded.",
        href: "/console/exceptions",
        evidence: { adjudicationCount, totalRuns },
      });
    }

    items.sort((a, b) => {
      const rank = (s: DigestSeverity) => (s === "degraded" ? 0 : s === "attention" ? 1 : 2);
      return rank(a.severity) - rank(b.severity);
    });

    let billing: OperatorDigest["billing"];
    let billingAccountId =
      tenantRows.find((row: (typeof tenantRows)[number]) => row.billingAccountId)
        ?.billingAccountId ?? null;
    if (!billingAccountId) {
      const { data: baRow } = await supabase
        .from("billing_accounts")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .is("deleted_at", null)
        .maybeSingle();
      if (baRow && typeof baRow === "object" && "id" in baRow) {
        billingAccountId = (baRow as { id: string }).id;
      }
    }

    if (billingAccountId) {
      try {
        const planCode = await getAccountPlanCode(billingAccountId);
        const cfg = getPlanConfig(planCode);
        const reconVol =
          cfg?.limits.reconcile.monthlyVolume != null && cfg.limits.reconcile.monthlyVolume > 0
            ? cfg.limits.reconcile.monthlyVolume
            : null;
        const exceptionApprox =
          reconVol != null ? Math.floor(reconVol * cfg!.limits.exceptions.includedRate) : null;
        billing = {
          planCode,
          planName: cfg?.name ?? planCode,
          reconciliationLimit: reconVol,
          exceptionIncludedApprox: exceptionApprox,
          note: "Limits from canonical plan spine; usage vs limit is not computed in this digest.",
        };
      } catch {
        billing = {
          planCode: "unknown",
          planName: "unknown",
          reconciliationLimit: null,
          exceptionIncludedApprox: null,
          note: "Billing account present but plan lookup failed.",
        };
      }
    }

    if (!billing && billingAccountId) {
      const { data: subRow } = await supabase
        .from("subscriptions")
        .select("plan_id")
        .eq("billing_account_id", billingAccountId)
        .in("status", ["active", "trialing"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subRow && typeof subRow === "object" && "plan_id" in subRow) {
        const raw = (subRow as { plan_id: string | null }).plan_id;
        if (raw) {
          const planCode = mapLegacyPlanId(raw);
          const cfg = getPlanConfig(planCode);
          const reconVol =
            cfg?.limits.reconcile.monthlyVolume != null && cfg.limits.reconcile.monthlyVolume > 0
              ? cfg.limits.reconcile.monthlyVolume
              : null;
          const exceptionApprox =
            reconVol != null ? Math.floor(reconVol * cfg!.limits.exceptions.includedRate) : null;
          billing = {
            planCode,
            planName: cfg?.name ?? planCode,
            reconciliationLimit: reconVol,
            exceptionIncludedApprox: exceptionApprox,
            note: "Plan from Supabase subscriptions.plan_id mapped via canonical spine (Prisma subscription missing).",
          };
        }
      }
    }

    return {
      generatedAt,
      degraded: items.some((i) => i.severity === "degraded"),
      items: items.slice(0, 25),
      ...(billing ? { billing } : {}),
    };
  } catch (error) {
    appLogger.error("[Operator Digest] Failed", error);
    return {
      generatedAt,
      degraded: true,
      degradedReason: error instanceof Error ? error.message : "digest_failed",
      items: [
        {
          id: "digest_unavailable",
          severity: "degraded",
          title: "Operator digest unavailable",
          detail: "An error occurred building the digest; see logs for the exception.",
          href: "/console/setup-check",
          evidence: { fatal: true },
        },
      ],
    };
  }
}
