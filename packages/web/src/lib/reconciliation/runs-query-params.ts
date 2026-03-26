import type { ReconciliationRunKindFilter } from "@settler/reconciliation-core";

export const RUN_KIND_VALUES: ReconciliationRunKindFilter[] = ["all", "recon_job", "ingestion_run"];

export function parseRunKindParam(
  value: string | null | undefined
): ReconciliationRunKindFilter | "__invalid__" {
  const normalized = (value ?? "all").trim().toLowerCase();
  if (RUN_KIND_VALUES.includes(normalized as ReconciliationRunKindFilter)) {
    return normalized as ReconciliationRunKindFilter;
  }
  return "__invalid__";
}

export function parseRunsLimit(raw: string | null | undefined): number {
  const n = Number(raw ?? 50);
  if (!Number.isFinite(n) || n < 1) return 50;
  return Math.min(Math.floor(n), 500);
}
