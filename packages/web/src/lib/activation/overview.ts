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

export interface ConsoleActivationOverview {
  generatedAt: string;
  overallState: ReadinessState;
  authState: "authenticated" | "unauthenticated";
  counts: ConsoleActivationCounts;
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
      return "First-customer workflow is materially in place";
    case "degraded":
      return "Value path is active, but still depends on explicit recovery steps";
    case "setup_required":
      return "Core onboarding steps are still blocking first value";
    default:
      return "Activation truth is unavailable until runtime issues are resolved";
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
