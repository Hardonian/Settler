import type { OperatorSurfaceCustomization } from "@/lib/operator-customization/schema";
import {
  type OperatorCustomizationEntitlements,
  isPresetIdEntitled,
} from "./operator-customization-entitlements";

export function validateCustomizationAgainstEntitlements(
  config: OperatorSurfaceCustomization,
  entitlements: OperatorCustomizationEntitlements
): { ok: true } | { ok: false; code: "preset_not_entitled"; presetId: string } {
  const pid = config.lastAppliedPresetId;
  if (pid && !isPresetIdEntitled(pid, entitlements)) {
    return { ok: false, code: "preset_not_entitled", presetId: pid };
  }
  return { ok: true };
}
