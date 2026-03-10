import {
  ERROR_CATEGORY,
  ERROR_SEVERITY,
  buildErrorObservabilityMetadata,
  createErrorSignature,
} from "../../services/observability/error-taxonomy";
import { supportIntakeSubmissionSchema } from "../../services/support/support-intake-contract";
import { USAGE_EVENT_NAME, usageEventSchema } from "../../services/usage/usage-metering-contract";
import { resolveCanonicalUsageEventName } from "../../services/usage/metering";
import { DatabaseUsageMeterProvider } from "../../services/usage/usage-meter-provider-db";

describe("operator foundations contracts", () => {
  it("creates a stable error signature", () => {
    expect(
      createErrorSignature({
        errorName: "Validation Error",
        route: "POST /v1/reconciliation/run",
        module: "services/reconciliation/runner",
      })
    ).toBe("ValidationError|POST /v1/reconciliation/run|services/reconciliation/runner");
  });

  it("builds required observability metadata", () => {
    const metadata = buildErrorObservabilityMetadata({
      tenant_id: "tenant_a",
      run_id: "run_1",
      route: "POST /v1/reconciliation/run",
      module: "services/reconciliation/runner",
      category: ERROR_CATEGORY.VALIDATION,
      severity: ERROR_SEVERITY.SEV2,
      retryable: false,
      errorName: "ValidationError",
    });

    expect(metadata.tenant_id).toBe("tenant_a");
    expect(metadata.retryable).toBe(false);
    expect(metadata.error_signature).toContain("ValidationError|");
  });

  it("validates support intake payload", () => {
    const parsed = supportIntakeSubmissionSchema.parse({
      tenant_id: "tenant_a",
      run_id: "run_1",
      category: "run_failure",
      description: "Reconciliation run fails after upload validation in production env.",
      route: "POST /v1/reconciliation/run",
      module: "services/reconciliation/runner",
      contact: { email: "operator@example.com" },
    });

    expect(parsed.category).toBe("run_failure");
  });

  it("maps legacy metric types to canonical usage events", () => {
    expect(resolveCanonicalUsageEventName("reconciliations")).toBe("runs_executed");
    expect(resolveCanonicalUsageEventName("exports")).toBe("imports_processed");
    expect(resolveCanonicalUsageEventName("unknown_metric")).toBeNull();
  });

  it("exposes provider capability state for DB usage meter", () => {
    expect(new DatabaseUsageMeterProvider(true).status).toBe("configured");
    expect(new DatabaseUsageMeterProvider(false).status).toBe("unavailable");
  });

  it("validates usage metering payload", () => {
    const parsed = usageEventSchema.parse({
      tenant_id: "tenant_a",
      run_id: "run_1",
      event_name: USAGE_EVENT_NAME.RUNS_EXECUTED,
      quantity: 1,
      occurred_at: new Date().toISOString(),
      metadata: { route: "POST /v1/reconciliation/run" },
    });

    expect(parsed.event_name).toBe("runs_executed");
  });
});
