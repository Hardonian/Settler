import {
  CUSTOMIZATION_SCHEMA_VERSION,
  OperatorSurfaceCustomizationSchema,
  type CustomizationPatch,
  type OperatorSurfaceCustomization,
} from "./schema";
import { defaultAdminDashboardCustomization, validatePlacementsAgainstRegistry } from "./registry";

export type NormalizeResult =
  | { ok: true; value: OperatorSurfaceCustomization }
  | { ok: false; errors: string[] };

function sortModules(m: OperatorSurfaceCustomization): OperatorSurfaceCustomization {
  const modules = [...m.modules].sort(
    (a, b) => a.order - b.order || a.moduleId.localeCompare(b.moduleId)
  );
  return { ...m, modules };
}

/** Merge patch onto base; then validate and normalize. */
export function applyCustomizationPatch(
  base: OperatorSurfaceCustomization,
  patch: CustomizationPatch
): NormalizeResult {
  const merged: OperatorSurfaceCustomization = {
    ...base,
    ...(patch.operatingMode !== undefined ? { operatingMode: patch.operatingMode } : {}),
    ...(patch.modules !== undefined ? { modules: patch.modules } : {}),
    ...(patch.lastAppliedPresetId !== undefined
      ? { lastAppliedPresetId: patch.lastAppliedPresetId }
      : {}),
    schemaVersion: CUSTOMIZATION_SCHEMA_VERSION,
  };
  return normalizeOperatorCustomization(merged);
}

export function normalizeOperatorCustomization(raw: unknown): NormalizeResult {
  const parsed = OperatorSurfaceCustomizationSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    };
  }
  const sorted = sortModules(parsed.data);
  const reg = validatePlacementsAgainstRegistry(sorted.modules);
  if (!reg.ok) {
    return { ok: false, errors: reg.errors };
  }
  return { ok: true, value: sorted };
}

export function ensureCustomizationShape(
  raw: unknown | null | undefined
): OperatorSurfaceCustomization {
  const base = defaultAdminDashboardCustomization();
  if (raw == null) return base;
  const n = normalizeOperatorCustomization(raw);
  if (n.ok) return n.value;
  return base;
}
