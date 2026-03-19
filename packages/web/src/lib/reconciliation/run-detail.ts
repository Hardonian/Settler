export interface RunConfigurationSummary {
  sourceAdapter: string | null;
  targetAdapter: string | null;
  reconStrategy: string | null;
  templateId: string | null;
  validationRuleCount: number;
  validationRuleLabels: string[];
  snapshotId: string | null;
  inputHash: string | null;
  summaryBasis: string;
}

function labelFromRule(rule: Record<string, unknown>): string | null {
  const field = typeof rule.field === "string" ? rule.field : null;
  const type = typeof rule.type === "string" ? rule.type : null;
  const tolerance = typeof rule.tolerance === "number" ? `±${rule.tolerance}` : null;
  const window = typeof rule.window === "string" ? rule.window : null;

  if (!field && !type) {
    return null;
  }

  const base = [field, type].filter(Boolean).join(" ");
  const suffix = [tolerance, window].filter(Boolean).join(" ");
  return [base, suffix].filter(Boolean).join(" • ");
}

export function summarizeValidationRules(validationRules: unknown): string[] {
  if (!Array.isArray(validationRules)) {
    return [];
  }

  return validationRules
    .map((rule) =>
      rule && typeof rule === "object" ? labelFromRule(rule as Record<string, unknown>) : null
    )
    .filter((rule): rule is string => Boolean(rule))
    .slice(0, 4);
}

export function buildRunConfigurationSummary(input: {
  sourceAdapter?: string | null;
  targetAdapter?: string | null;
  reconStrategy?: string | null;
  templateId?: string | null;
  validationRules?: unknown;
  snapshotId?: string | null;
  inputHash?: string | null;
}): RunConfigurationSummary {
  const validationRuleLabels = summarizeValidationRules(input.validationRules);

  return {
    sourceAdapter: input.sourceAdapter ?? null,
    targetAdapter: input.targetAdapter ?? null,
    reconStrategy: input.reconStrategy ?? null,
    templateId: input.templateId ?? null,
    validationRuleCount: Array.isArray(input.validationRules) ? input.validationRules.length : 0,
    validationRuleLabels,
    snapshotId: input.snapshotId ?? null,
    inputHash: input.inputHash ?? null,
    summaryBasis:
      "Summary counts are derived from the latest persisted reconciliation result for this run.",
  };
}
