/**
 * Defensibility Services
 *
 * Type-safe implementations for closing gaps and strengthening Settler's defensive moats.
 *
 * Based on narrative compression analysis:
 * - Data Moat: Lossy exports, export retention policies
 * - Workflow Lock-In: Workflow reference promotion
 * - Integration & Adapter Gravity: Adapter health monitoring
 * - Enforcement & Trust: Deterministic guarantee enforcement
 */
export { lossyExportService, type ExportOptions, type LossyExportResult } from './lossy-exports';
export { exportRetentionPolicyService, type ExportRetentionPolicy, } from './export-retention-policy';
export { workflowReferencePromotionService, type WorkflowReferencePromotion, type PromotionMetrics, } from './workflow-reference-promotion';
export { adapterHealthMonitoringService, type AdapterHealthMetrics, type AdapterMaintenanceEvent, } from './adapter-health-monitoring';
export { deterministicGuaranteeEnforcementService, type DeterministicGuarantee, type DeterministicRun, } from './deterministic-guarantee-enforcement';
//# sourceMappingURL=index.d.ts.map