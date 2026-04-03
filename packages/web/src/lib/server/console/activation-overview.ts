import { createClient } from "@/lib/supabase/server";
import { validateSupabaseEnv } from "@/lib/env/validator";
import {
  readinessStateToTaskState,
  resolveReadinessState,
  type ReadinessCheck,
  type ReadinessState,
} from "@/lib/activation/readiness";
import type {
  ConsoleActivationCounts,
  ConsoleActivationOverview,
  ConsoleActivationTask,
} from "@/lib/activation/overview";
import { appLogger } from "@/lib/utils/logger";
import { prisma } from "@/shared/db/prismaClient";

type MembershipRow = {
  tenant_id: string | null;
  role: string | null;
};

type IntegrationRow = {
  integration_id: string | null;
  last_sync_at: string | null;
  status: string | null;
};

type WorkspaceSummary = ConsoleActivationOverview["workspaces"][number];

function hasDatabaseRuntimeConfig(): boolean {
  return Boolean(
    process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL || process.env.DIRECT_URL
  );
}

function buildTask(args: {
  id: string;
  label: string;
  description: string;
  state: ReadinessState;
  href: string;
  actionLabel: string;
}): ConsoleActivationTask {
  return {
    id: args.id,
    label: args.label,
    description: args.description,
    state: readinessStateToTaskState(args.state),
    href: args.href,
    actionLabel: args.actionLabel,
  };
}

