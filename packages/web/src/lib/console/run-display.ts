import type { StatusType } from "@/components/ui/status-badge";

/**
 * Maps a reconciliation run's persisted `status` string to StatusBadge semantics.
 * Unknown values map to "unknown" so operators still see the raw label from the API.
 */
export function reconciliationRunStatusToBadgeType(status: string | null | undefined): StatusType {
  if (!status) {
    return "unknown";
  }
  const normalized = status.trim().toLowerCase();
  switch (normalized) {
    case "completed":
    case "success":
      return "completed";
    case "failed":
    case "error":
      return "failed";
    case "running":
    case "processing":
    case "in_progress":
      return "running";
    case "pending":
    case "queued":
    case "draft":
      return "pending";
    default:
      return "unknown";
  }
}
