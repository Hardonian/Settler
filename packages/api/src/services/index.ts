/**
 * Services Index
 *
 * Central export for all services
 */

// Recon Core
export * from "./recon-core";

// Webhooks
export { WebhookService } from "./webhooks/webhook-service";

// Usage
export { ReconUsageTracker } from "./usage/recon-usage-tracker";

// Stripe
export { StripeUsageSync } from "./stripe/usage-sync";

// AI Mesh
export { AIRouter } from "./ai-mesh/ai-router";
export { MultiAgentFallback } from "./ai-mesh/multi-agent-fallback";

// Drift
export { DriftDetector } from "./drift/drift-detector";

// Workflows
export { WorkflowEngine } from "./workflows/workflow-engine";

// Contracts
export { ContractManager } from "./contracts/contract-manager";

// Events
export { EventBus, eventBus } from "./events/event-bus";

// Intelligence
export { UsageOptimizer } from "./intelligence/usage-optimizer";
export { HealthOptimizer } from "./intelligence/health-optimizer";
export { ProductEvolutionAI } from "./intelligence/product-evolution";

// Plugins
export { PluginManager } from "./plugins/plugin-manager";

// AI Config
export { AIConfigManager } from "./ai-config/ai-config-manager";

// Vertical Modules
export { ContractDiffService } from "./verticals/legaltech/contract-diff";
export { QTIValidator } from "./verticals/edtech/qti-validator";
export { LedgerReconService } from "./verticals/fintech/ledger-recon";
export { PolicyComparisonService } from "./verticals/compliance/policy-comparison";
