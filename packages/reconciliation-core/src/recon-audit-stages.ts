/**
 * Maps persisted recon audit rows to operator stage rows for run detail.
 */

export interface ReconAuditRow {
  id: string;
  audit_type: string | null;
  action: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export function toStageRows(audits: ReconAuditRow[]): Array<{
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  startedAt?: string;
  completedAt?: string;
  error?: string;
}> {
  return audits.map((audit) => {
    const auditType = audit.audit_type ?? "event";
    const action = (audit.action ?? "").toLowerCase();
    const metadata = audit.metadata ?? {};
    const error =
      typeof metadata.error === "string"
        ? metadata.error
        : typeof metadata.errorMessage === "string"
          ? metadata.errorMessage
          : undefined;

    let status: "pending" | "running" | "completed" | "failed" = "pending";
    if (auditType.includes("failed") || action === "failed" || Boolean(error)) {
      status = "failed";
    } else if (auditType.includes("start") || action === "start" || action === "execute") {
      status = "running";
    } else if (
      auditType.includes("completed") ||
      auditType.includes("approved") ||
      action === "complete" ||
      action === "completed"
    ) {
      status = "completed";
    }

    return {
      id: audit.id,
      name: auditType.replaceAll("_", " "),
      status,
      startedAt: status === "running" ? audit.created_at : undefined,
      completedAt: status === "completed" || status === "failed" ? audit.created_at : undefined,
      ...(error ? { error } : {}),
    };
  });
}
