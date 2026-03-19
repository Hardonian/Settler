export interface RunSummary {
  totalItems: number;
  matched: number;
  missing: number;
  drift: number;
  mismatched: number;
}

export interface Run {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed" | "unknown";
  statusLabel?: string;
  startedAt: string;
  completedAt: string | null;
  summary?: RunSummary;
  summaryState?: "success" | "review_needed" | "in_progress" | "failed" | "empty" | "unknown";
  progress?: number;
  progressState?: "not_started" | "in_progress" | "completed" | "failed" | "unknown";
  isTerminal?: boolean;
}
