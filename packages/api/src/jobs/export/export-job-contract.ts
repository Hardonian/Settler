export type ExportJobType = "export" | "reconciliation-export" | "csv-export" | "pdf-report";

export interface ExportJobPayload {
  type: ExportJobType;
  runId?: string;
  jobId?: string;
  format?: "csv" | "json" | "pdf" | "xlsx";
  options?: Record<string, unknown>;
  tenantId: string;
  userId: string;
}

export interface ExportJobExecutionResult {
  success: true;
  runId: string;
  format: "csv" | "json" | "pdf" | "xlsx";
  exportedAt: string;
  rowCount: number;
  fileSizeBytes?: number | null;
  storageLocation?: string | null;
  signedUrl?: string | null;
  signedUrlExpiresAt?: string | null;
  metadata?: Record<string, unknown>;
}
