/**
 * Settler Platform Primitives
 *
 * Canonical types shared across all subsystems. Every subsystem
 * (Trust Graph, Replay Engine, Policy Simulator, AI Copilot, Connector
 * Ecosystem, Chaos Harness, MCP Server) maps to these primitives.
 */

// ────────────────────────────────────────────────────────────
// Execution
// ────────────────────────────────────────────────────────────
export interface Execution {
  executionId: string;
  runId: string;
  tenantId: string;
  policyId: string;
  engineVersion: string;
  status: ExecutionStatus;
  startedAt: string;
  completedAt?: string;
  inputHash: string;
  configHash: string;
  outputHash?: string;
  runFingerprint?: string;
}

export type ExecutionStatus = "pending" | "running" | "completed" | "failed" | "replaying";

// ────────────────────────────────────────────────────────────
// Artifact (content-addressed)
// ────────────────────────────────────────────────────────────
export interface Artifact {
  artifactId: string;
  contentHash: string;
  artifactType: ArtifactType;
  tenantId: string;
  executionId: string;
  createdAt: string;
  sizeBytes: number;
  storageRef: string;
}

export type ArtifactType =
  | "evidence_bundle"
  | "run_output"
  | "report"
  | "proof_capsule"
  | "connector_snapshot"
  | "policy_snapshot";