export async function getConsoleActivationOverview(): Promise<ConsoleActivationOverview> {
  const generatedAt = new Date().toISOString();
  const envValidation = validateSupabaseEnv();
  const systemChecks: ReadinessCheck[] = [
    {
      id: "supabase_runtime",
      label: "Supabase runtime",
      state: envValidation.isValid ? "ready" : "setup_required",
      summary: envValidation.isValid
        ? "Authentication runtime is configured."
        : "Required Supabase variables are missing.",
      detail: envValidation.isValid
        ? "Console auth and tenant checks can run with the current environment configuration."
        : `Missing ${envValidation.missing.join(", ")}. Fix runtime configuration before treating any console state as trustworthy.`,
      href: "/console/setup-check",
      actionLabel: "Open diagnostics",
    },
    {
      id: "database_runtime",
      label: "Database runtime",
      state: hasDatabaseRuntimeConfig() ? "ready" : "setup_required",
      summary: hasDatabaseRuntimeConfig()
        ? "Database connection string is present."
        : "Database runtime configuration is missing.",
      detail: hasDatabaseRuntimeConfig()
        ? "Settler can attempt tenant-scoped reads and proof queries."
        : "Set DATABASE_URL, SUPABASE_DATABASE_URL, or DIRECT_URL before validating runs, exceptions, or proof exports.",
      href: "/console/setup-check",
      actionLabel: "Review database checks",
    },
  ];

  const emptyCounts: ConsoleActivationCounts = {
    workspaces: 0,
    activeWorkspaces: 0,
    connectedIntegrations: 0,
    reconciliationRuns: 0,
    unresolvedExceptions: 0,
    adjudicationMemories: 0,
    evidenceArtifacts: 0,
    degradedEvidenceArtifacts: 0,
    finalizedProofPackages: 0,
  };

  if (!envValidation.isValid) {
    const journeyChecks: ReadinessCheck[] = [
      {
        id: "workspace_access",
        label: "Workspace access",
        state: "setup_required",
        summary: "Workspace access cannot be verified until runtime configuration is fixed.",
        detail:
          "Settler fails closed here. Restore the Supabase and database runtime first, then verify membership and workspace setup.",
        href: "/console/setup-check",
        actionLabel: "Fix runtime setup",
      },
    ];

    return {
      generatedAt,
      overallState: resolveReadinessState([...systemChecks, ...journeyChecks]),
      authState: "unauthenticated",
      counts: emptyCounts,
      workspaces: [],
      systemChecks,
      journeyChecks,
      tasks: [
        buildTask({
          id: "fix_runtime",
          label: "Restore runtime configuration",
          description:
            "Set the missing Supabase and database variables before onboarding a real workspace.",
          state: "setup_required",
          href: "/console/setup-check",
          actionLabel: "Open diagnostics",
        }),
      ],
      lastRunAt: null,
      lastDecisionAt: null,
    };
  }

  let supabase;
  try {
    supabase = await createClient();
  } catch (error) {
    appLogger.error("[Console Activation] Failed to create Supabase client", error);
    const journeyChecks: ReadinessCheck[] = [
      {
        id: "workspace_access",
        label: "Workspace access",
        state: "unavailable",
        summary: "Workspace access could not be loaded.",
        detail:
          "Settler could not initialize the Supabase client, so tenant-scoped setup status is unavailable.",
        href: "/console/setup-check",
        actionLabel: "Open diagnostics",
      },
    ];

    return {
      generatedAt,
      overallState: resolveReadinessState([...systemChecks, ...journeyChecks]),
      authState: "unauthenticated",
      counts: emptyCounts,
      workspaces: [],
      systemChecks,
      journeyChecks,
      tasks: [
        buildTask({
          id: "restore_auth_runtime",
          label: "Restore authentication runtime",
          description:
            "The console could not initialize tenant-scoped access, so onboarding is blocked.",
          state: "unavailable",
          href: "/console/setup-check",
          actionLabel: "Inspect diagnostics",
        }),
      ],
      lastRunAt: null,
      lastDecisionAt: null,
    };
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      generatedAt,
      overallState: resolveReadinessState(systemChecks),
      authState: "unauthenticated",
      counts: emptyCounts,
      workspaces: [],
      systemChecks,
      journeyChecks: [
        {
          id: "workspace_access",
          label: "Workspace access",
          state: "unavailable",
          summary: "Sign in to load tenant-scoped onboarding status.",
          detail: "Settler does not infer workspace readiness without an authenticated session.",
          href: "/login",
          actionLabel: "Sign in",
        },
      ],
      tasks: [
        buildTask({
          id: "sign_in",
          label: "Authenticate to continue",
          description:
            "Sign in before creating a workspace, reviewing exceptions, or exporting proof.",
          state: "unavailable",
          href: "/login",
          actionLabel: "Sign in",
        }),
      ],
      lastRunAt: null,
      lastDecisionAt: null,
    };
  }

  const { data: memberships, error: membershipError } = (await supabase
    .from("tenant_users" as never)
    .select("tenant_id, role")
    .eq("user_id", user.id)) as {
    data: MembershipRow[] | null;
    error: { message?: string } | null;
  };

  const tenantIds = Array.from(
    new Set(
      (memberships || [])
        .map((membership) => membership.tenant_id)
        .filter((tenantId): tenantId is string => Boolean(tenantId))
    )
  );

  const workspaceRoleMap = new Map<string, string>();
  for (const membership of memberships || []) {
    if (membership.tenant_id) {
      workspaceRoleMap.set(membership.tenant_id, membership.role || "viewer");
    }
  }

  const workspaceCheck: ReadinessCheck = membershipError
    ? {
        id: "workspace_access",
        label: "Workspace access",
        state: "unavailable",
        summary: "Workspace membership could not be verified.",
        detail: membershipError.message || "Tenant membership lookup failed.",
        href: "/console/setup-check",
        actionLabel: "Open diagnostics",
      }
    : tenantIds.length === 0
      ? {
          id: "workspace_access",
          label: "Workspace access",
          state: "setup_required",
          summary: "No workspace membership found yet.",
          detail:
            "Create or join a workspace before running reconciliations or reviewing exceptions.",
          href: "/console/onboarding",
          actionLabel: "Create workspace",
        }
      : {
          id: "workspace_access",
          label: "Workspace access",
          state: "ready",
          summary: `${tenantIds.length} workspace${tenantIds.length === 1 ? "" : "s"} available.`,
          detail:
            "Tenant-scoped routes can resolve an operator workspace without founder intervention.",
          href: "/console/organizations",
          actionLabel: "View workspaces",
        };

  const { data: connectedIntegrations, error: integrationError } = (await supabase
    .from("integration_credentials" as never)
    .select("integration_id, last_sync_at, status")
    .eq("user_id", user.id)
    .eq("is_connected", true)) as {
    data: IntegrationRow[] | null;
    error: { message?: string } | null;
  };

  let workspaceRows: WorkspaceSummary[] = [];
  let databaseAvailable = hasDatabaseRuntimeConfig();
  let lastRunAt: string | null = null;
  let lastDecisionAt: string | null = null;
  const counts: ConsoleActivationCounts = { ...emptyCounts };
  counts.workspaces = tenantIds.length;
  counts.activeWorkspaces = tenantIds.length;
  counts.connectedIntegrations = connectedIntegrations?.length || 0;

  if (databaseAvailable && tenantIds.length > 0) {
    try {
      const [
        workspaceEntities,
        runCount,
        lastRun,
        unresolvedExceptions,
        adjudicationMemories,
        lastDecision,
        evidenceArtifactCount,
        degradedEvidenceArtifactCount,
        finalizedProofPackages,
      ] = await Promise.all([
        prisma.tenant.findMany({
          where: { id: { in: tenantIds } },
          select: { id: true, name: true, slug: true, isActive: true },
          orderBy: { name: "asc" },
        }),
        prisma.reconciliationRun.count({
          where: { tenantId: { in: tenantIds } },
        }),
        prisma.reconciliationRun.findFirst({
          where: { tenantId: { in: tenantIds } },
          select: { createdAt: true },
          orderBy: { createdAt: "desc" },
        }),
        prisma.reconciliationMatch.count({
          where: {
            tenantId: { in: tenantIds },
            matchType: { in: ["unmatched", "conflict"] },
            reviewed: false,
          },
        }),
        prisma.exceptionAdjudicationMemory.count({
          where: { tenantId: { in: tenantIds } },
        }),
        prisma.exceptionAdjudicationMemory.findFirst({
          where: { tenantId: { in: tenantIds } },
          select: { completedAt: true, createdAt: true },
          orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
        }),
        prisma.evidenceArtifact.count({
          where: { tenantId: { in: tenantIds } },
        }),
        prisma.evidenceArtifact.count({
          where: {
            tenantId: { in: tenantIds },
            degraded: true,
          },
        }),
        prisma.proofPackage.count({
          where: {
            tenantId: { in: tenantIds },
            status: "finalized",
          },
        }),
      ]);

      workspaceRows = workspaceEntities.map((workspace: (typeof workspaceEntities)[number]) => ({
        ...workspace,
        role: workspaceRoleMap.get(workspace.id) || "viewer",
      }));
      counts.workspaces = workspaceRows.length;
      counts.activeWorkspaces = workspaceRows.filter((workspace) => workspace.isActive).length;
      counts.reconciliationRuns = runCount;
      counts.unresolvedExceptions = unresolvedExceptions;
      counts.adjudicationMemories = adjudicationMemories;
      counts.evidenceArtifacts = evidenceArtifactCount;
      counts.degradedEvidenceArtifacts = degradedEvidenceArtifactCount;
      counts.finalizedProofPackages = finalizedProofPackages;
      lastRunAt = lastRun?.createdAt.toISOString() ?? null;
      lastDecisionAt =
        lastDecision?.completedAt?.toISOString() ?? lastDecision?.createdAt.toISOString() ?? null;
    } catch (error) {
      databaseAvailable = false;
      appLogger.error("[Console Activation] Failed to load database-backed overview", error);
    }
  } else {
    counts.activeWorkspaces = tenantIds.length;
  }

  const integrationCheck: ReadinessCheck =
    integrationError != null
      ? {
          id: "integration_readiness",
          label: "Integration readiness",
          state: "degraded",
          summary: "Connected integration status could not be verified.",
          detail: integrationError.message || "Integration status lookup failed.",
          href: "/console/onboarding",
          actionLabel: "Review onboarding",
        }
      : counts.connectedIntegrations > 0
        ? {
            id: "integration_readiness",
            label: "Integration readiness",
            state: "ready",
            summary: `${counts.connectedIntegrations} connected integration${counts.connectedIntegrations === 1 ? "" : "s"}.`,
            detail:
              "The workspace has at least one live data path for repeatable reconciliation work.",
            href: "/console/onboarding",
            actionLabel: "Review onboarding",
          }
        : counts.reconciliationRuns > 0
          ? {
              id: "integration_readiness",
              label: "Integration readiness",
              state: "degraded",
              summary: "Runs exist, but no live integration is connected.",
              detail:
                "Current value likely came from a manual upload, test fixture, or backfill. Connect a live source before calling the workflow production-ready.",
              href: "/console/onboarding",
              actionLabel: "Connect data",
            }
          : {
              id: "integration_readiness",
              label: "Integration readiness",
              state: "setup_required",
              summary: "No live data source is connected yet.",
              detail:
                "Connect a source system or use the onboarding upload path before expecting first-customer time-to-value.",
              href: "/console/onboarding",
              actionLabel: "Connect data",
            };

  const runCheck: ReadinessCheck = !databaseAvailable
    ? {
        id: "first_run",
        label: "First reconciliation run",
        state: "unavailable",
        summary: "Run history could not be loaded.",
        detail:
          "Database-backed run truth is unavailable, so Settler cannot prove whether first value has been reached.",
        href: "/console/setup-check",
        actionLabel: "Inspect diagnostics",
      }
    : counts.reconciliationRuns > 0
      ? {
          id: "first_run",
          label: "First reconciliation run",
          state: "ready",
          summary: `${counts.reconciliationRuns} reconciliation run${counts.reconciliationRuns === 1 ? "" : "s"} recorded.`,
          detail: "A serious customer can inspect completed run detail, not just a setup wizard.",
          href: "/console/runs",
          actionLabel: "Open runs",
        }
      : {
          id: "first_run",
          label: "First reconciliation run",
          state: tenantIds.length === 0 ? "setup_required" : "setup_required",
          summary: "No reconciliation runs have completed yet.",
          detail:
            "Time-to-value is still blocked until the first tenant-scoped run lands in the console.",
          href: "/console/runs",
          actionLabel: "Open runs",
        };

  const proofCheck: ReadinessCheck = !databaseAvailable
    ? {
        id: "proof_export",
        label: "Proof export readiness",
        state: "unavailable",
        summary: "Proof readiness could not be verified.",
        detail:
          "Settler cannot inspect proof packages or evidence artifacts while the database-backed console surfaces are unavailable.",
        href: "/console/proof-explorer",
        actionLabel: "Open proof explorer",
      }
    : counts.finalizedProofPackages > 0
      ? {
          id: "proof_export",
          label: "Proof export readiness",
          state: counts.degradedEvidenceArtifacts > 0 ? "degraded" : "ready",
          summary:
            counts.degradedEvidenceArtifacts > 0
              ? `${counts.finalizedProofPackages} finalized proof package${counts.finalizedProofPackages === 1 ? "" : "s"}, with degraded evidence still present.`
              : `${counts.finalizedProofPackages} finalized proof package${counts.finalizedProofPackages === 1 ? "" : "s"} ready to export.`,
          detail:
            counts.degradedEvidenceArtifacts > 0
              ? "Proof export is available, but at least one supporting artifact is explicitly marked degraded."
              : "Proof packages are available for buyer, auditor, or procurement review.",
          href: "/console/proof-explorer",
          actionLabel: "Open proof explorer",
        }
      : counts.evidenceArtifacts > 0 || counts.adjudicationMemories > 0
        ? {
            id: "proof_export",
            label: "Proof export readiness",
            state: "degraded",
            summary: "Evidence exists, but no finalized proof package is ready yet.",
            detail:
              "Operators have started building reusable evidence, but export-grade proof still needs to be finalized.",
            href: "/console/proof-explorer",
            actionLabel: "Review proof",
          }
        : {
            id: "proof_export",
            label: "Proof export readiness",
            state: "setup_required",
            summary: "No export-ready proof has been assembled yet.",
            detail:
              "Run reconciliations, record adjudications, and attach evidence before promising proof exports to a customer or buyer.",
            href: "/console/proof-explorer",
            actionLabel: "Open proof explorer",
          };

  const journeyChecks = [workspaceCheck, integrationCheck, runCheck, proofCheck];
  const allChecks = [...systemChecks, ...journeyChecks];

  const tasks: ConsoleActivationTask[] = [
    buildTask({
      id: "confirm_runtime",
      label: "Confirm runtime and workspace access",
      description:
        workspaceCheck.state === "ready"
          ? "Workspace membership and runtime prerequisites are in place."
          : workspaceCheck.detail,
      state: resolveReadinessState([...systemChecks, workspaceCheck]),
      href: workspaceCheck.href || "/console/setup-check",
      actionLabel: workspaceCheck.actionLabel || "Open diagnostics",
    }),
    buildTask({
      id: "connect_data",
      label: "Connect a repeatable data path",
      description: integrationCheck.detail,
      state: integrationCheck.state,
      href: integrationCheck.href || "/console/onboarding",
      actionLabel: integrationCheck.actionLabel || "Connect data",
    }),
    buildTask({
      id: "first_run",
      label: "Complete the first reconciliation run",
      description: runCheck.detail,
      state: runCheck.state,
      href: runCheck.href || "/console/runs",
      actionLabel: runCheck.actionLabel || "Open runs",
    }),
    buildTask({
      id: "first_exception_review",
      label: "Record the first durable exception decision",
      description:
        counts.adjudicationMemories > 0
          ? "Adjudication memory is already being captured and can be reused on future exceptions."
          : counts.unresolvedExceptions > 0
            ? "Exceptions exist, but the queue still depends on a first recorded operator decision."
            : "A recorded adjudication will appear once the first real exception is reviewed.",
      state:
        counts.adjudicationMemories > 0
          ? "ready"
          : counts.unresolvedExceptions > 0
            ? "degraded"
            : counts.reconciliationRuns > 0
              ? "setup_required"
              : "setup_required",
      href: "/console/exceptions",
      actionLabel: "Review exceptions",
    }),
    buildTask({
      id: "proof_export",
      label: "Export evidence for audit or procurement review",
      description: proofCheck.detail,
      state: proofCheck.state,
      href: proofCheck.href || "/console/proof-explorer",
      actionLabel: proofCheck.actionLabel || "Open proof explorer",
    }),
  ];

  return {
    generatedAt,
    overallState: resolveReadinessState(allChecks),
    authState: "authenticated",
    counts,
    workspaces: workspaceRows,
    systemChecks,
    journeyChecks,
    tasks,
    lastRunAt,
    lastDecisionAt,
  };
}
