import {
  READINESS_LABELS,
  type ActivationTaskState,
  type ReadinessCheck,
  type ReadinessState,
  summarizeReadinessCounts,
} from "@/lib/activation/readiness";

type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  role: string;
  isActive: boolean;
};

export interface ConsoleActivationCounts {
  workspaces: number;
  activeWorkspaces: number;
  connectedIntegrations: number;
  reconciliationRuns: number;
  unresolvedExceptions: number;
  adjudicationMemories: number;
  evidenceArtifacts: number;
  degradedEvidenceArtifacts: number;
  finalizedProofPackages: number;
}

export interface ConsoleActivationTask {
  id: string;
  label: string;
  description: string;
  state: ActivationTaskState;
  href: string;
  actionLabel: string;
}

export type ActivationMilestoneId =
  | "workspace_created"
  | "source_connected"
  | "first_run_completed"
  | "first_exception_reviewed"
  | "first_proof_finalized"
  | "first_schedule_configured";

export interface ActivationMilestone {
  id: ActivationMilestoneId;
  label: string;
  achieved: boolean;
  achievedAt: string | null;
  /** Short sentence citing what in the database backs this milestone. */
  evidenceSummary: string;
}

export interface ConsoleActivationOverview {
  generatedAt: string;
  overallState: ReadinessState;
  authState: "authenticated" | "unauthenticated";
  counts: ConsoleActivationCounts;
  milestones: ActivationMilestone[];
  workspaces: WorkspaceSummary[];
  systemChecks: ReadinessCheck[];
  journeyChecks: ReadinessCheck[];
  tasks: ConsoleActivationTask[];
  supportBundle: {
    generatedAt: string;
    summary: string;
    blockers: Array<{
      id: string;
      label: string;
      state: ReadinessState;
      summary: string;
      detail: string;
      actionLabel: string;
      href: string;
    }>;
    recommendedNextActions: string[];
  };
  lastRunAt: string | null;
  lastDecisionAt: string | null;
}

export function formatActivationTimestamp(value: string | null): string {
  if (!value) {
    return "Not recorded";
  }

  return new Date(value).toLocaleString();
}

export function getActivationHeadline(overview: ConsoleActivationOverview): string {
  switch (overview.overallState) {
    case "ready":
      return "Operational readiness achieved: workflow is materially in place";
    case "degraded":
      return "Operational friction detected: system depends on explicit recovery";
    case "setup_required":
      return "Activation required: core onboarding steps are blocking first value";
    default:
      return "Activation truth unavailable: resolve runtime issues to resume monitoring";
  }
}

export function getActivationSummary(overview: ConsoleActivationOverview): string {
  const counts = summarizeReadinessCounts([...overview.systemChecks, ...overview.journeyChecks]);
  const blockers = counts.setup_required + counts.unavailable;
  if (blockers === 0) {
    return `All ${overview.systemChecks.length + overview.journeyChecks.length} activation checks are ${READINESS_LABELS.ready.toLowerCase()} or explicitly degraded.`;
  }

  return `${blockers} activation check${blockers === 1 ? "" : "s"} still need operator attention before Settler can be treated as production-ready for a first customer.`;
}
