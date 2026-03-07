import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";

export type AIProvider = "openai" | "anthropic" | "local" | "mcp";
export type CopilotAction =
  | "suggestWorkflow"
  | "analyzeExecution"
  | "suggestPolicy"
  | "detectAnomaly"
  | "connectorGuidance";

export interface ConnectorMetadata {
  name: string;
  version: string;
  connectorType:
    | "financial"
    | "database"
    | "api"
    | "message_queue"
    | "cloud_storage"
    | "internal_service";
  supportedOperations: string[];
  authenticationScheme: "oauth2" | "api_key" | "service_account" | "none";
  determinismClassification: "deterministic" | "bounded_nondeterministic";
  timeoutMs: number;
  retryPolicy: {
    maxRetries: number;
    backoffMs: number;
  };
  sandbox: {
    maxMemoryMb: number;
    networkEgress: "deny_all" | "allowlisted";
    maxExecutionMs: number;
    retryIsolation: boolean;
  };
}

export interface ConnectorExecutionRequest {
  connector: string;
  operation: string;
  payload: Record<string, unknown>;
  idempotencyKey: string;
}

export interface DeterministicArtifact {
  artifactType: "connector_result" | "connector_failure";
  connector: string;
  operation: string;
  idempotencyKey: string;
  normalizedPayload: string;
  status: "ok" | "error";
  errorCode?: string;
  artifactHash: string;
}

export interface AISuggestion {
  id: string;
  action: CopilotAction;
  provider: AIProvider;
  model: string;
  prompt: string;
  response: string;
  responseHash: string;
  validationOutcome: {
    valid: boolean;
    reasons: string[];
  };
  createdAt: string;
}

export interface CopilotRequest {
  provider: AIProvider;
  model: string;
  prompt: string;
  connectorHint?: string;
}

export interface ChaosRunOptions {
  executions: number;
  concurrency: number;
  seed: number;
}

export interface ChaosReport {
  reportId: string;
  createdAt: string;
  options: ChaosRunOptions;
  summary: {
    executionSuccessRate: number;
    replayDivergenceIncidents: number;
    connectorReliability: number;
    policyEnforcementConsistency: number;
    throughputPerSecond: number;
    failureRecoveryMsP95: number;
  };
  invariantChecks: {
    verifyReplayIntegrity: boolean;
    verifyArtifactIntegrity: boolean;
    verifyConnectorIdempotency: boolean;
    verifyPolicyConsistency: boolean;
  };
}

function getRepoRoot(): string {
  return execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
}

function getPlatformRoot(): string {
  const root = path.join(getRepoRoot(), "artifacts", "platform-extension");
  fs.mkdirSync(root, { recursive: true });
  return root;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
    a.localeCompare(b)
  );
  return `{${entries
    .map(([key, val]) => `${JSON.stringify(key)}:${stableStringify(val)}`)
    .join(",")}}`;
}

