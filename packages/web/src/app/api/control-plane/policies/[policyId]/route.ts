import { NextRequest, NextResponse } from "next/server";
import { withSecurity } from "@/lib/middleware/api-security";
import { updatePolicy } from "@/lib/control-plane/state";

function problem(status: number, title: string, detail: string, code: string) {
  return NextResponse.json(
    {
      type: "https://settler.dev/problems/control-plane",
      title,
      status,
      detail,
      code,
    },
    { status, headers: { "content-type": "application/problem+json" } }
  );
}

export const PATCH = withSecurity(
  async (request: NextRequest, context: { params: Promise<{ policyId: string }> }) => {
    let payload: { enabled?: boolean };

    try {
      payload = (await request.json()) as { enabled?: boolean };
    } catch {
      return problem(
        400,
        "Invalid request body",
        "Expected JSON body with enabled boolean.",
        "INVALID_JSON"
      );
    }

    if (typeof payload.enabled !== "boolean") {
      return problem(400, "Validation failed", "enabled must be a boolean.", "VALIDATION_ERROR");
    }

    const { policyId } = await context.params;
    const policy = updatePolicy(policyId, payload.enabled);

    if (!policy) {
      return problem(
        404,
        "Policy not found",
        `No control-plane policy exists for id ${policyId}.`,
        "POLICY_NOT_FOUND"
      );
    }

    return NextResponse.json({ policy });
  },
  { requireAuth: true }
);
