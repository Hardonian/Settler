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
      return "completed";
    case "failed":
      return "failed";
    case "running":
      return "running";
    case "pending":
      return "pending";
    default:
      return "unknown";
  }
}