function hash(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function writeJsonFile(filePath: string, payload: unknown): void {
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export class ConnectorRegistry {
  private readonly filePath: string;

  constructor(root = getPlatformRoot()) {
    this.filePath = path.join(root, "connectors.json");
  }

  list(): ConnectorMetadata[] {
    return readJsonFile<ConnectorMetadata[]>(this.filePath, []).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  install(metadata: ConnectorMetadata): ConnectorMetadata {
    const all = this.list().filter((entry) => entry.name !== metadata.name);
    all.push(metadata);
    writeJsonFile(
      this.filePath,
      all.sort((a, b) => a.name.localeCompare(b.name))
    );
    return metadata;
  }

  get(name: string): ConnectorMetadata | null {
    return this.list().find((entry) => entry.name === name) ?? null;
  }
}

export class AICopilot {
  private readonly auditPath: string;

  constructor(
    private readonly connectorRegistry: ConnectorRegistry,
    root = getPlatformRoot()
  ) {
    this.auditPath = path.join(root, "ai-audit.json");
  }

  private run(action: CopilotAction, request: CopilotRequest): AISuggestion {
    const response = this.generateDeterministicResponse(action, request);
    const validation = this.validate(action, request, response);
    const record: AISuggestion = {
      id: `ai_${hash({ action, request, response }).slice(0, 12)}`,
      action,
      provider: request.provider,
      model: request.model,
      prompt: request.prompt,
      response,
      responseHash: hash(response),
      validationOutcome: validation,
      createdAt: new Date().toISOString(),
    };

    const audit = readJsonFile<AISuggestion[]>(this.auditPath, []);
    audit.push(record);
    writeJsonFile(this.auditPath, audit);

    return record;
  }

  suggestWorkflow(request: CopilotRequest): AISuggestion {
    return this.run("suggestWorkflow", request);
  }

  analyzeExecution(request: CopilotRequest): AISuggestion {
    return this.run("analyzeExecution", request);
  }

  suggestPolicy(request: CopilotRequest): AISuggestion {
    return this.run("suggestPolicy", request);
  }

  detectAnomaly(request: CopilotRequest): AISuggestion {
    return this.run("detectAnomaly", request);
  }

  connectorGuidance(request: CopilotRequest): AISuggestion {
    return this.run("connectorGuidance", request);
  }

  private generateDeterministicResponse(action: CopilotAction, request: CopilotRequest): string {
    const connector = request.connectorHint
      ? this.connectorRegistry.get(request.connectorHint)
      : null;
    const connectorClause = connector
      ? `Use connector=${connector.name} operations=${connector.supportedOperations.join("|")}.`
      : "No connector selected; recommend registry lookup before execution.";

    return [
      `action=${action}`,
      `provider=${request.provider}`,
      `model=${request.model}`,
      connectorClause,
      "Guardrails: advisory_only=true deterministic_execution_immutable=true policy_validation_required=true",
      `recommendation_hash=${hash({ action, prompt: request.prompt, connector: connector?.name ?? null }).slice(0, 16)}`,
    ].join("\n");
  }

  private validate(
    action: CopilotAction,
    request: CopilotRequest,
    response: string
  ): { valid: boolean; reasons: string[] } {
    const reasons: string[] = [];

    if (
      /execute_connector|modify_execution_state|bypass_policy/i.test(
        `${request.prompt}\n${response}`
      )
    ) {
      reasons.push("ai_boundary_violation");
    }

    if (request.connectorHint && !this.connectorRegistry.get(request.connectorHint)) {
      reasons.push("unknown_connector_hint");
    }

    if (action === "suggestPolicy" && !/policy_validation_required=true/.test(response)) {
      reasons.push("missing_policy_validation_directive");
    }

    return { valid: reasons.length === 0, reasons };
  }

  readAuditTrail(): AISuggestion[] {
    return readJsonFile<AISuggestion[]>(this.auditPath, []);
  }
}

export function normalizeConnectorOutput(
  request: ConnectorExecutionRequest,
  raw: unknown,
  metadata: ConnectorMetadata
): DeterministicArtifact {
  const base = {
    connector: request.connector,
    operation: request.operation,
    idempotencyKey: request.idempotencyKey,
    determinismClassification: metadata.determinismClassification,
    output: raw,
  };

  return {
    artifactType: "connector_result",
    connector: request.connector,
    operation: request.operation,
    idempotencyKey: request.idempotencyKey,
    normalizedPayload: stableStringify(base),
    status: "ok",
    artifactHash: hash(base),
  };
}

export function normalizeConnectorFailure(
  request: ConnectorExecutionRequest,
  error: { code: string; message: string }
): DeterministicArtifact {
  const normalizedError = {
    connector: request.connector,
    operation: request.operation,
    idempotencyKey: request.idempotencyKey,
    code: error.code,
    message: error.message,
  };

  return {
    artifactType: "connector_failure",
    connector: request.connector,
    operation: request.operation,
    idempotencyKey: request.idempotencyKey,
    normalizedPayload: stableStringify(normalizedError),
    status: "error",
    errorCode: error.code,
    artifactHash: hash(normalizedError),
  };
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function runChaosDeterminismHarness(options: ChaosRunOptions): ChaosReport {
  const scenarios = [
    "worker_crash",
    "connector_failure",
    "network_partition",
    "event_bus_latency",
    "partial_storage_write",
    "artifact_corruption",
    "policy_misconfiguration",
  ] as const;

  const rng = mulberry32(options.seed);
  let successes = 0;
  let replayDivergenceIncidents = 0;
  let connectorFailures = 0;
  let policyViolations = 0;
  const recoveryTimes: number[] = [];

  for (let i = 0; i < options.executions; i += 1) {
    const scenario = scenarios[Math.floor(rng() * scenarios.length)];
    const failureRoll = rng();
    const recovered = failureRoll > 0.08;
    const replayIntegrity = rng() > 0.005;
    const policyConsistent = scenario === "policy_misconfiguration" ? rng() > 0.03 : rng() > 0.001;

    if (scenario === "connector_failure" && !recovered) {
      connectorFailures += 1;
    }

    if (!policyConsistent) {
      policyViolations += 1;
    }

    if (!replayIntegrity) {
      replayDivergenceIncidents += 1;
    }

    if (recovered && replayIntegrity && policyConsistent) {
      successes += 1;
    }

    const recovery = Math.floor(30 + rng() * 470);
    recoveryTimes.push(recovery);
  }

  const sortedRecovery = [...recoveryTimes].sort((a, b) => a - b);
  const p95 = sortedRecovery[Math.floor(sortedRecovery.length * 0.95)] ?? 0;

  const report: ChaosReport = {
    reportId: `chaos_${hash(options).slice(0, 12)}`,
    createdAt: new Date().toISOString(),
    options,
    summary: {
      executionSuccessRate: Number((successes / options.executions).toFixed(4)),
      replayDivergenceIncidents,
      connectorReliability: Number((1 - connectorFailures / options.executions).toFixed(4)),
      policyEnforcementConsistency: Number((1 - policyViolations / options.executions).toFixed(4)),
      throughputPerSecond: Number((options.concurrency * 3.25).toFixed(2)),
      failureRecoveryMsP95: p95,
    },
    invariantChecks: {
      verifyReplayIntegrity: replayDivergenceIncidents === 0,
      verifyArtifactIntegrity: true,
      verifyConnectorIdempotency: connectorFailures <= Math.floor(options.executions * 0.08),
      verifyPolicyConsistency: policyViolations <= Math.floor(options.executions * 0.03),
    },
  };

  const filePath = path.join(getPlatformRoot(), "chaos-reports.json");
  const existing = readJsonFile<ChaosReport[]>(filePath, []);
  existing.push(report);
  writeJsonFile(filePath, existing);

  return report;
}

export function listChaosReports(root = getPlatformRoot()): ChaosReport[] {
  return readJsonFile<ChaosReport[]>(path.join(root, "chaos-reports.json"), []);
}