// ────────────────────────────────────────────────────────────
// Workflow
// ────────────────────────────────────────────────────────────
export interface Workflow {
  workflowId: string;
  tenantId: string;
  name: string;
  policyId: string;
  connectorIds: string[];
  schedule?: WorkflowSchedule;
  status: "active" | "paused" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowSchedule {
  cadence: "manual" | "daily" | "weekly" | "monthly";
  timezone: string;
  nextRunAt?: string;
}

// ────────────────────────────────────────────────────────────
// Policy
// ────────────────────────────────────────────────────────────
export interface Policy {
  policyId: string;
  version: string;
  policyHash: string;
  tenantId: string;
  evidenceLevel: "none" | "standard" | "full";
  replayRequired: boolean;
  budgets: PolicyBudgets;
  identity: PolicyIdentity;
  metadata: PolicyMetadata;
}

export interface PolicyBudgets {
  maxComputeUnits: number;
  maxMemoryUnits: number;
  maxCasIoUnits: number;
  maxReplayCalls: number;
}

export interface PolicyIdentity {
  requiredRole?: string;
  requiredScopes: string[];
}

export interface PolicyMetadata {
  retentionDays?: number;
  allowDeterministicOverride: boolean;
}

// ────────────────────────────────────────────────────────────
// Connector
// ────────────────────────────────────────────────────────────
export interface Connector {
  connectorId: string;
  tenantId: string;
  providerId: string;
  displayName: string;
  category: string;
  status: "connected" | "needs_attention" | "error" | "disabled";
  lastSyncAt?: string;
  consecutiveFailures: number;
}

// ────────────────────────────────────────────────────────────
// Event
// ────────────────────────────────────────────────────────────
export interface PlatformEvent {
  eventId: string;
  idempotencyKey?: string;
  tenantId: string;
  executionId: string;
  eventType: PlatformEventType;
  eventVersion?: number;
  sequence: number;
  occurredAt?: string;
  createdAt?: string;
  source?: string;
  severity?: "debug" | "info" | "warning" | "error" | "critical";
  metadata?: Record<string, unknown>;
  correlation: {
    correlationId: string;
    traceId?: string;
    causationId?: string;
    tenantId: string;
    runId?: string;
    executionId?: string;
    actorId?: string;
    alertId?: string;
    replayId?: string;
    supportIssueId?: string;
  };
  payload: Record<string, unknown>;
}

export type PlatformEventType =
  | "workflow.triggered"
  | "worker.lease.acquired"
  | "execution.started"
  | "state.persisted"
  | "proof.artifact.generated"
  | "execution.completed"
  | "execution.failed"
  | "connector.sync.started"
  | "connector.sync.completed"
  | "connector.sync.failed"
  | "policy.evaluated"
  | "trust.node.added"
  | "trust.edge.added"
  | "ai.suggestion.created"
  | "ai.suggestion.accepted"
  | "ai.suggestion.rejected"
  | "chaos.fault.injected"
  | "chaos.invariant.checked"
  | "alert.created"
  | "alert.status.changed"
  | "replay.started"
  | "replay.completed"
  | "replay.failed"
  | "support.issue.created"
  | "support.issue.linked"
  | "webhook.received"
  | "webhook.rejected"
  | "operator.action.executed"
  | "stream.event.emitted"
  | "system.degraded"
  | "reconciliation.started"
  | "reconciliation.completed"
  | "reconciliation.failed"
  | "reconciliation.value.realized"
  | "reconciliation.errors.prevented";

// ────────────────────────────────────────────────────────────
// Proof
// ────────────────────────────────────────────────────────────
export interface Proof {
  proofId: string;
  executionId: string;
  tenantId: string;
  runFingerprint: string;
  hashChain: string[];
  inputHash: string;
  configHash: string;
  outputHash: string;
  policyHash: string;
  engineVersion: string;
  createdAt: string;
  verified: boolean;
  verifiedAt?: string;
}

// ────────────────────────────────────────────────────────────
// Tenant
// ────────────────────────────────────────────────────────────
export interface Tenant {
  tenantId: string;
  name: string;
  plan: "free" | "pro" | "enterprise";
  isolationLevel: "shared" | "dedicated";
  createdAt: string;
}

// ────────────────────────────────────────────────────────────
// Trust Graph Node / Edge
// ────────────────────────────────────────────────────────────
export interface TrustNode {
  nodeId: string;
  tenantId: string;
  nodeType: "execution" | "artifact" | "policy" | "connector" | "proof";
  referenceId: string;
  label: string;
  contentHash: string;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface TrustEdge {
  edgeId: string;
  tenantId: string;
  sourceNodeId: string;
  targetNodeId: string;
  edgeType: TrustEdgeType;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export type TrustEdgeType =
  | "produced" // execution → artifact
  | "consumed" // execution → artifact (input)
  | "governed_by" // execution → policy
  | "proved_by" // execution → proof
  | "sourced_from" // artifact → connector
  | "replayed_from" // execution → execution
  | "derived_from"; // artifact → artifact

// ────────────────────────────────────────────────────────────
// Copilot Suggestion (advisory only, never direct execution)
// ────────────────────────────────────────────────────────────
export interface AISuggestion {
  suggestionId: string;
  tenantId: string;
  executionId?: string;
  workflowId?: string;
  category: AISuggestionCategory;
  title: string;
  description: string;
  confidence: number;
  status: "pending" | "accepted" | "rejected" | "expired";
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  auditTrail: AIAuditEntry[];
}

export type AISuggestionCategory =
  | "workflow_optimization"
  | "anomaly_detection"
  | "policy_recommendation"
  | "connector_health"
  | "reconciliation_hint";

export interface AIAuditEntry {
  timestamp: string;
  action: string;
  actor: string;
  details: Record<string, unknown>;
}

// ────────────────────────────────────────────────────────────
// Chaos Fault
// ────────────────────────────────────────────────────────────
export interface ChaosFault {
  faultId: string;
  faultType: ChaosFaultType;
  target: string;
  injectedAt: string;
  duration?: number;
  parameters: Record<string, unknown>;
}

export type ChaosFaultType =
  | "worker_crash"
  | "network_partition"
  | "connector_failure"
  | "event_delay"
  | "partial_write"
  | "artifact_corruption"
  | "policy_timeout";

export interface ChaosInvariant {
  invariantId: string;
  name: string;
  description: string;
  check: "replay_correctness" | "proof_integrity" | "execution_idempotency" | "tenant_isolation";
  passed: boolean;
  checkedAt: string;
  details: Record<string, unknown>;
}
