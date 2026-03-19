export interface RunConfigurationSummary {
  sourceAdapter: string | null;
  targetAdapter: string | null;
  reconStrategy: string | null;
  templateId: string | null;
  validationRuleCount: number;
  validationRuleLabels: string[];
  ruleVersionCount: number;
  ruleVersionLabels: string[];
  snapshotId: string | null;
  inputHash: string | null;
  configSource: "snapshot" | "job_definition";
  configCapturedAt: string | null;
  definitionDriftDetected: boolean;
  definitionDriftNotes: string[];
  summaryBasis: string;
}

interface RunSnapshotRecord {
  id?: string | null;
  inputHash?: string | null;
  createdAt?: string | null;
  jobConfig?: unknown;
  ruleVersions?: unknown;
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
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

function summarizeRuleVersions(ruleVersions: unknown): string[] {
  if (!Array.isArray(ruleVersions)) {
    return [];
  }

  return ruleVersions
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const row = entry as Record<string, unknown>;
      const ruleId = asString(row.ruleId);
      const version = typeof row.version === "number" ? row.version : null;
      if (!ruleId) {
        return null;
      }
      return version !== null ? `${ruleId} v${version}` : ruleId;
    })
    .filter((label): label is string => Boolean(label))
    .slice(0, 6);
}

function stableSerialize(value: unknown): string | null {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

export function buildRunConfigurationSummary(input: {
  sourceAdapter?: string | null;
  targetAdapter?: string | null;
  reconStrategy?: string | null;
  templateId?: string | null;
  validationRules?: unknown;
  snapshotId?: string | null;
  inputHash?: string | null;
  snapshot?: RunSnapshotRecord | null;
  resultStartedAt?: string | null;
}): RunConfigurationSummary {
  const snapshot = input.snapshot ?? null;
  const snapshotJobConfig = asObject(snapshot?.jobConfig);
  const snapshotValidationRules = snapshotJobConfig?.validationRules;
  const effectiveValidationRules = Array.isArray(snapshotValidationRules)
    ? snapshotValidationRules
    : input.validationRules;
  const validationRuleLabels = summarizeValidationRules(effectiveValidationRules);
  const ruleVersionLabels = summarizeRuleVersions(snapshot?.ruleVersions);

  const effectiveReconStrategy =
    asString(snapshotJobConfig?.reconStrategy) || input.reconStrategy || null;
  const effectiveTemplateId =
    asString(snapshotJobConfig?.templateId) ||
    asString(snapshotJobConfig?.mappingTemplateId) ||
    input.templateId ||
    null;
  const snapshotId = input.snapshotId ?? snapshot?.id ?? null;
  const inputHash = input.inputHash ?? snapshot?.inputHash ?? null;
  const configSource = snapshotId ? "snapshot" : "job_definition";
  const configCapturedAt = snapshot?.createdAt ?? input.resultStartedAt ?? null;
  const driftNotes: string[] = [];

  if (configSource === "snapshot") {
    if (
      input.reconStrategy &&
      effectiveReconStrategy &&
      input.reconStrategy.toLowerCase() !== effectiveReconStrategy.toLowerCase()
    ) {
      driftNotes.push("Reconciliation strategy changed since this result was captured.");
    }

    if (input.templateId && effectiveTemplateId && input.templateId !== effectiveTemplateId) {
      driftNotes.push("Template reference changed since this result was captured.");
    }

    if (Array.isArray(snapshotValidationRules) && Array.isArray(input.validationRules)) {
      if (snapshotValidationRules.length !== input.validationRules.length) {
        driftNotes.push("Validation rule count changed since this result was captured.");
      } else {
        const snapshotSerialized = stableSerialize(snapshotValidationRules);
        const currentSerialized = stableSerialize(input.validationRules);
        if (
          snapshotSerialized &&
          currentSerialized &&
          snapshotSerialized !== currentSerialized
        ) {
          driftNotes.push("Validation rule definitions changed since this result was captured.");
        }
      }
    }
  }

  const summaryBasis =
    configSource === "snapshot"
      ? "Configuration was loaded from the run snapshot captured before execution. Current job settings can differ."
      : "Snapshot data is unavailable. Configuration reflects the current job definition and may differ from historical execution.";

  return {
    sourceAdapter: input.sourceAdapter ?? null,
    targetAdapter: input.targetAdapter ?? null,
    reconStrategy: effectiveReconStrategy,
    templateId: effectiveTemplateId,
    validationRuleCount: Array.isArray(effectiveValidationRules) ? effectiveValidationRules.length : 0,
    validationRuleLabels,
    ruleVersionCount: Array.isArray(snapshot?.ruleVersions) ? snapshot.ruleVersions.length : 0,
    ruleVersionLabels,
    snapshotId,
    inputHash,
    configSource,
    configCapturedAt,
    definitionDriftDetected: driftNotes.length > 0,
    definitionDriftNotes: driftNotes,
    summaryBasis,
  };
}
