/**
 * settler policy — Policy Simulation Engine
 *
 * Phase 8: Safe simulation of governance rules against historical runs.
 *
 * Usage:
 *   settler policy simulate --policy <file> --runs-dir <dir>
 *   settler policy list --runs-dir <dir>
 *
 * Policy file format (JSON):
 * {
 *   "id": "pol-001",
 *   "name": "Min Match Rate 95%",
 *   "rules": [
 *     { "field": "matchRate", "operator": "gte", "value": 0.95 }
 *   ]
 * }
 *
 * Output:
 *   impacted executions, policy conflicts, risk summary
 */

import fs from "node:fs/promises";
import path from "node:path";
import { Command } from "commander";
import chalk from "chalk";
import { resolveWithinCwd, readLimitedUtf8, MAX_JSON_BYTES, MAX_RUN_FILES } from "../lib/safety";
import { stableHash } from "../lib/event-model";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Operator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "not_contains";

interface PolicyRule {
  field: string;
  operator: Operator;
  value: unknown;
}

interface PolicyDefinition {
  id: string;
  name: string;
  description?: string;
  rules: PolicyRule[];
}

interface RunSummary {
  runId: string;
  tenantId: string;
  matchRate?: number;
  totalRecords?: number;
  matchedRecords?: number;
  status?: string;
  [key: string]: unknown;
}

