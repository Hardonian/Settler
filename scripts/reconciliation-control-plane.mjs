import crypto from "node:crypto";

const ENGINE_VERSION = "nlcp-1.0.0";

export function stableStringify(value) {
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (typeof value === "bigint") return JSON.stringify(value.toString());
  if (value instanceof Set) return stableStringify(Array.from(value).sort());
  if (value instanceof Map) {
    return stableStringify(
      Array.from(value.entries()).sort(([a], [b]) => String(a).localeCompare(String(b)))
    );
  }
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
}

export function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function parseTolerance(prompt) {
  const percent = prompt.match(/(\d+(?:\.\d+)?)\s*%/i);
  if (percent) {
    return { type: "percentage", value: Number(percent[1]) / 100 };
  }
  const cents = prompt.match(/(\d+(?:\.\d+)?)\s*cents?/i);
  if (cents) {
    return { type: "absolute", value: Number(cents[1]) / 100 };
  }
  return { type: "absolute", value: 0 };
}

function parseSchedule(prompt) {
  if (/daily/i.test(prompt)) return { cadence: "daily", timezone: "UTC" };
  if (/weekly/i.test(prompt)) return { cadence: "weekly", timezone: "UTC" };
  return { cadence: "manual", timezone: "UTC" };
}

export function compilePromptToSpec({ prompt, orgId, workspaceId, memory = [] }) {
  const normalizedPrompt = prompt.trim().replace(/\s+/g, " ");
  const promptLower = normalizedPrompt.toLowerCase();

  const connections = [];
  if (promptLower.includes("stripe"))
    connections.push({ provider: "stripe", ref: "stripe-default" });
  if (promptLower.includes("quickbooks"))
    connections.push({ provider: "quickbooks", ref: "quickbooks-default" });

  const relevantMemory = memory.filter(
    (entry) => entry.org_id === orgId && entry.workspace_id === workspaceId
  );

  const tolerance = parseTolerance(normalizedPrompt);
  const toleranceFromMemory = relevantMemory.find(
    (entry) => entry.memory_type === "tolerance_preference"
  );
  const effectiveTolerance =
    tolerance.value > 0 ? tolerance : (toleranceFromMemory?.content_json ?? tolerance);

  const matchRules = [
    {
      type: "composite_match",
      fields: ["invoice_number", "amount"],
      tolerance: effectiveTolerance,
      amount_field: "amount",
    },
  ];

  const riskThresholdMatch = normalizedPrompt.match(/over\s*\$?(\d+(?:,\d{3})*(?:\.\d+)?)/i);
  const riskThreshold = riskThresholdMatch
    ? Number(riskThresholdMatch[1].replace(/,/g, ""))
    : 10000;

  const spec = {
    connections,
    matchRules,
    tolerance: effectiveTolerance,
    riskPolicies: [
      {
        kind: "high_value_without_memo",
        threshold: riskThreshold,
        requiresField: "memo",
        severity: "high",
        escalationPath: "review_queue",
      },
    ],
    schedule: parseSchedule(normalizedPrompt),
    reviewFlow: {
      mode: /auto-approve recurring/i.test(normalizedPrompt)
        ? "auto_approve_recurring"
        : "manual_review",
      reviewerGroup: "finance_ops",
    },
    rolloutMode: "draft",
  };

  const specCanonical = stableStringify(spec);
  return {
    spec,
    spec_hash: sha256(specCanonical),
    memory_influence: relevantMemory.map((entry) => entry.id).sort(),
    canonical: specCanonical,
  };
}

export function generateDeterministicArtifacts(spec) {
  const artifact = {
    sqlFilter: "invoice_number IS NOT NULL AND amount IS NOT NULL",
    comparator: {
      type: "composite_match",
      fields: [...spec.matchRules[0].fields].sort(),
      tolerance: spec.matchRules[0].tolerance,
      amount_field: spec.matchRules[0].amount_field,
    },
    reportTemplate: {
      title: "Daily Reconciliation Summary",
      sections: ["match_rate", "mismatches", "review_queue"],
    },
  };
  const canonical = stableStringify(artifact);
  return { artifact, artifact_hash: sha256(canonical), canonical };
}

export function createRunSignature({ inputDataHash, specHash, outputHash }) {
  return {
    engine_version: ENGINE_VERSION,
    run_signature: sha256(`${inputDataHash}:${specHash}:${ENGINE_VERSION}`),
    output_hash: outputHash,
  };
}
