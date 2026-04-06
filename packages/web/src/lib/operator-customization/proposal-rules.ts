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
      /** Bounded, machine-auditable metadata (no free-form claims). */
      explanationEvidence: Record<string, unknown>;
    }
  | { ok: false; reason: string; inferenceMode: InferenceMode; explanationEvidence: Record<string, unknown> };

function applyPreset(presetId: string, rationale: string, ruleId: string): ProposalBuildResult {
  const preset = getPresetById(presetId);
  if (!preset) {
    return {
      ok: false,
      reason: `Unknown preset: ${presetId}`,
      inferenceMode: "rules",
      explanationEvidence: { engine: "rules", ruleId: "unknown_preset", presetId },
    };
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
    explanationEvidence: {
      engine: "rules",
      ruleId,
      presetId,
      proposalLane: "rules",
    },
  };
}

export function buildProposalFromNaturalLanguage(request: string): ProposalBuildResult {
  const trimmed = request.trim();
  if (!trimmed) {
    return {
      ok: false,
      reason: "Empty request.",
      inferenceMode: "rules",
      explanationEvidence: { engine: "rules", ruleId: "empty_request" },
    };
  }

  if (/solo|single\s*operator|one\s*person|compact/i.test(trimmed)) {
    return applyPreset(
      "solo_operator",
      "Matched solo-operator intent: Solo operator preset (compact path; activity feed off).",
      "intent_solo_operator"
    );
  }
  if (/buyer|demo|enterprise\s*pitch|sales/i.test(trimmed)) {
    return applyPreset("buyer_demo", "Matched buyer-demo intent: Buyer demo preset.", "intent_buyer_demo");
  }
  if (/exception|queue|heatmap|ops\s*first/i.test(trimmed)) {
    return applyPreset(
      "exception_ops",
      "Matched exception-ops intent: heatmap ordered before KPI tiles.",
      "intent_exception_ops"
    );
  }
  if (/default|reset|baseline/i.test(trimmed)) {
    return applyPreset("default", "Reset to default layout and standard operating mode.", "intent_reset_default");
  }

  if (/hide\s*activity|no\s*activity\s*feed|disable\s*activity/i.test(trimmed)) {
    return applyPreset(
      "solo_operator",
      "Activity feed hidden via Solo operator preset (other modules unchanged vs that preset).",
      "intent_hide_activity"
    );
  }

  if (/finance|executive|summary|kpi/i.test(trimmed)) {
    const preset = getPresetById("default");
    if (!preset) {
      return {
        ok: false,
        reason: "Default preset missing.",
        inferenceMode: "rules",
        explanationEvidence: { engine: "rules", ruleId: "default_preset_missing" },
      };
    }
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
      explanationEvidence: {
        engine: "rules",
        ruleId: "intent_finance_kpi_labels",
        moduleId: "kpi_tiles",
        proposalLane: "rules",
      },
    };
  }

  return {
    ok: false,
    reason:
      "No rules match. Try: solo operator, buyer demo, exception ops, hide activity feed, finance summary, or reset to default.",
    inferenceMode: "rules",
    explanationEvidence: { engine: "rules", ruleId: "no_match" },
  };
}

export function coerceOperatingMode(text: string): OperatingMode | undefined {
  if (/solo/i.test(text)) return "solo_operator";
  if (/buyer|demo/i.test(text)) return "buyer_demo";
  if (/standard|normal/i.test(text)) return "standard";
  return undefined;
}
