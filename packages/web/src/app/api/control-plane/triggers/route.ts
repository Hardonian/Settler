import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { withSecurity } from "@/lib/middleware/api-security";
import { computeControlPlaneInsights } from "@/lib/control-plane/failure-intelligence";

interface TriggerRequest {
  triggerType: "run_diagnostics" | "open_setup_checklist";
  sourceInsightId?: string;
}

export const POST = withSecurity(async (request: NextRequest) => {
  let payload: TriggerRequest;

  try {
    payload = (await request.json()) as TriggerRequest;
  } catch {
    return NextResponse.json(
      {
        type: "https://settler.dev/problems/triggers",
        title: "Invalid JSON payload",
        status: 400,
        detail: "Expected triggerType in JSON body.",
        code: "INVALID_JSON",
      },
      { status: 400, headers: { "content-type": "application/problem+json" } }
    );
  }

  if (!payload.triggerType) {
    return NextResponse.json(
      {
        type: "https://settler.dev/problems/triggers",
        title: "Validation failed",
        status: 400,
        detail: "triggerType is required.",
        code: "VALIDATION_ERROR",
      },
      { status: 400, headers: { "content-type": "application/problem+json" } }
    );
  }

  const triggerId = `trg_${randomUUID()}`;

  if (payload.triggerType === "run_diagnostics") {
    return NextResponse.json({
      triggerId,
      status: "completed",
      triggerType: payload.triggerType,
      sourceInsightId: payload.sourceInsightId ?? null,
      result: {
        insights: computeControlPlaneInsights(),
        executedAt: new Date().toISOString(),
      },
      audit: {
        action: "manual_trigger_executed",
        reason: "Operator requested control-plane diagnostics refresh.",
      },
    });
  }

  return NextResponse.json({
    triggerId,
    status: "completed",
    triggerType: payload.triggerType,
    sourceInsightId: payload.sourceInsightId ?? null,
    result: {
      destination: "/console/setup-check",
      executedAt: new Date().toISOString(),
    },
    audit: {
      action: "manual_trigger_executed",
      reason: "Operator requested setup checklist navigation.",
    },
  });
});
