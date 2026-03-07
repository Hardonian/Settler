/**
 * Settler Platform Integration Layer
 *
 * Unified entry point for all platform subsystems.
 * Wires together: Trust Graph, Replay Engine, Policy Simulator,
 * AI Copilot, Connector Ecosystem, Chaos Harness, MCP Server,
 * Event Backbone, and Observability.
 */

export * from "./primitives";
export { TrustGraph } from "./trust-graph";
export type { TrustGraphSnapshot, LineageTrace } from "./trust-graph";
export { PolicySimulator } from "./policy-simulator";
export type { SimulationRequest, SimulationResult, PolicyDiff } from "./policy-simulator";
export { AICopilot } from "./ai-copilot";
export type { AICopilotConfig } from "./ai-copilot";
export {
  DeterminismAuditor,
  DeterministicExecutionFence,
  normalizeConnectorOutput,
  deterministicId,
} from "./determinism";
export type { DeterminismViolation, ViolationType } from "./determinism";
export { ChaosHarness } from "./chaos-harness";
export type { ChaosScenario, ChaosResult } from "./chaos-harness";
export {
  TrustGraphConsumer,
  ObservabilityConsumer,
  PolicyAuditConsumer,
  ConnectorMetricsConsumer,
  EventConsumerRegistry,
} from "./event-consumers";
export type {
  EventConsumer,
  ObservabilityRecord,
  PolicyDecisionLog,
  ConnectorMetric,
} from "./event-consumers";
export { ConnectorCapabilityRegistry } from "./connector-registry";
export type { ConnectorCapability, RetryPolicy } from "./connector-registry";
