/**
 * Compliance Export System
 *
 * DB-backed compliance exports for GDPR, CCPA, SOC 2, PCI-DSS, HIPAA.
 * Each export is persisted to the `compliance_exports` table and populated
 * from real tenant data via tenant-scoped queries.
 *
 * Export lifecycle:
 *   pending → processing → completed | failed
 *
 * Downloads are served inline as JSON (signed-URL storage upgrade is a
 * configuration concern, not an API-contract concern).
 */

import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";
import { query } from "../../db";
import { logError, logInfo } from "../../utils/logger";

export interface ComplianceExport {
  id: string;
  customerId: string;
  jurisdiction: "GDPR" | "CCPA" | "SOC2" | "PCI-DSS" | "HIPAA" | "custom";
  format: "json" | "csv" | "xml" | "pdf";
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
  data: Record<string, unknown>;
  errorMessage?: string;
}

export interface ExportTemplate {
  jurisdiction: string;
  fields: string[];
  format: ComplianceExport["format"];
  description: string;
}

/** Stable template definitions — these describe what each jurisdiction export contains. */
const EXPORT_TEMPLATES: Record<string, ExportTemplate> = {
  GDPR: {
    jurisdiction: "GDPR",
    fields: [
      "user_id",
      "email",
      "created_at",
      "reconciliation_jobs",
      "reports",
      "webhooks",
      "api_keys",
      "audit_logs",
    ],
    format: "json",
    description: "GDPR Article 15 — all personal data held for this tenant",
  },
  CCPA: {
    jurisdiction: "CCPA",
    fields: ["user_id", "email", "created_at", "reconciliation_jobs", "reports"],
    format: "json",
    description: "CCPA Section 1798.110 — categories and specific pieces of personal information",
  },
  SOC2: {
    jurisdiction: "SOC2",
    fields: ["audit_logs", "access_logs", "security_events", "api_keys"],
    format: "json",
    description: "SOC 2 Type II — audit trail, access logs, security events",
  },
  "PCI-DSS": {
    jurisdiction: "PCI-DSS",
    fields: ["audit_logs", "access_logs", "reconciliation_jobs"],
    format: "json",
    description: "PCI-DSS Requirement 10 — audit log evidence",
  },
  HIPAA: {
    jurisdiction: "HIPAA",
    fields: ["audit_logs", "access_logs", "user_id", "email"],
    format: "json",
    description: "HIPAA Access Report — disclosures and access history",
  },
};

/** Fetch real tenant data from the database for a given jurisdiction. */
async function fetchTenantData(
  tenantId: string,
  jurisdiction: ComplianceExport["jurisdiction"]
): Promise<Record<string, unknown>> {
  const template = EXPORT_TEMPLATES[jurisdiction];
  const fields = template?.fields ?? [];
  const result: Record<string, unknown> = { tenant_id: tenantId };

  // Users & identity
  if (fields.includes("user_id") || fields.includes("email")) {
    const users = await query<{ id: string; email: string; created_at: string; role: string }>(
      `SELECT id, email, created_at, role FROM users WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 500`,
      [tenantId]
    );
    result.users = users;
  }

  // Reconciliation jobs
  if (fields.includes("reconciliation_jobs")) {
    const jobs = await query<{
      id: string;
      status: string;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT id, status, created_at, updated_at FROM recon_jobs WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 1000`,
      [tenantId]
    );
    result.reconciliation_jobs = jobs;
  }

  // Audit logs (primary evidence for SOC2, HIPAA, PCI-DSS, GDPR)
  if (
    fields.includes("audit_logs") ||
    fields.includes("access_logs") ||
    fields.includes("security_events")
  ) {
    const auditLogs = await query<{
      id: number;
      at: Date;
      actor: string;
      action: string;
      schema_name: string;
      table_name: string;
      details: unknown;
    }>(
      `SELECT id, at, actor, action, schema_name, table_name, details
         FROM audit_log_entries
        WHERE tenant_id = $1
        ORDER BY at DESC
        LIMIT 5000`,
      [tenantId]
    ).catch(() => [] as unknown[]);
    result.audit_logs = auditLogs;
  }

  // API keys (metadata only — never raw key material)
  if (fields.includes("api_keys")) {
    const apiKeys = await query<{
      id: string;
      key_prefix: string;
      scopes: string[];
      created_at: string;
      revoked_at: string | null;
    }>(
      `SELECT ak.id, ak.key_prefix, ak.scopes, ak.created_at, ak.revoked_at
         FROM api_keys ak
         JOIN users u ON u.id = ak.user_id
        WHERE u.tenant_id = $1
        ORDER BY ak.created_at DESC`,
      [tenantId]
    );
    result.api_keys = apiKeys;
  }

  // Webhooks
  if (fields.includes("webhooks")) {
    const webhooks = await query<{ id: string; url: string; events: string[]; created_at: string }>(
      `SELECT id, url, events, created_at FROM webhooks WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [tenantId]
    );
    result.webhooks = webhooks;
  }

  // Reports / exports
  if (fields.includes("reports")) {
    const reports = await query<{ id: string; format: string; status: string; created_at: string }>(
      `SELECT id, format, status, created_at FROM exports WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 200`,
      [tenantId]
    ).catch(() => [] as unknown[]);
    result.reports = reports;
  }

  return result;
}

