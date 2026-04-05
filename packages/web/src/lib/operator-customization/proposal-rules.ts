/**
 * Rules-based intent → structured customization patch.
 * No LLM: deterministic, auditable, safe when inference is disabled.
 */

import type { CustomizationPatch, InferenceMode, OperatingMode } from "./schema";
import { getPresetById } from "./presets";

export type ProposalBuildResult =
  | {
      ok: true;
      patch: CustomizationPatch;
      rationale: string;
      inferenceMode: InferenceMode;
    }
  | { ok: false; reason: string; inferenceMode: InferenceMode };

function applyPreset(presetId: string, rationale: string): ProposalBuildResult {
  const preset = getPresetById(presetId);
  if (!preset) {
    return { ok: false, reason: `Unknown preset: ${presetId}`, inferenceMode: "rules" };
  }
  const full = preset.customization();
  return {
    ok: true,
    patch: {
      modules: full.modules,
      operatingMode: full.operatingMode,
      lastAppliedPresetId: full.lastAppliedPresetId,
    },
    rationale,
    inferenceMode: "rules",
  };
}

export function buildProposalFromNaturalLanguage(request: string): ProposalBuildResult {
  const trimmed = request.trim();
  if (!trimmed) {
    return { ok: false, reason: "Empty request.", inferenceMode: "rules" };
  }

  if (/solo|single\s*operator|one\s*person|compact/i.test(trimmed)) {
    return applyPreset(
      "solo_operator",
      "Matched solo-operator intent: Solo operator preset (compact path; activity feed off)."
    );
  }
  if (/buyer|demo|enterprise\s*pitch|sales/i.test(trimmed)) {
    return applyPreset("buyer_demo", "Matched buyer-demo intent: Buyer demo preset.");
  }
  if (/exception|queue|heatmap|ops\s*first/i.test(trimmed)) {
    return applyPreset(
      "exception_ops",
      "Matched exception-ops intent: heatmap ordered before KPI tiles."
    );
  }
  if (/default|reset|baseline/i.test(trimmed)) {
    return applyPreset("default", "Reset to default layout and standard operating mode.");
  }

  if (/hide\s*activity|no\s*activity\s*feed|disable\s*activity/i.test(trimmed)) {
    return applyPreset(
      "solo_operator",
      "Activity feed hidden via Solo operator preset (other modules unchanged vs that preset)."
    );
  }

  if (/finance|executive|summary|kpi/i.test(trimmed)) {
    const preset = getPresetById("default");
    if (!preset) return { ok: false, reason: "Default preset missing.", inferenceMode: "rules" };
    const full = preset.customization();
    return {
      ok: true,
      patch: {
        modules: full.modules.map((m) =>
          m.moduleId === "kpi_tiles"
            ? {
                ...m,
                titleOverride: "Finance summary",
                helpOverride:
                  "Volume and match-rate snapshot from admin metrics (operational, not statutory reporting).",
              }
            : m
        ),
        operatingMode: full.operatingMode,
      },
      rationale:
        "Finance/leadership wording: KPI title/help only; data still from GET /api/admin/metrics.",
      inferenceMode: "rules",
    };
  }

  return {
    ok: false,
    reason:
      "No rules match. Try: solo operator, buyer demo, exception ops, hide activity feed, finance summary, or reset to default.",
    inferenceMode: "rules",
  };
}

export function coerceOperatingMode(text: string): OperatingMode | undefined {
  if (/solo/i.test(text)) return "solo_operator";
  if (/buyer|demo/i.test(text)) return "buyer_demo";
  if (/standard|normal/i.test(text)) return "standard";
  return undefined;
}
