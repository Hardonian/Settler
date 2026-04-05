import type { OperatorSurfaceCustomization } from "./schema";
import { defaultAdminDashboardCustomization } from "./registry";

export type PresetDefinition = {
  id: string;
  label: string;
  description: string;
  scope: "system";
  /** Human-readable; applied into config.lastAppliedPresetId */
  customization: () => OperatorSurfaceCustomization;
};

function cloneDefault(): OperatorSurfaceCustomization {
  return JSON.parse(JSON.stringify(defaultAdminDashboardCustomization())) as OperatorSurfaceCustomization;
}

/** Compact solo layout: highest-signal blocks first; optional modules off by default where safe. */
function soloOperatorDashboard(): OperatorSurfaceCustomization {
  const c = cloneDefault();
  c.operatingMode = "solo_operator";
  c.lastAppliedPresetId = "solo_operator";
  c.modules = [
    { moduleId: "trust_connection", enabled: true, order: 0 },
    { moduleId: "time_range", enabled: true, order: 1 },
    { moduleId: "usage_warning", enabled: true, order: 2, thresholdOverrides: { usageWarningVolume: 500_000 } },
    { moduleId: "kpi_tiles", enabled: true, order: 3 },
    { moduleId: "exception_heatmap", enabled: true, order: 4 },
    { moduleId: "activity_feed", enabled: false, order: 5 },
  ];
  return c;
}

function buyerDemoDashboard(): OperatorSurfaceCustomization {
  const c = cloneDefault();
  c.operatingMode = "buyer_demo";
  c.lastAppliedPresetId = "buyer_demo";
  c.modules = c.modules.map((m) =>
    m.moduleId === "usage_warning"
      ? { ...m, enabled: false }
      : { ...m, titleOverride: m.moduleId === "kpi_tiles" ? "Operational snapshot" : undefined }
  );
  return c;
}

function exceptionOpsDashboard(): OperatorSurfaceCustomization {
  const c = cloneDefault();
  c.operatingMode = "standard";
  c.lastAppliedPresetId = "exception_ops";
  c.modules = [
    { moduleId: "trust_connection", enabled: true, order: 0 },
    { moduleId: "time_range", enabled: true, order: 1 },
    { moduleId: "exception_heatmap", enabled: true, order: 2 },
    { moduleId: "kpi_tiles", enabled: true, order: 3 },
    { moduleId: "usage_warning", enabled: true, order: 4 },
    { moduleId: "activity_feed", enabled: true, order: 5 },
  ];
  return c;
}

export const OPERATOR_CUSTOMIZATION_PRESETS: PresetDefinition[] = [
  {
    id: "default",
    label: "Default",
    description: "Balanced modules with standard ordering.",
    scope: "system",
    customization: () => {
      const c = cloneDefault();
      c.lastAppliedPresetId = "default";
      return c;
    },
  },
  {
    id: "solo_operator",
    label: "Solo operator",
    description: "Compact signal path: connectivity, range, usage attention, KPIs, heatmap; activity feed off.",
    scope: "system",
    customization: soloOperatorDashboard,
  },
  {
    id: "buyer_demo",
    label: "Buyer demo",
    description: "Buyer-safe framing; suppresses usage warning strip by default.",
    scope: "system",
    customization: buyerDemoDashboard,
  },
  {
    id: "exception_ops",
    label: "Exception ops",
    description: "Elevates heatmap ahead of KPI tiles for queue-first review.",
    scope: "system",
    customization: exceptionOpsDashboard,
  },
];

export function getPresetById(id: string): PresetDefinition | undefined {
  return OPERATOR_CUSTOMIZATION_PRESETS.find((p) => p.id === id);
}