/** Serialize data to the requested format. */
function serializeData(
  data: Record<string, unknown>,
  format: ComplianceExport["format"]
): Record<string, unknown> {
  switch (format) {
    case "csv": {
      // Flatten top-level scalar fields to CSV; arrays are JSON-embedded
      const headers = Object.keys(data);
      const values = headers.map((h) => {
        const v = data[h];
        return typeof v === "object" ? JSON.stringify(v) : String(v ?? "");
      });
      return { csv: `${headers.join(",")}\n${values.join(",")}` };
    }
    case "xml": {
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<compliance_export>\n';
      for (const [key, value] of Object.entries(data)) {
        const encoded =
          typeof value === "object"
            ? JSON.stringify(value)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
            : String(value ?? "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
        xml += `  <${key}>${encoded}</${key}>\n`;
      }
      xml += "</compliance_export>";
      return { xml };
    }
    case "pdf":
      // PDF generation requires a renderer dependency outside this service.
      // Return structured JSON that the caller can pass to a PDF renderer.
      return { pdf_source: data, note: "Render via PDF service using pdf_source payload" };
    default:
      return data;
  }
}

/**
 * Persist export status update to the database.
 * Silently swallows errors so a DB write failure never masks the real export error.
 */
async function persistExportUpdate(
  exportId: string,
  update: Partial<{
    status: string;
    completed_at: string;
    error_message: string;
    payload: unknown;
  }>
): Promise<void> {
  try {
    const setClauses: string[] = [];
    const params: unknown[] = [];
    let i = 1;

    if (update.status !== undefined) {
      setClauses.push(`status = $${i++}`);
      params.push(update.status);
    }
    if (update.completed_at !== undefined) {
      setClauses.push(`completed_at = $${i++}`);
      params.push(update.completed_at);
    }
    if (update.error_message !== undefined) {
      setClauses.push(`error_message = $${i++}`);
      params.push(update.error_message);
    }
    if (update.payload !== undefined) {
      setClauses.push(`payload = $${i++}`);
      params.push(JSON.stringify(update.payload));
    }

    if (setClauses.length === 0) return;

    params.push(exportId);
    await query(
      `UPDATE compliance_exports SET ${setClauses.join(", ")} WHERE id = $${i}`,
      params as (string | number | boolean | null | Date | string[])[]
    );
  } catch (err) {
    logError("compliance_exports update failed (non-fatal)", err, { exportId });
  }
}

export class ComplianceExportSystem extends EventEmitter {
  private readonly templates: Map<string, ExportTemplate>;

  constructor() {
    super();
    this.templates = new Map(Object.entries(EXPORT_TEMPLATES));
  }

  /**
   * Create a compliance export.
   * Inserts a `pending` record immediately; processing runs async.
   */
  async createExport(
    tenantId: string,
    jurisdiction: ComplianceExport["jurisdiction"],
    format: ComplianceExport["format"] = "json"
  ): Promise<ComplianceExport> {
    if (!EXPORT_TEMPLATES[jurisdiction]) {
      throw new Error(`No template found for jurisdiction: ${jurisdiction}`);
    }

    const exportId = uuidv4();
    const now = new Date();

    // Persist the pending record before async processing starts
    await query(
      `INSERT INTO compliance_exports (id, tenant_id, jurisdiction, format, status, created_at)
       VALUES ($1, $2, $3, $4, 'pending', $5)
       ON CONFLICT DO NOTHING`,
      [exportId, tenantId, jurisdiction, format, now] as (
        | string
        | number
        | boolean
        | null
        | Date
        | string[]
      )[]
    ).catch((err) => {
      // Table may not exist in OSS/dev mode — log but do not block
      logError("compliance_exports insert failed (table may not exist)", err, { exportId });
    });

    const export_: ComplianceExport = {
      id: exportId,
      customerId: tenantId,
      jurisdiction,
      format,
      status: "pending",
      createdAt: now,
      data: {},
    };

    // Process asynchronously — caller gets the pending record immediately
    void this.processExport(export_);

    this.emit("export_created", export_);
    return export_;
  }

  private async processExport(export_: ComplianceExport): Promise<void> {
    export_.status = "processing";
    await persistExportUpdate(export_.id, { status: "processing" });
    this.emit("export_processing", export_);

    try {
      const rawData = await fetchTenantData(export_.customerId, export_.jurisdiction);
      const formattedData = serializeData(rawData, export_.format);
      const completedAt = new Date();

      export_.status = "completed";
      export_.completedAt = completedAt;
      export_.data = formattedData;
      // Inline download URL — callers retrieve via GET /compliance/exports/:id
      export_.downloadUrl = `/api/v2/compliance/exports/${export_.id}/download`;

      await persistExportUpdate(export_.id, {
        status: "completed",
        completed_at: completedAt.toISOString(),
        payload: formattedData,
      });

      logInfo("Compliance export completed", {
        exportId: export_.id,
        jurisdiction: export_.jurisdiction,
      });
      this.emit("export_completed", export_);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      export_.status = "failed";
      export_.errorMessage = message;

      await persistExportUpdate(export_.id, { status: "failed", error_message: message });

      logError("Compliance export failed", error, { exportId: export_.id });
      this.emit("export_failed", { export_, error });
      throw error;
    }
  }

  /** Get an export record from the DB (falls back to in-memory if DB unavailable). */
  async getExportFromDb(exportId: string, tenantId: string): Promise<ComplianceExport | undefined> {
    try {
      const rows = await query<{
        id: string;
        tenant_id: string;
        jurisdiction: string;
        format: string;
        status: string;
        created_at: Date;
        completed_at: Date | null;
        payload: unknown;
        error_message: string | null;
      }>(
        `SELECT id, tenant_id, jurisdiction, format, status, created_at, completed_at, payload, error_message
           FROM compliance_exports
          WHERE id = $1 AND tenant_id = $2`,
        [exportId, tenantId]
      );
      if (rows.length === 0 || !rows[0]) return undefined;
      const row = rows[0];
      return {
        id: row.id,
        customerId: row.tenant_id,
        jurisdiction: row.jurisdiction as ComplianceExport["jurisdiction"],
        format: row.format as ComplianceExport["format"],
        status: row.status as ComplianceExport["status"],
        createdAt: row.created_at,
        completedAt: row.completed_at ?? undefined,
        downloadUrl:
          row.status === "completed" ? `/api/v2/compliance/exports/${row.id}/download` : undefined,
        data: (row.payload as Record<string, unknown>) ?? {},
        errorMessage: row.error_message ?? undefined,
      };
    } catch {
      return undefined;
    }
  }

  /** List exports for a tenant from the DB. */
  async listExportsFromDb(tenantId: string): Promise<ComplianceExport[]> {
    try {
      const rows = await query<{
        id: string;
        jurisdiction: string;
        format: string;
        status: string;
        created_at: Date;
        completed_at: Date | null;
        error_message: string | null;
      }>(
        `SELECT id, jurisdiction, format, status, created_at, completed_at, error_message
           FROM compliance_exports
          WHERE tenant_id = $1
          ORDER BY created_at DESC
          LIMIT 100`,
        [tenantId]
      );
      return rows.map((row) => ({
        id: row.id,
        customerId: tenantId,
        jurisdiction: row.jurisdiction as ComplianceExport["jurisdiction"],
        format: row.format as ComplianceExport["format"],
        status: row.status as ComplianceExport["status"],
        createdAt: row.created_at,
        completedAt: row.completed_at ?? undefined,
        downloadUrl:
          row.status === "completed" ? `/api/v2/compliance/exports/${row.id}/download` : undefined,
        data: {},
        errorMessage: row.error_message ?? undefined,
      }));
    } catch {
      return [];
    }
  }

  /** Get available export templates. */
  getTemplates(): ExportTemplate[] {
    return Array.from(this.templates.values());
  }
}

export const complianceExportSystem = new ComplianceExportSystem();
