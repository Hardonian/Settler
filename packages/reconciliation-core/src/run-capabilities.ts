/**
 * Machine-readable capabilities for reconciliation run kinds.
 * Keep in sync with ingestion-only gates on Express v1 workbench routes.
 */

import type { ReconciliationRunKind } from "./canonical-reconciliation.js";

export interface ReconciliationRunCapabilities {
  /** Row-level matches from reconciliation_matches (ingestion runs only) */
  matches: boolean;
  workbench: boolean;
  compare: boolean;
  export: boolean;
  /** Console result summary + ranked items (recon_results / ingestion-shaped) */
  consoleResults: boolean;
}

export function capabilitiesForRunKind(
  runKind: ReconciliationRunKind
): ReconciliationRunCapabilities {
  if (runKind === "ingestion_run") {
    return {
      matches: true,
      workbench: true,
      compare: true,
      export: true,
      consoleResults: true,
    };
  }
  return {
    matches: false,
    workbench: false,
    compare: false,
    export: false,
    consoleResults: true,
  };
}
