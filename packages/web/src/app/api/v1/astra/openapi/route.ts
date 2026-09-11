import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    openapi: "3.1.0",
    info: {
      title: "Settler Astra Programmable Settlement & Reconciliation API",
      version: "1.4.0",
      description:
        "The sovereign, developer-first reconciliation operating system. Bridges multi-rail transaction streams (Stripe, PayPal, Chase BAI2, ISO 20022 CAMT.053) into deterministic double-entry journals with RFC 6962 SHA-256 Merkle root sealing.",
      license: {
        name: "Apache-2.0 / MIT Open Core",
        url: "https://github.com/Hardonian/Settler/blob/main/LICENSE",
      },
    },
    servers: [
      {
        url: "https://api.settler.io",
        description: "Production Global Anycast Cluster",
      },
      {
        url: "http://localhost:3000",
        description: "Local Astra Development Sandbox",
      },
    ],
    paths: {
      "/api/v1/astra/reconcile": {
        post: {
          summary: "Bilateral Multi-Rail Reconciliation",
          description:
            "Reconciles concurrent Stripe and PayPal transaction events into a balanced double-entry journal with Merkle root attestation.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["tenantId", "transactions"],
                  properties: {
                    tenantId: { type: "string", example: "tenant_enterprise_019a" },
                    rails: {
                      type: "array",
                      items: { type: "string" },
                      example: ["stripe", "paypal"],
                    },
                    toleranceBps: { type: "integer", default: 5, example: 5 },
                    transactions: { type: "array", items: { type: "object" } },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Reconciliation run sealed and balanced." },
            "400": { description: "TenantId or invariant violation." },
          },
        },
      },
      "/api/v1/astra/proofs/verify": {
        post: {
          summary: "Client-Side Merkle Proof Verification",
          description: "Mathematically verifies a leaf hash against an anchor state root hash.",
        },
      },
      "/api/v1/astra/disputes/synthesize": {
        post: {
          summary: "Autonomous Dispute Dossier Synthesis",
          description: "Generates an evidence-backed clawback dossier for card scheme disputes.",
        },
      },
      "/api/v1/astra/cadence/provision": {
        post: {
          summary: "Provision Self-Healing Ingest Cadence",
          description: "Schedules automated cron jobs for continuous multi-rail reconciliation.",
        },
      },
      "/api/v1/astra/telemetry/invariants": {
        get: {
          summary: "Real-Time Invariant Health Telemetry",
          description: "Returns sub-millisecond invariant assertions, RLS status, and throughput.",
        },
      },
    },
  });
}
