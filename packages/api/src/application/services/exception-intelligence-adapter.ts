type ReconciliationCoreModule = typeof import("@settler/reconciliation-core");

const sharedReconciliationCore = require("@settler/reconciliation-core") as Partial<
  Pick<
    ReconciliationCoreModule,
    "EXCEPTION_MATCH_TYPES" | "normalizeExceptionResolutionReason" | "predictExceptionArchetype"
  >
>;

const sharedExceptionWorkbench =
  require("../../../../reconciliation-core/dist/exception-workbench.js") as Pick<
    ReconciliationCoreModule,
    "EXCEPTION_MATCH_TYPES"
  >;

const sharedExceptionIntelligence =
  require("../../../../reconciliation-core/dist/exception-intelligence.js") as Pick<
    ReconciliationCoreModule,
    "normalizeExceptionResolutionReason" | "predictExceptionArchetype"
  >;

export const EXCEPTION_MATCH_TYPES: readonly string[] = Array.isArray(
  sharedReconciliationCore.EXCEPTION_MATCH_TYPES
)
  ? sharedReconciliationCore.EXCEPTION_MATCH_TYPES
  : sharedExceptionWorkbench.EXCEPTION_MATCH_TYPES;

export const normalizeExceptionResolutionReason: ReconciliationCoreModule["normalizeExceptionResolutionReason"] =
  typeof sharedReconciliationCore.normalizeExceptionResolutionReason === "function"
    ? sharedReconciliationCore.normalizeExceptionResolutionReason
    : sharedExceptionIntelligence.normalizeExceptionResolutionReason;

export const predictExceptionArchetype: ReconciliationCoreModule["predictExceptionArchetype"] =
  typeof sharedReconciliationCore.predictExceptionArchetype === "function"
    ? sharedReconciliationCore.predictExceptionArchetype
    : sharedExceptionIntelligence.predictExceptionArchetype;