interface SimulationResult {
  policyId: string;
  policyName: string;
  simulationHash: string;
  totalRuns: number;
  impactedRuns: string[];
  passingRuns: string[];
  conflicts: Array<{ runId: string; failedRules: string[] }>;
  riskSummary: {
    impactRate: number;
    highRisk: boolean;
    recommendation: string;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function evaluateRule(rule: PolicyRule, run: RunSummary): boolean {
  const fieldValue = run[rule.field];
  if (fieldValue === undefined) return false;

  switch (rule.operator) {
    case "eq":
      return fieldValue === rule.value;
    case "neq":
      return fieldValue !== rule.value;
    case "gt":
      return typeof fieldValue === "number" && fieldValue > (rule.value as number);
    case "gte":
      return typeof fieldValue === "number" && fieldValue >= (rule.value as number);
    case "lt":
      return typeof fieldValue === "number" && fieldValue < (rule.value as number);
    case "lte":
      return typeof fieldValue === "number" && fieldValue <= (rule.value as number);
    case "contains":
      return typeof fieldValue === "string" && fieldValue.includes(String(rule.value));
    case "not_contains":
      return typeof fieldValue === "string" && !fieldValue.includes(String(rule.value));
    default:
      return false;
  }
}

function isPolicyDefinition(value: unknown): value is PolicyDefinition {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p.id === "string" &&
    typeof p.name === "string" &&
    Array.isArray(p.rules)
  );
}

function isRunSummary(value: unknown): value is RunSummary {
  if (!value || typeof value !== "object") return false;
  const r = value as Record<string, unknown>;
  return typeof r.runId === "string" || typeof r.id === "string";
}

async function loadRunSummaries(runsDir: string): Promise<RunSummary[]> {
  let entries: string[];
  try {
    entries = await fs.readdir(runsDir);
  } catch {
    return [];
  }

  const runFiles = entries.filter((e) => e.endsWith(".json")).slice(0, MAX_RUN_FILES);
  const summaries: RunSummary[] = [];

  for (const entry of runFiles) {
    try {
      const raw = await readLimitedUtf8(path.join(runsDir, entry), MAX_JSON_BYTES);
      const parsed: unknown = JSON.parse(raw);
      if (isRunSummary(parsed)) {
        const run = parsed as Record<string, unknown>;
        summaries.push({
          ...run,
          runId: (run.runId ?? run.id) as string,
        } as RunSummary);
      }
    } catch {
      // Skip malformed files
    }
  }

  return summaries;
}

function simulate(policy: PolicyDefinition, runs: RunSummary[]): SimulationResult {
  const conflicts: Array<{ runId: string; failedRules: string[] }> = [];
  const impactedRuns: string[] = [];
  const passingRuns: string[] = [];

  for (const run of runs) {
    const failedRules: string[] = [];
    for (const rule of policy.rules) {
      const passes = evaluateRule(rule, run);
      if (!passes) {
        failedRules.push(`${rule.field} ${rule.operator} ${JSON.stringify(rule.value)}`);
      }
    }

    if (failedRules.length > 0) {
      impactedRuns.push(run.runId);
      conflicts.push({ runId: run.runId, failedRules });
    } else {
      passingRuns.push(run.runId);
    }
  }

  const impactRate = runs.length > 0 ? impactedRuns.length / runs.length : 0;
  const highRisk = impactRate > 0.1; // >10% impact is high risk

  const recommendation =
    impactRate === 0
      ? "Safe to deploy — no historical runs would be rejected."
      : highRisk
      ? `High risk: ${(impactRate * 100).toFixed(1)}% of runs would be rejected. Review policy before deploying.`
      : `Low risk: ${(impactRate * 100).toFixed(1)}% of runs would be rejected. Consider canary rollout.`;

  const simulationHash = stableHash({ policyId: policy.id, rules: policy.rules, runCount: runs.length });

  return {
    policyId: policy.id,
    policyName: policy.name,
    simulationHash,
    totalRuns: runs.length,
    impactedRuns,
    passingRuns,
    conflicts,
    riskSummary: {
      impactRate,
      highRisk,
      recommendation,
    },
  };
}

// ---------------------------------------------------------------------------
// Command
// ---------------------------------------------------------------------------

export const policyCommand = new Command("policy").description(
  "Policy governance simulation engine"
);

policyCommand
  .command("simulate")
  .description("Simulate a policy change against historical runs")
  .requiredOption("--policy <file>", "Path to policy definition JSON file")
  .option("--runs-dir <dir>", "Directory of run JSON artifacts", "recon_output")
  .option("--json", "Output raw JSON result")
  .option("-o, --output <file>", "Write simulation result to file")
  .action(async (options: { policy: string; runsDir: string; json?: boolean; output?: string }) => {
    // Load policy
    let policyRaw: unknown;
    try {
      const content = await readLimitedUtf8(resolveWithinCwd(options.policy), MAX_JSON_BYTES);
      policyRaw = JSON.parse(content);
    } catch (err) {
      console.error(chalk.red(`Failed to load policy file: ${options.policy}`));
      console.error(String(err));
      process.exit(1);
    }

    if (!isPolicyDefinition(policyRaw)) {
      console.error(chalk.red("Policy file is missing required fields: id, name, rules"));
      process.exit(1);
    }

    const policy = policyRaw;
    const runsDir = resolveWithinCwd(options.runsDir);
    const runs = await loadRunSummaries(runsDir);

    if (runs.length === 0) {
      console.log(chalk.yellow(`No run artifacts found in ${runsDir}`));
      console.log("Simulation requires historical run JSON files to evaluate.");
      return;
    }

    const result = simulate(policy, runs);

    if (options.json || options.output) {
      const formatted = `${JSON.stringify(result, null, 2)}\n`;
      if (options.output) {
        await fs.writeFile(resolveWithinCwd(options.output), formatted, "utf8");
        console.log(chalk.green(`Simulation result written to ${options.output}`));
      }
      if (options.json) {
        process.stdout.write(formatted);
      }
      return;
    }

    // Human-readable output
    console.log(chalk.bold(`\nPolicy Simulation: ${result.policyName}`));
    console.log(`policy_id=${result.policyId}`);
    console.log(`simulation_hash=${result.simulationHash}`);
    console.log(`total_runs=${result.totalRuns}`);
    console.log(`passing=${result.passingRuns.length}  impacted=${result.impactedRuns.length}`);
    console.log();

    if (result.conflicts.length > 0) {
      console.log(chalk.yellow("Impacted Executions:"));
      for (const conflict of result.conflicts.slice(0, 10)) {
        console.log(`  run=${conflict.runId}`);
        for (const rule of conflict.failedRules) {
          console.log(`    FAIL: ${rule}`);
        }
      }
      if (result.conflicts.length > 10) {
        console.log(`  ... and ${result.conflicts.length - 10} more`);
      }
      console.log();
    }

    const riskColor = result.riskSummary.highRisk ? chalk.red : chalk.green;
    console.log(chalk.bold("Risk Summary"));
    console.log(`  impact_rate=${(result.riskSummary.impactRate * 100).toFixed(2)}%`);
    console.log(`  high_risk=${result.riskSummary.highRisk}`);
    console.log(riskColor(`  ${result.riskSummary.recommendation}`));
  });

policyCommand
  .command("validate")
  .description("Validate a policy definition file structure")
  .argument("<file>", "Path to policy JSON file")
  .action(async (file: string) => {
    let policyRaw: unknown;
    try {
      const content = await readLimitedUtf8(resolveWithinCwd(file), MAX_JSON_BYTES);
      policyRaw = JSON.parse(content);
    } catch (err) {
      console.error(chalk.red(`Failed to parse policy file: ${file}`));
      console.error(String(err));
      process.exit(1);
    }

    if (!isPolicyDefinition(policyRaw)) {
      console.error(chalk.red("Invalid policy: missing required fields (id, name, rules)"));
      process.exit(1);
    }

    const policy = policyRaw;
    const validOperators: Operator[] = ["eq", "neq", "gt", "gte", "lt", "lte", "contains", "not_contains"];
    const invalidRules = policy.rules.filter(
      (r) => !r.field || !validOperators.includes(r.operator as Operator)
    );

    if (invalidRules.length > 0) {
      console.error(chalk.red(`Invalid rules: ${invalidRules.map((r) => r.field).join(", ")}`));
      process.exit(1);
    }

    console.log(chalk.green(`Policy valid: ${policy.name} (${policy.rules.length} rules)`));
  });
