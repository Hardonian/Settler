import { NextRequest, NextResponse } from "next/server";
import { withSecurity } from "@/lib/middleware/api-security";
import {
  clusterFailures,
  computeFailureDashboardMetrics,
  getFailure,
  listFailures,
  operatorGuidance,
  recordFailure,
  remediateFailure,
} from "@/lib/control-plane/failure-intelligence";

export const GET = withSecurity(async (request: NextRequest) => {
  const search = request.nextUrl.searchParams;
  const tenantId = search.get("tenant_id") ?? undefined;
  const failureId = search.get("failure_id");
  const view = search.get("view") ?? "list";

  if (view === "clusters") {
    return NextResponse.json({ clusters: clusterFailures(tenantId) });
  }

  if (view === "trends") {
    return NextResponse.json({ metrics: computeFailureDashboardMetrics(tenantId) });
  }

  if (failureId) {
    const failure = getFailure(failureId, tenantId);
    if (!failure) {
      return NextResponse.json(
        {
          type: "https://settler.dev/problems/failure-intelligence",
          title: "Failure not found",
          status: 404,
          detail: "Requested failure record was not found or is outside tenant scope.",
          code: "FAILURE_NOT_FOUND",
        },
        { status: 404, headers: { "content-type": "application/problem+json" } }
      );
    }

    return NextResponse.json({ failure, guidance: operatorGuidance(failure) });
  }

  return NextResponse.json({ failures: listFailures(tenantId) });
});

export const POST = withSecurity(async (request: NextRequest) => {
  let payload: {
    action?: "record" | "remediate";
    failure_id?: string;
    triggered_by?: "auto" | "operator" | "policy";
    idempotency_key_present?: boolean;
    tenant_id?: string;
    incidents?: Array<{
      trace_id: string;
      execution_id?: string;
      tenant_id?: string;
      component: string;
      operation: string;
      route_or_command?: string;
      deployment_version?: string;
      policy_version?: string;
      dependency?: string;
      error: string;
      machine_details?: Record<string, unknown>;
      linked_logs?: string[];
      linked_execution_receipt?: string;
      linked_replay_bundle?: string;
    }>;
  };

  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return NextResponse.json(
      {
        type: "https://settler.dev/problems/failure-intelligence",
        title: "Invalid JSON payload",
        status: 400,
        detail: "Expected JSON object for failure actions.",
        code: "INVALID_JSON",
      },
      { status: 400, headers: { "content-type": "application/problem+json" } }
    );
  }

  const action = payload.action ?? "record";

  if (action === "remediate") {
    if (!payload.failure_id) {
      return NextResponse.json(
        {
          type: "https://settler.dev/problems/failure-intelligence",
          title: "Missing failure_id",
          status: 400,
          detail: "failure_id is required for remediation.",
          code: "MISSING_FAILURE_ID",
        },
        { status: 400, headers: { "content-type": "application/problem+json" } }
      );
    }

    const attempt = remediateFailure(payload.failure_id, {
      triggeredBy: payload.triggered_by ?? "operator",
      tenantId: payload.tenant_id,
      idempotencyKeyPresent: payload.idempotency_key_present,
    });

    if (!attempt) {
      return NextResponse.json(
        {
          type: "https://settler.dev/problems/failure-intelligence",
          title: "Failure not found",
          status: 404,
          detail: "Cannot remediate unknown failure id.",
          code: "FAILURE_NOT_FOUND",
        },
        { status: 404, headers: { "content-type": "application/problem+json" } }
      );
    }

    return NextResponse.json({ attempt });
  }

  const incidents = payload.incidents ?? [];
  const recorded = incidents.map((incident) =>
    recordFailure({
      traceId: incident.trace_id,
      executionId: incident.execution_id,
      tenantId: incident.tenant_id,
      component: incident.component,
      operation: incident.operation,
      routeOrCommand: incident.route_or_command,
      deploymentVersion: incident.deployment_version,
      policyVersion: incident.policy_version,
      dependency: incident.dependency,
      error: incident.error,
      machineDetails: incident.machine_details,
      linkedLogs: incident.linked_logs,
      linkedExecutionReceipt: incident.linked_execution_receipt,
      linkedReplayBundle: incident.linked_replay_bundle,
    })
  );

  return NextResponse.json({ failures: recorded });
});
