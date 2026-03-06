import { NextRequest, NextResponse } from "next/server";
import { withSecurity } from "@/lib/middleware/api-security";
import {
  computeControlPlaneInsights,
  diagnoseFailure,
} from "@/lib/control-plane/failure-intelligence";

export const POST = withSecurity(async (request: NextRequest) => {
  let payload: {
    incidents?: Array<{
      error: string;
      scope?: "org" | "workspace" | "project" | "run" | "route" | "provider";
      route?: string;
      provider?: string;
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
        detail: "Expected JSON object with an incidents array.",
        code: "INVALID_JSON",
      },
      { status: 400, headers: { "content-type": "application/problem+json" } }
    );
  }

  const incidents = payload.incidents ?? [];
  const diagnoses = incidents
    .filter((incident) => Boolean(incident.error))
    .map((incident) => ({
      input: incident,
      diagnosis: diagnoseFailure({
        error: incident.error,
        scope: incident.scope,
        route: incident.route,
        provider: incident.provider,
      }),
    }));

  return NextResponse.json({
    diagnoses,
    insights: computeControlPlaneInsights(),
  });
});
