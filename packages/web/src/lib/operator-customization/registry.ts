/**
 * Declarative registry of configurable admin dashboard modules.
 * `locked` modules cannot be removed or reordered; only copy/help/thresholds may be constrained per module.
 */

import type { ModulePlacement } from "./schema";

export type ModuleTruthClass =
  | "canonical_metric"
  | "connectivity_posture"
  | "operator_workflow"
  | "presentation_summary";

export type DashboardModuleDefinition = {
  id: string;
  /** Stable category for UI grouping */
  category: "signal" | "operations" | "trust" | "workflow";
  defaultTitle: string;
  defaultHelp: string;
  locked: boolean;
  /** What kind of truth this block reflects — operators must not treat presentation as canonical run truth. */
  truthClass: ModuleTruthClass;
  /** When degraded, which API or subsystem backs the block */
  sourceOfTruthHint: string;
  allowTitleOverride: boolean;
  allowHelpOverride: boolean;
  allowDisable: boolean;
  allowReorder: boolean;
  supportedThresholdKeys?: string[];
};

export const ADMIN_DASHBOARD_MODULE_REGISTRY: Record<string, DashboardModuleDefinition> = {
  kpi_tiles: {
    id: "kpi_tiles",
    category: "signal",
    defaultTitle: "KPI tiles",
    defaultHelp: "Aggregated volume, match rate, and exception counts from admin metrics snapshot.",
    locked: false,
    truthClass: "canonical_metric",
    sourceOfTruthHint: "GET /api/admin/metrics",
    allowTitleOverride: true,
    allowHelpOverride: true,
    allowDisable: true,
    allowReorder: true,
    supportedThresholdKeys: ["usageWarningVolume"],
  },
  exception_heatmap: {
    id: "exception_heatmap",
    category: "operations",
    defaultTitle: "Exception heatmap",
    defaultHelp: "Distribution of exceptions by type from the same metrics snapshot.",
    locked: false,
    truthClass: "canonical_metric",
    sourceOfTruthHint: "GET /api/admin/metrics (heatmap)",
    allowTitleOverride: true,
    allowHelpOverride: true,
    allowDisable: true,
    allowReorder: true,
  },
  activity_feed: {
    id: "activity_feed",
    category: "operations",
    defaultTitle: "Activity feed",
    defaultHelp: "Recent operational events derived from admin metrics aggregation.",
    locked: false,
    truthClass: "operator_workflow",
    sourceOfTruthHint: "GET /api/admin/metrics (activity)",
    allowTitleOverride: true,
    allowHelpOverride: true,
    allowDisable: true,
    allowReorder: true,
  },
  trust_connection: {
    id: "trust_connection",
    category: "trust",
    defaultTitle: "Live connection",
    defaultHelp: "SSE / stream connectivity to admin metrics; degraded when disconnected.",
    locked: true,
    truthClass: "connectivity_posture",
    sourceOfTruthHint: "GET /api/admin/stream",
    allowTitleOverride: true,
    allowHelpOverride: true,
    allowDisable: false,
    allowReorder: false,
  },
  time_range: {
    id: "time_range",
    category: "workflow",
    defaultTitle: "Time range",
    defaultHelp: "Selects the window passed to the metrics API.",
    locked: true,
    truthClass: "operator_workflow",
    sourceOfTruthHint: "Client query param → /api/admin/metrics",
    allowTitleOverride: true,
    allowHelpOverride: true,
    allowDisable: false,
    allowReorder: false,
  },
  usage_warning: {
    id: "usage_warning",
    category: "signal",
    defaultTitle: "Usage warning",
    defaultHelp:
      "Highlights when volume approaches a configured attention threshold (presentation only).",
    locked: false,
    truthClass: "presentation_summary",
    sourceOfTruthHint: "Derived from KPI totalVolume + local threshold",
    allowTitleOverride: true,
    allowHelpOverride: true,
    allowDisable: true,
    allowReorder: true,
    supportedThresholdKeys: ["usageWarningVolume"],
  },
};

const DEFAULT_ORDER: string[] = [
  "trust_connection",
  "time_range",
  "usage_warning",
  "kpi_tiles",
  "exception_heatmap",
  "activity_feed",
];

export function defaultAdminDashboardCustomization(): import("./schema").OperatorSurfaceCustomization {
  return {
    schemaVersion: "1",
    operatingMode: "standard",
    modules: DEFAULT_ORDER.map((moduleId, index) => ({
      moduleId,
      enabled: true,
      order: index,
    })),
  };
}

export function listRegistryModuleIds(): string[] {
  return Object.keys(ADMIN_DASHBOARD_MODULE_REGISTRY);
}

export function validatePlacementsAgainstRegistry(
  modules: ModulePlacement[]
): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const m of modules) {
    const def = ADMIN_DASHBOARD_MODULE_REGISTRY[m.moduleId];
    if (!def) {
      errors.push(`Unknown moduleId: ${m.moduleId}`);
      continue;
    }
    seen.add(m.moduleId);
    if (!def.allowDisable && !m.enabled) {
      errors.push(`Module ${m.moduleId} is locked on and cannot be disabled.`);
    }
    if (!def.allowReorder && m.order !== DEFAULT_ORDER.indexOf(m.moduleId)) {
      /* reorder of locked modules: allow if order matches default position */
      const expected = DEFAULT_ORDER.indexOf(m.moduleId);
      if (expected >= 0 && m.order !== expected) {
        errors.push(`Module ${m.moduleId} order is fixed; reset to default layout.`);
      }
    }
    if (m.titleOverride && !def.allowTitleOverride) {
      errors.push(`Module ${m.moduleId} does not allow title override.`);
    }
    if (m.helpOverride && !def.allowHelpOverride) {
      errors.push(`Module ${m.moduleId} does not allow help override.`);
    }
    if (m.thresholdOverrides) {
      const allowed = new Set(def.supportedThresholdKeys ?? []);
      for (const key of Object.keys(m.thresholdOverrides)) {
        if (!allowed.has(key)) {
          errors.push(`Module ${m.moduleId} does not support threshold key: ${key}`);
        }
      }
    }
  }

  for (const id of DEFAULT_ORDER) {
    if (!seen.has(id)) {
      errors.push(`Missing required module: ${id}`);
    }
  }

  return errors.length ? { ok: false, errors } : { ok: true };
}
