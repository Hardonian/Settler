import { NextResponse } from "next/server";

const openapi = {
  openapi: "3.1.0",
  info: { title: "Settler API", version: "1.0.0" },
  paths: {
    "/api/v1/runs": { post: { summary: "Create run" } },
    "/api/v1/runs/{id}": { get: { summary: "Get run" } },
    "/api/v1/runs/{id}/results": { get: { summary: "Get results" } },
    "/api/v1/runs/{id}/evidence": { get: { summary: "Get evidence" } },
    "/api/v1/runs/{id}/replay": { post: { summary: "Replay run" } },
    "/api/v1/runs/{id}/trust-explorer/getExecutionGraph": {
      get: { summary: "Get execution trust graph" },
    },
    "/api/v1/runs/{id}/trust-explorer/traceArtifactLineage": {
      get: { summary: "Trace artifact lineage" },
    },
    "/api/v1/runs/{id}/trust-explorer/verifyProofChain": { get: { summary: "Verify proof chain" } },
    "/api/v1/runs/{id}/trust-explorer/findPolicyImpact": { get: { summary: "Find policy impact" } },
    "/api/v1/datasets": { get: { summary: "List datasets" }, post: { summary: "Create dataset" } },
    "/api/v1/health": { get: { summary: "Liveness" } },
    "/api/v1/ready": { get: { summary: "Readiness" } },
    "/api/v1/meta": { get: { summary: "Meta" } },
  },
  components: {
    securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "X-API-Key" } },
    headers: {
      "X-Request-Id": { schema: { type: "string" } },
      "X-RateLimit-Remaining": { schema: { type: "integer" } },
    },
  },
};

export function GET() {
  return NextResponse.json(openapi);
}
