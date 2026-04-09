import {
  applyCustomizationPatch,
  normalizeOperatorCustomization,
} from "@/lib/operator-customization/normalize";
import {
  defaultAdminDashboardCustomization,
  validatePlacementsAgainstRegistry,
} from "@/lib/operator-customization/registry";
import { buildProposalFromNaturalLanguage } from "@/lib/operator-customization/proposal-rules";
import { getPresetById } from "@/lib/operator-customization/presets";

describe("operator customization", () => {
  it("normalizes default admin dashboard config", () => {
    const d = defaultAdminDashboardCustomization();
    const n = normalizeOperatorCustomization(d);
    expect(n.ok).toBe(true);
    if (n.ok) expect(n.value.modules.length).toBeGreaterThan(0);
  });

  it("rejects disabling locked modules", () => {
    const d = defaultAdminDashboardCustomization();
    const bad = {
      ...d,
      modules: d.modules.map((m) =>
        m.moduleId === "trust_connection" ? { ...m, enabled: false } : m
      ),
    };
    const n = normalizeOperatorCustomization(bad);
    expect(n.ok).toBe(false);
  });

  it("registry validation surfaces unknown modules", () => {
    const d = defaultAdminDashboardCustomization();
    const r = validatePlacementsAgainstRegistry([
      ...d.modules,
      { moduleId: "fake_module", enabled: true, order: 99 },
    ]);
    expect(r.ok).toBe(false);
  });

  it("applyCustomizationPatch merges operating mode", () => {
    const base = defaultAdminDashboardCustomization();
    const merged = applyCustomizationPatch(base, { operatingMode: "solo_operator" });
    expect(merged.ok).toBe(true);
    if (merged.ok) expect(merged.value.operatingMode).toBe("solo_operator");
  });

  it("proposal rules map solo operator to preset", () => {
    const p = buildProposalFromNaturalLanguage("I run this alone — solo operator view");
    expect(p.ok).toBe(true);
    if (p.ok) {
      expect(p.patch.lastAppliedPresetId).toBe("solo_operator");
      expect(p.explanationEvidence).toMatchObject({
        engine: "rules",
        ruleId: "intent_solo_operator",
      });
      const preset = getPresetById("solo_operator");
      expect(preset).toBeDefined();
    }
  });

  it("proposal rules reject unsupported phrasing", () => {
    const p = buildProposalFromNaturalLanguage("make the database faster");
    expect(p.ok).toBe(false);
    if (!p.ok) {
      expect(p.explanationEvidence.ruleId).toBe("no_match");
    }
  });
});
