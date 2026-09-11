import { createHash } from "node:crypto";

export interface DeveloperReportPayload {
  platform: "discord" | "slack" | "github";
  channelId: string;
  senderId: string;
  messageContent: string;
  stackTrace?: string;
  schemaVersion?: string;
  tenantId?: string;
}

export interface TriageDiagnosis {
  reportId: string;
  isKnownIssue: boolean;
  category: "SCHEMA_VALIDATION" | "AUTH_FAILURE" | "RATE_LIMIT" | "RECON_DRIFT" | "UNKNOWN";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  recommendedAction: string;
  suggestedDocsUrl: string;
  autoResponseMarkdown: string;
  fingerprintSha256: string;
}

/**
 * Developer Community Triage Bot Engine (#40)
 * Validates developer bug reports and error payloads against schema versions and historical incident catalogs.
 */
export class DeveloperTriageBot {
  private static readonly SUPPORTED_SCHEMA_VERSIONS = new Set(["v1", "v1.4", "v2", "v2.4"]);

  public triage(payload: DeveloperReportPayload): TriageDiagnosis {
    const rawContent = `${payload.messageContent}\n${payload.stackTrace || ""}`;
    const hash = createHash("sha256").update(rawContent).digest("hex");
    const reportId = `TRIAGE-${hash.slice(0, 10).toUpperCase()}`;

    // Pattern 1: Tenant invariant violation
    if (/TenantId invariant violation|tenantId is required|Tenant mismatch/i.test(rawContent)) {
      return {
        reportId,
        isKnownIssue: true,
        category: "AUTH_FAILURE",
        severity: "HIGH",
        recommendedAction:
          "Ensure all API requests and repository calls supply a non-empty tenantId.",
        suggestedDocsUrl: "https://settler.dev/docs/invariants/tenant-isolation",
        autoResponseMarkdown: `🤖 **Settler Bot**: Detected a Tenant Invariant Exception. Settler enforces multi-tenant row-level isolation on 100% of endpoints. Please pass \`x-settler-tenant-id\` or provide \`tenantId\` in your JSON payload.`,
        fingerprintSha256: hash,
      };
    }

    // Pattern 2: Rate limit / token bucket exhaustion
    if (/Rate limit exceeded|429 Too Many Requests|token bucket exhausted/i.test(rawContent)) {
      return {
        reportId,
        isKnownIssue: true,
        category: "RATE_LIMIT",
        severity: "MEDIUM",
        recommendedAction:
          "Upgrade tenant throughput tier or implement exponential backoff with jitter.",
        suggestedDocsUrl: "https://settler.dev/docs/rate-limits",
        autoResponseMarkdown: `🤖 **Settler Bot**: You've hit your tier rate ceiling. Check your burst rate or subscribe to Webhooks to receive reconciliation events asynchronously.`,
        fingerprintSha256: hash,
      };
    }

    // Pattern 3: Schema version mismatch
    if (
      payload.schemaVersion &&
      !DeveloperTriageBot.SUPPORTED_SCHEMA_VERSIONS.has(payload.schemaVersion)
    ) {
      return {
        reportId,
        isKnownIssue: true,
        category: "SCHEMA_VALIDATION",
        severity: "HIGH",
        recommendedAction: `Update SDK or OpenAPI client to supported version: ${Array.from(DeveloperTriageBot.SUPPORTED_SCHEMA_VERSIONS).join(", ")}.`,
        suggestedDocsUrl: "https://settler.dev/docs/api/versions",
        autoResponseMarkdown: `🤖 **Settler Bot**: Schema version \`${payload.schemaVersion}\` is unsupported. Current LTS is \`v2.4\`.`,
        fingerprintSha256: hash,
      };
    }

    // Pattern 4: Floating point error in financial payload
    if (/float drift|fractional cents|non-integer/i.test(rawContent)) {
      return {
        reportId,
        isKnownIssue: true,
        category: "RECON_DRIFT",
        severity: "HIGH",
        recommendedAction: "Convert all monetary values to exact integer cents before posting.",
        suggestedDocsUrl: "https://settler.dev/docs/invariants/integer-cents",
        autoResponseMarkdown: `🤖 **Settler Bot**: Floating point amounts are rejected by design to guarantee deterministic double-entry accounting. Supply integer cents (e.g. \`1000\` for $10.00).`,
        fingerprintSha256: hash,
      };
    }

    return {
      reportId,
      isKnownIssue: false,
      category: "UNKNOWN",
      severity: "LOW",
      recommendedAction: "Escalated to Settler engineering on-call rotation.",
      suggestedDocsUrl: "https://settler.dev/docs/troubleshooting",
      autoResponseMarkdown: `🤖 **Settler Bot**: Thanks for the report! We have captured diagnostics under reference \`${reportId}\` and flagged it for our core engineers.`,
      fingerprintSha256: hash,
    };
  }
}
