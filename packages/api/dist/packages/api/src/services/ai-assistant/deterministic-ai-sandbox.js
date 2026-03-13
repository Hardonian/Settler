"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deterministicAISandbox = exports.DeterministicAISandbox = void 0;
const crypto_1 = require("crypto");
const canonical_input_1 = require("../determinism/canonical-input");
const DEFAULT_MODELS = {
    openai: "gpt-4o-mini",
    anthropic: "claude-3-5-haiku",
    local: "llama3.1:8b",
    mcp: "mcp:default",
};
const POLICY_BLOCKLIST = [
    "disable rls",
    "skip policy",
    "ignore deterministic",
    "bypass audit",
    "turn off validation",
];
const MAX_PROMPT_LENGTH = 1000;
class DeterministicAISandbox {
    execute(request) {
        const normalizedPrompt = request.prompt.trim();
        this.policyReview(normalizedPrompt);
        const selection = this.selectModel(request.preferredProvider, request.preferredModel);
        const draft = this.generateDraft(selection, normalizedPrompt, request.context);
        this.validateDraft(draft);
        const responseHash = (0, crypto_1.createHash)("sha256")
            .update((0, canonical_input_1.stableStringify)({
            prompt: normalizedPrompt,
            provider: draft.provider,
            model: draft.model,
            answer: draft.answer,
            workflowSuggestions: draft.workflowSuggestions,
            policyRecommendations: draft.policyRecommendations,
            anomalies: draft.anomalies,
        }))
            .digest("hex");
        return {
            ...draft,
            responseHash,
        };
    }
    selectModel(provider, model) {
        const selectedProvider = provider ?? "local";
        const defaultModel = DEFAULT_MODELS[selectedProvider];
        if (!model || model.trim().length === 0) {
            return { provider: selectedProvider, model: defaultModel };
        }
        if (selectedProvider === "mcp" && !model.startsWith("mcp:")) {
            return { provider: selectedProvider, model: `mcp:${model}` };
        }
        return { provider: selectedProvider, model };
    }
    policyReview(prompt) {
        if (prompt.length === 0 || prompt.length > MAX_PROMPT_LENGTH) {
            throw new Error("Prompt length violates policy constraints");
        }
        const lowered = prompt.toLowerCase();
        for (const blocked of POLICY_BLOCKLIST) {
            if (lowered.includes(blocked)) {
                throw new Error(`Prompt violates policy review: contains forbidden directive '${blocked}'`);
            }
        }
    }
    generateDraft(selection, prompt, context) {
        const lowered = prompt.toLowerCase();
        const workflowSuggestions = this.buildWorkflowSuggestions(lowered, context);
        const policyRecommendations = this.buildPolicyRecommendations(lowered);
        const anomalies = this.buildAnomalySignals(lowered, context);
        const answer = [
            `Model ${selection.model} (${selection.provider}) produced deterministic guidance for operator execution.`,
            `Focus areas: workflow suggestions (${workflowSuggestions.length}), policy recommendations (${policyRecommendations.length}), anomalies (${anomalies.length}).`,
            "All AI output passed deterministic validation and policy review prior to release.",
        ].join(" ");
        return {
            answer,
            workflowSuggestions,
            policyRecommendations,
            anomalies,
            provider: selection.provider,
            model: selection.model,
        };
    }
    validateDraft(draft) {
        if (!draft.answer || draft.answer.length < 30) {
            throw new Error("Deterministic validation failed: answer is incomplete");
        }
        if (draft.workflowSuggestions.length === 0) {
            throw new Error("Deterministic validation failed: workflow suggestions missing");
        }
        if (draft.policyRecommendations.length === 0) {
            throw new Error("Deterministic validation failed: policy recommendations missing");
        }
    }
    buildWorkflowSuggestions(loweredPrompt, context) {
        const suggestions = [
            {
                title: "Run staged validation before enqueue",
                rationale: "Deterministic checks prevent malformed workflows from reaching execution.",
                action: "Execute dry-run validation and reject plans with non-repeatable steps.",
            },
        ];
        if (context?.jobId) {
            suggestions.push({
                title: "Replay latest deterministic snapshot",
                rationale: `Job ${context.jobId} can be validated against a known-good state before rollout.`,
                action: "Run replay with canonical inputs and compare response hash chain before promoting.",
            });
        }
        if (context?.adapter || loweredPrompt.includes("adapter")) {
            suggestions.push({
                title: "Validate adapter contracts",
                rationale: "Contract drift between source and target adapters causes nondeterministic outcomes.",
                action: "Pin adapter versions and run schema compatibility checks for each workflow run.",
            });
        }
        return suggestions;
    }
    buildPolicyRecommendations(loweredPrompt) {
        const recommendations = [
            {
                policy: "deterministic-output-gate",
                reason: "All AI responses must be canonicalized and hashed before they influence execution.",
                enforcement: "required",
            },
            {
                policy: "human-policy-review",
                reason: "Operator confirmation is required before policy-impacting suggestions are enacted.",
                enforcement: "required",
            },
        ];
        if (loweredPrompt.includes("tenant") || loweredPrompt.includes("workspace")) {
            recommendations.push({
                policy: "tenant-isolation-check",
                reason: "Cross-tenant suggestions are blocked unless context proves ownership boundaries.",
                enforcement: "required",
            });
        }
        recommendations.sort((a, b) => a.policy.localeCompare(b.policy));
        return recommendations;
    }
    buildAnomalySignals(loweredPrompt, context) {
        const anomalies = [];
        if (context?.error || loweredPrompt.includes("error") || loweredPrompt.includes("failed")) {
            anomalies.push({
                type: "error_spike",
                severity: "high",
                reason: "Error-focused requests indicate potential spike in failed workflow executions.",
                mitigation: "Run failure triage and quarantine high-risk workflow paths until replay succeeds.",
            });
        }
        if (loweredPrompt.includes("policy") || loweredPrompt.includes("override")) {
            anomalies.push({
                type: "policy_drift",
                severity: "medium",
                reason: "Prompt requests include policy-sensitive operations that can diverge from approved controls.",
                mitigation: "Require dual-review for policy changes and maintain immutable approval events.",
            });
        }
        if (context?.adapter && loweredPrompt.includes("optimize")) {
            anomalies.push({
                type: "execution_drift",
                severity: "low",
                reason: "Adapter-specific optimization can shift matching outcomes over time.",
                mitigation: "Monitor deterministic replay deltas for the adapter after each optimization cycle.",
            });
        }
        return anomalies;
    }
}
exports.DeterministicAISandbox = DeterministicAISandbox;
exports.deterministicAISandbox = new DeterministicAISandbox();
//# sourceMappingURL=deterministic-ai-sandbox.js.map