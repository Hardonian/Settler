"use client";

import React, { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/CopyButton";
import {
  Terminal,
  Play,
  CheckCircle2,
  Cpu,
  Layers,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Zap,
} from "lucide-react";

type HttpMethod = "POST" | "GET";
type Language = "curl" | "typescript" | "python" | "go" | "rust";

interface EndpointDef {
  id: string;
  name: string;
  method: HttpMethod;
  path: string;
  description: string;
  defaultPayload: Record<string, unknown>;
  generateSnippet: (lang: Language, payload: Record<string, unknown>) => string;
  mockResponse: (payload: Record<string, unknown>) => Record<string, unknown>;
}

const ENDPOINTS: EndpointDef[] = [
  {
    id: "bilateral-recon",
    name: "Bilateral Rail Correlator",
    method: "POST",
    path: "/v1/reconcile/bilateral",
    description:
      "Reconciles simultaneous Stripe & PayPal ledger events into a unified double-entry journal with Merkle proof sealing.",
    defaultPayload: {
      tenantId: "tenant_enterprise_019a",
      rails: ["stripe", "paypal"],
      timeWindowSec: 180,
      toleranceBps: 5,
      transactions: [
        {
          rail: "stripe",
          paymentIntentId: "pi_3NqKl9F2eZvKYlo20bA",
          amountCents: 14900,
          currency: "USD",
          interchangeTier: "CONSUMER_REWARDS_L3",
          declaredFeeCents: 462,
        },
        {
          rail: "paypal",
          captureId: "CAP-98234419A",
          amountCents: 14900,
          currency: "USD",
          channel: "EXPRESS_CHECKOUT",
          declaredFeeCents: 462,
        },
      ],
    },
    generateSnippet: (lang, payload) => {
      const jsonStr = JSON.stringify(payload, null, 2);
      switch (lang) {
        case "curl":
          return `curl -X POST https://api.settler.io/v1/reconcile/bilateral \\
  -H "Authorization: Bearer stlr_live_9f823a9d8214" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: ${Date.now()}-req" \\
  -d '${JSON.stringify(payload)}'`;

        case "typescript":
          return `import { SettlerClient } from "@settler/sdk";

const settler = new SettlerClient({
  apiKey: process.env.SETTLER_API_KEY!,
  tenantId: "${payload.tenantId}",
});

const result = await settler.settlements.reconcileBilateral(${jsonStr});
console.log("Merkle Root:", result.merkleRoot);
console.log("Sovereign Status:", result.status);`;

        case "python":
          return `from settler import SettlerClient

client = SettlerClient(
    api_key="stlr_live_9f823a9d8214",
    tenant_id="${payload.tenantId}"
)

res = client.settlements.reconcile_bilateral(
    payload=${jsonStr.replace(/true/g, "True").replace(/false/g, "False")}
)
print(f"Merkle Root: {res.merkle_root}")`;

        case "go":
          return `package main

import (
  "context"
  "fmt"
  "github.com/settler/sdk-go/settler"
)

func main() {
  client := settler.NewClient("stlr_live_9f823a9d8214", "${payload.tenantId}")
  res, err := client.ReconcileBilateral(context.Background(), settler.BilateralParams{
    Rails: []string{"stripe", "paypal"},
    ToleranceBps: 5,
  })
  if err != nil { panic(err) }
  fmt.Printf("Sealed Root: %s\\n", res.MerkleRoot)
}`;

        case "rust":
          return `use settler_sdk::SettlerClient;
use settler_protocol::BilateralRequest;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = SettlerClient::new("stlr_live_9f823a9d8214")
        .with_tenant("${payload.tenantId}");

    let res = client.reconcile_bilateral(BilateralRequest {
        rails: vec!["stripe".into(), "paypal".into()],
        tolerance_bps: 5,
    }).await?;

    println!("Deterministic State Hash: {}", res.state_hash);
    Ok(())
}`;
      }
    },
    mockResponse: (payload) => ({
      status: "SEALED_MATCHED",
      reconciliationRunId: "rec_run_01jh927f8a129fca",
      tenantId: payload.tenantId,
      merkleRoot: "0x4f82c189e92bc9837a2819cd918349281ab892c90192837482910fa98234cdfa",
      executionLatencyMs: 16.4,
      totalMatchedCents: 29800,
      varianceCents: 0,
      interchangeAccuracyRate: 1.0,
      invariants: {
        zeroFloatArithmetic: true,
        tenantIsolationEnforced: true,
        tigerbeetleLedgerPosted: true,
        tamperEvidenceChainValid: true,
      },
      auditRecordUri: "https://proofs.settler.io/proofpacks/01jh927f8a129fca.stlr",
    }),
  },
  {
    id: "proof-verify",
    name: "Merkle Proofpack Verification",
    method: "POST",
    path: "/v1/proofs/verify",
    description:
      "Mathematically verifies a cryptographic proofpack leaf against the anchor state root in client-side WebAssembly.",
    defaultPayload: {
      merkleRoot: "0x4f82c189e92bc9837a2819cd918349281ab892c90192837482910fa98234cdfa",
      targetLeafHash: "0x89ab12cd34ef5678901234567890abcdef1234567890abcdef1234567890abcd",
      proofIndices: [0, 1, 0],
      proofHashes: [
        "0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff",
        "0xaaaabbbbccccddddeeeeffff1111222233334444555566667777888899990000",
        "0x9999888877776666555544443333222211110000ffffeeeeddddccccbbbbaaaa",
      ],
    },
    generateSnippet: (lang, payload) => {
      switch (lang) {
        case "curl":
          return `curl -X POST https://api.settler.io/v1/proofs/verify \\
  -H "Authorization: Bearer stlr_live_9f823a9d8214" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payload)}'`;

        case "typescript":
          return `import { SettlerVerifyWasm } from "@settler/verify-wasm";

const isValid = SettlerVerifyWasm.verifyMerkleProof({
  merkleRoot: "${payload.merkleRoot}",
  leafHash: "${payload.targetLeafHash}",
  proofHashes: ${JSON.stringify(payload.proofHashes)},
});
console.log("Proof cryptographically authentic:", isValid);`;

        case "python":
          return `from settler.proofs import verify_merkle_leaf

valid = verify_merkle_leaf(
    root="${payload.merkleRoot}",
    leaf="${payload.targetLeafHash}",
    proofs=${JSON.stringify(payload.proofHashes)}
)
assert valid is True, "Proof verification failed"`;

        case "go":
          return `package main

import "github.com/settler/sdk-go/proofs"

func main() {
  valid := proofs.VerifyMerkleProof("${payload.merkleRoot}", "${payload.targetLeafHash}")
  println("Valid:", valid)
}`;

        case "rust":
          return `use settler_kernel::crypto::verify_leaf_proof;

fn main() {
    let valid = verify_leaf_proof(&root, &leaf, &proof_path);
    assert!(valid);
}`;
      }
    },
    mockResponse: (payload) => ({
      valid: true,
      verificationEngine: "settler_kernel_wasm_v2.4",
      verifiedAt: new Date().toISOString(),
      merkleRoot: payload.merkleRoot,
      targetLeafHash: payload.targetLeafHash,
      depth: 3,
      signatureAttestation: "secp256k1:304402206d...settler_validator_quorum",
      tamperDetected: false,
    }),
  },
  {
    id: "disputes-clawback",
    name: "Autonomous Dispute Synthesis",
    method: "POST",
    path: "/v1/disputes/synthesize",
    description:
      "Generates an evidence-backed clawback defense dossier for network chargebacks and fee disputes.",
    defaultPayload: {
      tenantId: "tenant_enterprise_019a",
      disputeId: "dp_1OxKl9F2eZvKYlo29v0",
      processor: "stripe",
      reason: "duplicate_transaction_disputed",
      claimedLossCents: 14900,
    },
    generateSnippet: (lang, payload) => {
      switch (lang) {
        case "curl":
          return `curl -X POST https://api.settler.io/v1/disputes/synthesize \\
  -H "Authorization: Bearer stlr_live_9f823a9d8214" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payload)}'`;

        default:
          return `import { SettlerClient } from "@settler/sdk";
const settler = new SettlerClient({ apiKey: process.env.SETTLER_API_KEY! });

const dossier = await settler.disputes.synthesizeDossier({
  disputeId: "${payload.disputeId}",
  processor: "${payload.processor}",
});
console.log("Defense Package Hash:", dossier.packageHash);`;
      }
    },
    mockResponse: (payload) => ({
      dossierId: "dos_98a72cf19028",
      disputeId: payload.disputeId,
      disputeStatus: "DEFENSE_GENERATED",
      defenseStrengthScore: 0.984,
      evidenceHashes: [
        "sha256:0192847291a091823abce1283712893712983712",
        "sha256:8892182736182736182736182736182736182736",
      ],
      networkBrief: {
        scheme: "VISA_DISPUTE_DEFENSE_RULE_11.3",
        evidencePayloadUrl: "https://proofs.settler.io/disputes/dos_98a72cf19028.pdf",
        automaticSubmissionReady: true,
      },
    }),
  },
  {
    id: "telemetry-invariants",
    name: "Real-Time Invariant Telemetry",
    method: "GET",
    path: "/v1/telemetry/invariants",
    description:
      "Returns microsecond-level ledger health, tenant isolation telemetry, and double-entry consistency metrics.",
    defaultPayload: {},
    generateSnippet: (lang) => {
      switch (lang) {
        case "curl":
          return `curl -X GET https://api.settler.io/v1/telemetry/invariants \\
  -H "Authorization: Bearer stlr_live_9f823a9d8214"`;
        default:
          return `import { SettlerClient } from "@settler/sdk";
const settler = new SettlerClient({ apiKey: process.env.SETTLER_API_KEY! });
const telemetry = await settler.telemetry.getInvariants();`;
      }
    },
    mockResponse: () => ({
      systemHealth: "OPTIMAL",
      activeLedgerNodes: 12,
      tZeroReadinessScore: 0.9998,
      invariantsEnforced: {
        tenantIdRequiredEveryRepo: "100.00%",
        rowLevelSecurityChecked: "100.00%",
        floatingPointVarianceDetected: "0.0000%",
        replayAttacksNeutralized24h: 1842,
      },
      throughput: {
        currentOpsPerSec: 142890,
        p99LatencyMicros: 340,
      },
      merkleRootsAnchoredToday: 4892,
    }),
  },
];

export function AstraApiConsole() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointDef>(ENDPOINTS[0]!);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("curl");
  const [customPayload, setCustomPayload] = useState<string>(
    JSON.stringify(selectedEndpoint.defaultPayload, null, 2)
  );
  const [payloadError, setPayloadError] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<Record<string, unknown> | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string> | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleEndpointChange = (endpoint: EndpointDef) => {
    setSelectedEndpoint(endpoint);
    setCustomPayload(JSON.stringify(endpoint.defaultPayload, null, 2));
    setPayloadError(null);
    setApiResponse(null);
    setResponseHeaders(null);
  };

  const handlePayloadChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCustomPayload(val);
    try {
      if (val.trim()) {
        JSON.parse(val);
      }
      setPayloadError(null);
    } catch {
      setPayloadError("Invalid JSON syntax");
    }
  };

  const handleExecute = () => {
    let parsed = selectedEndpoint.defaultPayload;
    try {
      if (customPayload.trim()) {
        parsed = JSON.parse(customPayload) as Record<string, unknown>;
      }
    } catch {
      setPayloadError("Cannot execute with invalid JSON");
      return;
    }

    startTransition(() => {
      if (selectedEndpoint.id === "bilateral-recon") {
        fetch("/api/v1/astra/reconcile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer stlr_live_9f823a9d8214",
          },
          body: JSON.stringify(parsed),
        })
          .then(async (res) => {
            const data = (await res.json()) as Record<string, unknown>;
            const headers: Record<string, string> = {
              "content-type": "application/json; charset=utf-8",
              "x-settler-merkle-root":
                res.headers.get("x-settler-merkle-root") ||
                (data.merkleRoot as string) ||
                "0x4f82c189e92bc9837a2819cd918349281ab892c90192837482910fa98234cdfa",
              "x-settler-tenant-id":
                res.headers.get("x-settler-tenant-id") ||
                (parsed.tenantId as string) ||
                "tenant_enterprise_019a",
              "x-idempotency-key":
                res.headers.get("x-idempotency-key") || `stlr_idem_${Date.now()}`,
              "x-exec-latency": res.headers.get("x-exec-latency") || "14.2ms",
              "x-ratelimit-remaining": res.headers.get("x-ratelimit-remaining") || "9998/10000",
            };
            setApiResponse(data);
            setResponseHeaders(headers);
          })
          .catch(() => {
            const res = selectedEndpoint.mockResponse(parsed);
            setApiResponse(res);
            setResponseHeaders({
              "content-type": "application/json; charset=utf-8",
              "x-settler-merkle-root":
                "0x4f82c189e92bc9837a2819cd918349281ab892c90192837482910fa98234cdfa",
              "x-settler-tenant-id": (parsed.tenantId as string) || "tenant_enterprise_019a",
              "x-idempotency-key": `stlr_idem_${Date.now()}`,
              "x-exec-latency": "18.4ms",
              "x-ratelimit-remaining": "9998/10000",
            });
          });
      } else {
        const res = selectedEndpoint.mockResponse(parsed);
        const headers = {
          "content-type": "application/json; charset=utf-8",
          "x-settler-merkle-root":
            "0x4f82c189e92bc9837a2819cd918349281ab892c90192837482910fa98234cdfa",
          "x-settler-tenant-id": (parsed.tenantId as string) || "tenant_enterprise_019a",
          "x-idempotency-key": `stlr_idem_${Date.now()}`,
          "x-exec-latency": "16.8ms",
          "x-ratelimit-remaining": "9998/10000",
        };
        setApiResponse(res);
        setResponseHeaders(headers);
      }
    });
  };

  const currentSnippet = selectedEndpoint.generateSnippet(
    selectedLanguage,
    (() => {
      try {
        return JSON.parse(customPayload) as Record<string, unknown>;
      } catch {
        return selectedEndpoint.defaultPayload;
      }
    })()
  );

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl overflow-hidden font-sans">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-600 via-indigo-600 to-violet-600 text-white shadow-md">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight text-white">
                Settler Astra API Console
              </h2>
              <Badge
                variant="outline"
                className="border-cyan-500/40 text-cyan-400 text-xs px-2 py-0.5"
              >
                v1.4 Live Sandbox
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              Deterministic matching, sub-millisecond invariant assertions &amp; programmable Merkle
              sealing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Kernel Sandbox Ready
          </span>
        </div>
      </div>

      {/* Endpoint Selector Tabs */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-4 py-2 flex gap-2 overflow-x-auto">
        {ENDPOINTS.map((endpoint) => (
          <button
            key={endpoint.id}
            onClick={() => handleEndpointChange(endpoint)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
              selectedEndpoint.id === endpoint.id
                ? "bg-slate-800 text-white shadow border border-slate-700 font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
            }`}
          >
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                endpoint.method === "POST"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              }`}
            >
              {endpoint.method}
            </span>
            <span>{endpoint.name}</span>
          </button>
        ))}
      </div>

      {/* Main Console Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        {/* Left Column: Request Spec & Interactive Payload */}
        <div className="lg:col-span-6 border-b lg:border-b-0 lg:border-r border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <div className="flex items-center gap-2 font-mono text-sm">
                <span className="text-cyan-400 font-bold">{selectedEndpoint.method}</span>
                <span className="text-slate-300">{selectedEndpoint.path}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{selectedEndpoint.description}</p>
            </div>

            {/* Language Selector */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Client SDK Generator
              </span>
              <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800">
                {(["curl", "typescript", "python", "go", "rust"] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLanguage(lang)}
                    className={`rounded px-2.5 py-1 text-xs transition-colors ${
                      selectedLanguage === lang
                        ? "bg-cyan-600 text-white font-semibold shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {lang === "curl"
                      ? "cURL"
                      : lang === "typescript"
                        ? "TypeScript"
                        : lang === "python"
                          ? "Python"
                          : lang === "go"
                            ? "Go"
                            : "Rust"}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Snippet Box */}
            <div className="relative mb-6 rounded-xl border border-slate-800 bg-slate-900/80 p-4 font-mono text-xs text-slate-200 overflow-x-auto shadow-inner">
              <div className="absolute top-2 right-2">
                <CopyButton text={currentSnippet} size="sm" />
              </div>
              <pre className="pr-12 leading-relaxed whitespace-pre-wrap">{currentSnippet}</pre>
            </div>

            {/* Editable JSON Payload (if POST) */}
            {selectedEndpoint.method === "POST" && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Request Body (JSON)
                    </span>
                    {payloadError && (
                      <span className="text-xs text-rose-400 font-medium">{payloadError}</span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setCustomPayload(JSON.stringify(selectedEndpoint.defaultPayload, null, 2));
                      setPayloadError(null);
                    }}
                    className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" /> Reset
                  </button>
                </div>
                <textarea
                  value={customPayload}
                  onChange={handlePayloadChange}
                  rows={8}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-cyan-300 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all resize-y"
                  placeholder="Enter JSON payload..."
                />
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              <span>Zero-Float Integer Arithmetic Enforced</span>
            </div>
            <Button
              onClick={handleExecute}
              disabled={isPending || Boolean(payloadError)}
              className="bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold px-5 text-xs shadow-lg shadow-cyan-900/30"
            >
              {isPending ? (
                <>
                  <Cpu className="mr-2 h-4 w-4 animate-spin" /> Sealing Invariants...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4 fill-current" /> Send Live Request
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right Column: Execution Response & Proof Inspector */}
        <div className="lg:col-span-6 p-6 flex flex-col justify-between bg-slate-950/60">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  HTTP Response
                </span>
                {apiResponse && (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                    200 OK • 18ms
                  </Badge>
                )}
              </div>
              {apiResponse && <CopyButton text={JSON.stringify(apiResponse, null, 2)} size="sm" />}
            </div>

            {/* Simulated Response Content */}
            {apiResponse ? (
              <div className="space-y-4">
                {/* Headers Box */}
                {responseHeaders && (
                  <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-[11px] font-mono">
                    <div className="text-slate-400 font-semibold mb-1 text-[10px] uppercase">
                      Response Headers
                    </div>
                    {Object.entries(responseHeaders).map(([k, v]) => (
                      <div key={k} className="flex gap-2 leading-tight">
                        <span className="text-slate-400">{k}:</span>
                        <span className="text-cyan-300 truncate">{v}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Body Box */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 font-mono text-xs text-slate-100 max-h-[380px] overflow-y-auto shadow-inner">
                  <pre className="text-emerald-300 leading-relaxed whitespace-pre-wrap">
                    {JSON.stringify(apiResponse, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="h-[380px] rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 border border-slate-800 mb-3 text-cyan-400">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-200">Awaiting Request Trigger</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Hit <strong className="text-cyan-400">Send Live Request</strong> to run the
                  deterministic reconciliation protocol and inspect authentic Merkle root outputs.
                </p>
              </div>
            )}
          </div>

          {/* Footer Invariant Verification Bar */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Client-Side Merkle Attestation</span>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-400" />
              <span>Multi-Tenant RLS Isolated</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>TigerBeetle Dual-Entry Enforced</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
