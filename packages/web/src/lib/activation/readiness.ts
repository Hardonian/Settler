export type ReadinessState = "ready" | "degraded" | "setup_required" | "unavailable";

export type ActivationTaskState = "completed" | "current" | "blocked";

export interface ReadinessCheck {
  id: string;
  label: string;
  state: ReadinessState;
  summary: string;
  detail: string;
  href?: string;
  actionLabel?: string;
}

export interface ReadinessCounts {
  ready: number;
  degraded: number;
  setup_required: number;
  unavailable: number;
}

export const READINESS_LABELS: Record<ReadinessState, string> = {
  ready: "Ready",
  degraded: "Degraded",
  setup_required: "Setup required",
  unavailable: "Unavailable",
};

export function getReadinessPriority(state: ReadinessState): number {
  switch (state) {
    case "unavailable":
      return 3;
    case "setup_required":
      return 2;
    case "degraded":
      return 1;
    default:
      return 0;
  }
}

export function resolveReadinessState(
  checks: Array<Pick<ReadinessCheck, "state">> | undefined
): ReadinessState {
  if (!checks || checks.length === 0) {
    return "unavailable";
  }

  return checks.reduce<ReadinessState>((highest, check) => {
    return getReadinessPriority(check.state) > getReadinessPriority(highest)
      ? check.state
      : highest;
  }, "ready");
}

export function summarizeReadinessCounts(
  checks: Array<Pick<ReadinessCheck, "state">>
): ReadinessCounts {
  return checks.reduce<ReadinessCounts>(
    (counts, check) => {
      counts[check.state] += 1;
      return counts;
    },
    {
      ready: 0,
      degraded: 0,
      setup_required: 0,
      unavailable: 0,
    }
  );
}

export function readinessStateToBadgeStatus(
  state: ReadinessState
): "completed" | "degraded" | "warning" | "error" {
  switch (state) {
    case "ready":
      return "completed";
    case "degraded":
      return "degraded";
    case "setup_required":
      return "warning";
    default:
      return "error";
  }
}

export function readinessStateToTaskState(state: ReadinessState): ActivationTaskState {
  switch (state) {
    case "ready":
      return "completed";
    case "degraded":
    case "setup_required":
      return "current";
    default:
      return "blocked";
  }
}
