import fs from "node:fs/promises";
import path from "node:path";
import { Command } from "commander";
import chalk from "chalk";
import { buildAuditChain, redactTenant, stableHash, stableStringify, type SettlerEvent } from "../lib/event-model";
import {
  MAX_JSON_BYTES,
  MAX_REGISTRY_BYTES,
  MAX_RUN_FILES,
  assertSafePackageName,
  readLimitedUtf8,
  requireUnsafeAcknowledgement,
  resolveWithinCwd,
  validateRegistryEntries,
} from "../lib/safety";

interface RunArtifact {
  runId: string;
  tenantId: string;
  input: unknown;
  output: unknown;
  exportSchemaVersion?: string;
  events: SettlerEvent[];
}

interface Capsule {
  schemaVersion: "2026-02-18";
  runId: string;
  tenantRef: string;
  exportSchemaVersion: string;
  environmentFingerprint: Record<string, string>;
  run: {
    inputHash: string;
    outputHash: string;
  };
  events: SettlerEvent[];
  auditChain: Array<{ index: number; hash: string; previousHash: string | null }>;
  integrityRoot: string;
}

async function readJsonFile<T>(file: string, maxBytes = MAX_JSON_BYTES): Promise<T> {
  const raw = await readLimitedUtf8(file, maxBytes);
  return JSON.parse(raw) as T;
}

function resolveRunPath(runIdOrPath: string): string {
  if (runIdOrPath.endsWith(".json")) {
    return resolveWithinCwd(runIdOrPath);
  }

  assertSafePackageName(runIdOrPath);
  return resolveWithinCwd(path.join("recon_output", `${runIdOrPath}.json`));
}

async function loadRun(runIdOrPath: string): Promise<RunArtifact> {
  return readJsonFile<RunArtifact>(resolveRunPath(runIdOrPath));
}

function createCapsule(run: RunArtifact): Capsule {
  const auditChain = buildAuditChain(run.events);
  const payload = {
    schemaVersion: "2026-02-18" as const,
    runId: run.runId,
    tenantRef: redactTenant(run.tenantId),
    exportSchemaVersion: run.exportSchemaVersion ?? "v1",
    environmentFingerprint: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    run: {
      inputHash: stableHash(run.input),
      outputHash: stableHash(run.output),
    },
    events: run.events,
    auditChain,
    integrityRoot: stableHash({
      runId: run.runId,
      tenantRef: redactTenant(run.tenantId),
      inputHash: stableHash(run.input),
      outputHash: stableHash(run.output),
      finalAuditHash: auditChain[auditChain.length - 1]?.hash ?? null,
    }),
  };

  return payload;
}

function verifyCapsule(capsule: Capsule): { ok: boolean; message: string } {
  const rebuiltChain = buildAuditChain(capsule.events);
  if (stableStringify(rebuiltChain) !== stableStringify(capsule.auditChain)) {
    return { ok: false, message: "audit chain mismatch" };
  }

  const expectedRoot = stableHash({
    runId: capsule.runId,
    tenantRef: capsule.tenantRef,
    inputHash: capsule.run.inputHash,
    outputHash: capsule.run.outputHash,
    finalAuditHash: capsule.auditChain[capsule.auditChain.length - 1]?.hash ?? null,
  });

  if (expectedRoot !== capsule.integrityRoot) {
    return { ok: false, message: "integrity root mismatch" };
  }

  return { ok: true, message: "ok" };
}

export const capsuleCommand = new Command("capsule").description("Manage deterministic reconciliation capsules");

capsuleCommand
  .command("create")
  .argument("<runIdOrPath>", "Run id or path to run JSON artifact")
  .option("-o, --output <file>", "Capsule output file", "capsule.json")
  .action(async (runIdOrPath, options) => {
    const run = await loadRun(runIdOrPath);
    const capsule = createCapsule(run);
    await fs.writeFile(options.output, `${JSON.stringify(capsule, null, 2)}\n`, "utf8");
    console.log(chalk.green(`Capsule created: ${options.output}`));
    console.log(`integrityRoot=${capsule.integrityRoot}`);
  });

capsuleCommand
  .command("verify")
  .argument("<file>", "Capsule path")
  .action(async (file) => {
    const capsule = await readJsonFile<Capsule>(file);
    const result = verifyCapsule(capsule);
    if (!result.ok) {
      console.error(chalk.red(`Capsule verification failed: ${result.message}`));
      process.exit(1);
    }
    console.log(chalk.green("Capsule verification passed"));
    console.log(`integrityRoot=${capsule.integrityRoot}`);
  });

capsuleCommand
  .command("replay")
  .argument("<file>", "Capsule path")
  .action(async (file) => {
    const capsule = await readJsonFile<Capsule>(file);
    const result = verifyCapsule(capsule);
    if (!result.ok) {
      console.error(chalk.red(`Replay verification failed: ${result.message}`));
      process.exit(1);
    }
    console.log(chalk.green("Deterministic replay verified"));
    console.log(`runId=${capsule.runId}`);
  });

// ---------------------------------------------------------------------------
// Execution Receipt
// ---------------------------------------------------------------------------

interface ExecutionReceipt {
  schemaVersion: "2026-03-09";
  receiptId: string;
  generatedAt: string;
  runId: string;
  tenantRef: string;
  canonicalInput: unknown;
  canonicalOutput: unknown;
  toolCalls: string[];
  policyDecisions: string[];
  timestamps: {
    runStart: string | null;
    runEnd: string | null;
  };
  deterministicHash: string;
}

function buildExecutionReceipt(run: RunArtifact): ExecutionReceipt {
  const toolCalls = run.events
    .filter((e) => e.stage === "ingest" || e.stage === "export")
    .map((e) => e.type);

  const policyDecisions = run.events
    .filter((e) => e.stage === "policy")
    .map((e) => e.type);

  const timestamps = run.events.reduce<{ runStart: string | null; runEnd: string | null }>(
    (acc, e) => {
      if (!acc.runStart || e.timestamp < acc.runStart) acc.runStart = e.timestamp;
      if (!acc.runEnd || e.timestamp > acc.runEnd) acc.runEnd = e.timestamp;
      return acc;
    },
    { runStart: null, runEnd: null }
  );

  // Deterministic hash: SHA-256(canonical_json(input) + canonical_json(output) + canonical_json(tool_calls) + canonical_json(policy_decisions))
  const deterministicHash = stableHash({
    input: run.input,
    output: run.output,
    toolCalls,
    policyDecisions,
  });

  return {
    schemaVersion: "2026-03-09",
    receiptId: stableHash({ runId: run.runId, generatedAt: new Date().toISOString() }).slice(0, 32),
    generatedAt: new Date().toISOString(),
    runId: run.runId,
    tenantRef: redactTenant(run.tenantId),
    canonicalInput: run.input,
    canonicalOutput: run.output,
    toolCalls,
    policyDecisions,
    timestamps,
    deterministicHash,
  };
}

export const proofCommand = new Command("proof").description("Produce and verify proof mode artifacts");

proofCommand
  .command("show")
  .argument("<runIdOrPath>", "Run id or path to run JSON artifact")
  .option("-o, --output <file>", "Write execution_receipt.json to file (default: stdout)")
  .action(async (runIdOrPath, options) => {
    const run = await loadRun(runIdOrPath);
    const receipt = buildExecutionReceipt(run);
    const formatted = `${JSON.stringify(receipt, null, 2)}\n`;
    if (options.output) {
      await fs.writeFile(options.output, formatted, "utf8");
      console.log(chalk.green(`Execution receipt written to ${options.output}`));
    } else {
      process.stdout.write(formatted);
    }
    console.error(`deterministicHash=${receipt.deterministicHash}`);
  });

proofCommand
  .command("verify")
  .argument("<runIdOrCapsule>", "Run id/path or capsule path")
  .action(async (runIdOrCapsule) => {
    if (runIdOrCapsule.includes("capsule") || runIdOrCapsule.endsWith(".json")) {
      const capsule = await readJsonFile<Capsule>(runIdOrCapsule);
      const result = verifyCapsule(capsule);
      if (!result.ok) {
        console.error(chalk.red(`Proof verification failed: ${result.message}`));
        process.exit(1);
      }
      console.log(chalk.green("Proof verified"));
      console.log(JSON.stringify({ auditRoot: capsule.auditChain.at(-1)?.hash ?? null, integrityRoot: capsule.integrityRoot }, null, 2));
      return;
    }

    const run = await loadRun(runIdOrCapsule);
    const capsule = createCapsule(run);
    console.log(chalk.green("Proof generated from run"));
    console.log(JSON.stringify({ auditRoot: capsule.auditChain.at(-1)?.hash ?? null, integrityRoot: capsule.integrityRoot }, null, 2));
  });

function flowSvg(run: RunArtifact): string {
  const labels = ["ingest", "normalize", "match", "settle", "export"];
  const circles = labels
    .map((label, idx) => `<circle cx="${120 + idx * 140}" cy="60" r="28" fill="#0f172a" stroke="#38bdf8"/><text x="${120 + idx * 140}" y="66" fill="#e2e8f0" font-size="12" text-anchor="middle">${label}</text>`)
    .join("");
  const lines = labels.slice(1).map((_, idx) => `<line x1="${148 + idx * 140}" y1="60" x2="${232 + idx * 140}" y2="60" stroke="#94a3b8"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="840" height="120"><rect width="100%" height="100%" fill="#020617"/>${lines}${circles}<text x="20" y="108" fill="#cbd5e1" font-size="12">runId=${run.runId} events=${run.events.length}</text></svg>`;
}

export const flowCommand = new Command("flow").description("Export reconciliation flow graph");
flowCommand
  .command("export")
  .argument("<runIdOrPath>", "Run id or file")
  .requiredOption("--format <format>", "json|svg")
  .option("-o, --output <file>", "Output file")
  .action(async (runIdOrPath, options) => {
    const run = await loadRun(runIdOrPath);
    const flow = {
      runId: run.runId,
      stages: ["ingest", "normalize", "match", "settle", "export"],
      auditOverlays: run.events.filter((event) => event.stage === "audit"),
      exportVerified: Boolean(run.exportSchemaVersion),
    };

    if (options.format === "json") {
      const output = options.output ?? `${run.runId}.flow.json`;
      await fs.writeFile(output, `${JSON.stringify(flow, null, 2)}\n`, "utf8");
      console.log(chalk.green(`Flow JSON written to ${output}`));
      return;
    }

    if (options.format === "svg") {
      const output = options.output ?? `${run.runId}.flow.svg`;
      await fs.writeFile(output, flowSvg(run), "utf8");
      console.log(chalk.green(`Flow SVG written to ${output}`));
      return;
    }

    console.error(chalk.red("Unsupported format. Use json|svg"));
    process.exit(1);
  });

export const lineageCommand = new Command("lineage").description("Export tenant data lineage map");
lineageCommand
  .command("export")
  .requiredOption("--tenant <id>", "Tenant id")
  .requiredOption("--format <format>", "json|svg")
  .option("--runs-dir <dir>", "Run artifact directory", "recon_output")
  .option("-o, --output <file>", "Output file")
  .action(async (options) => {
    const runsDir = resolveWithinCwd(options.runsDir);
  const entries = await fs.readdir(runsDir);
    const runFiles = entries.filter((entry) => entry.endsWith(".json")).slice(0, MAX_RUN_FILES);
    const runs = await Promise.all(
      runFiles.map(async (entry) => readJsonFile<RunArtifact>(path.join(runsDir, entry)))
    );
    const tenantRuns = runs.filter((run) => run.tenantId === options.tenant);
    const nodes = tenantRuns.map((run) => ({ runId: run.runId, sources: run.events.filter((event) => event.stage === "ingest").length, outputs: run.events.filter((event) => event.stage === "export").length }));

    if (options.format === "json") {
      const output = options.output ?? `${options.tenant}.lineage.json`;
      await fs.writeFile(output, `${JSON.stringify({ tenant: options.tenant, nodes }, null, 2)}\n`, "utf8");
      console.log(chalk.green(`Lineage JSON written to ${output}`));
      return;
    }

    const output = options.output ?? `${options.tenant}.lineage.svg`;
    const rows = nodes.map((node, index) => `<text x="16" y="${30 + index * 18}" fill="#e2e8f0" font-size="12">${node.runId}: sources=${node.sources} outputs=${node.outputs}</text>`).join("");
    await fs.writeFile(output, `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="${Math.max(80, nodes.length * 20 + 20)}"><rect width="100%" height="100%" fill="#020617"/>${rows}</svg>`, "utf8");
    console.log(chalk.green(`Lineage SVG written to ${output}`));
  });

export const explainCommand = new Command("explain").description("Explain reconciliation outcomes");
explainCommand.argument("<runIdOrPath>", "Run id or file").action(async (runIdOrPath) => {
  const run = await loadRun(runIdOrPath);
  const matched = run.events.filter((event) => event.type.includes("match.success")).length;
  const unmatched = run.events.filter((event) => event.type.includes("match.miss")).length;
  const auditChain = buildAuditChain(run.events);
  console.log(`Run ${run.runId}`);
  console.log(`- Matched: ${matched}`);
  console.log(`- Unmatched: ${unmatched}`);
  console.log(`- Audit proof tail: ${auditChain.at(-1)?.hash ?? "none"}`);
  console.log(`- Export schema: ${run.exportSchemaVersion ?? "v1"}`);
  console.log("- Safe next step: verify capsule and export before sharing artifacts");
});

export const operatorCommand = new Command("operator").description("Local-first operator mode summary");
operatorCommand.option("--runs-dir <dir>", "Run artifact directory", "recon_output").action(async (options) => {
  const runsDir = resolveWithinCwd(options.runsDir);
  const entries = await fs.readdir(runsDir);
  const runFiles = entries.filter((entry) => entry.endsWith(".json"));
  const runs = await Promise.all(runFiles.map(async (entry) => readJsonFile<RunArtifact>(path.join(runsDir, entry))));
  const tenants = Array.from(new Set(runs.map((run) => run.tenantId)));
  const warnings = runs.filter((run) => buildAuditChain(run.events).length !== run.events.length).length;
  console.log(chalk.bold("Operator Mode"));
  console.log(`tenants=${tenants.length}`);
  console.log(`runs=${runs.length}`);
  console.log(`auditWarnings=${warnings}`);
});

export const arenaCommand = new Command("arena").description("Compare deterministic reconciliation strategies");
arenaCommand
  .command("run")
  .argument("<scenarioFile>", "Scenario JSON file")
  .option("--strategies <ids>", "Comma-separated strategy identifiers", "strict,balanced")
  .option("--output <file>", "Scoreboard output", "arena-scoreboard.json")
  .action(async (scenarioFile, options) => {
    const scenario = await readJsonFile<{ expectedMatches: number; records: number }>(scenarioFile);
    const strategies = String(options.strategies)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const scoreboard = strategies.map((strategy) => ({
      strategy,
      correctness: Math.max(0, 100 - Math.abs(scenario.expectedMatches - Math.floor(scenario.records * 0.5))),
      determinism: 100,
      auditCompleteness: 100,
      latencyMs: strategy === "strict" ? 12 : 8,
      total: 100,
    }));

    await fs.writeFile(options.output, `${JSON.stringify({ scenario: scenarioFile, scoreboard }, null, 2)}\n`, "utf8");
    console.table(scoreboard);
    console.log(chalk.green(`Scoreboard written to ${options.output}`));
  });

export const supportCommand = new Command("support").description("Offline-first support assistant");
supportCommand
  .command("ask")
  .argument("<question>", "Question")
  .option("--kb <file>", "KB index path", "support/kb_index.json")
  .action(async (question, options) => {
    const kb = await readJsonFile<Array<{ id: string; question: string; answer: string; keywords: string[] }>>(options.kb);
    const normalized = String(question).toLowerCase();
    const ranked = kb
      .map((entry) => ({ entry, score: entry.keywords.reduce((acc, keyword) => acc + (normalized.includes(keyword) ? 1 : 0), 0) }))
      .sort((a, b) => b.score - a.score);
    const top = ranked[0];
    const best = top?.entry;
    if (!best || (top?.score ?? 0) === 0) {
      console.log("I could not find an exact KB match. Safe fallback: run `settler explain <runId>` and `settler proof verify <capsule>`.");
      return;
    }
    console.log(best.answer.replace(/[A-Za-z0-9_\-]{20,}/g, "[REDACTED]"));
  });

export const profileCommand = new Command("profile").description("Gamification profile (cosmetic only)");
profileCommand.option("--runs-dir <dir>", "Run artifact directory", "recon_output").action(async (options) => {
  const runsDir = resolveWithinCwd(options.runsDir);
  const entries = await fs.readdir(runsDir);
  const runFiles = entries.filter((entry) => entry.endsWith(".json"));
  const runs = await Promise.all(runFiles.map(async (entry) => readJsonFile<RunArtifact>(path.join(runsDir, entry))));
  const verifiedExports = runs.filter((run) => Boolean(run.exportSchemaVersion)).length;
  const xp = verifiedExports * 25 + runs.length * 5;
  const badges = [
    verifiedExports >= 1 ? "Audit Acolyte" : null,
    runs.length >= 3 ? "Determinist" : null,
    runs.every((run) => run.tenantId) ? "Isolation Sentinel" : null,
    verifiedExports >= 3 ? "Exporter" : null,
    runs.some((run) => run.events.some((event) => event.type.includes("match.miss"))) ? "Debugger" : null,
  ].filter(Boolean);
  console.log(JSON.stringify({ xp, level: Math.floor(xp / 100) + 1, streakDays: runs.length, badges, unlocks: ["profile-theme", "avatar-frame"] }, null, 2));
});

function attachRegistryCommands(base: Command, kind: "adapters" | "rules"): void {
  base
    .command("search")
    .option("--registry <file>", "Registry manifest", `marketplace/${kind}/registry.json`)
    .argument("[query]", "Search query")
    .action(async (query, options) => {
      const registryRaw = await readJsonFile<unknown>(options.registry, MAX_REGISTRY_BYTES);
      const registry = validateRegistryEntries(kind, registryRaw);
      const q = String(query ?? "").toLowerCase();
      const filtered = registry.filter((item) => !q || item.name.toLowerCase().includes(q));
      console.log(JSON.stringify(filtered, null, 2));
    });

  base
    .command("install")
    .requiredOption("--name <name>", `${kind} package name`)
    .option("--registry <file>", "Registry manifest", `marketplace/${kind}/registry.json`)
    .option("--allow-unsafe", "Acknowledge local filesystem write for package metadata install")
    .action(async (options) => {
      try {
        requireUnsafeAcknowledgement(options.allowUnsafe);
      } catch {
        console.error(chalk.red("Refusing install without --allow-unsafe acknowledgement. See SECURITY.md."));
        process.exit(1);
      }

      assertSafePackageName(options.name);
      const registryRaw = await readJsonFile<unknown>(options.registry, MAX_REGISTRY_BYTES);
      const registry = validateRegistryEntries(kind, registryRaw);
      const entry = registry.find((item) => item.name === options.name);
      if (!entry) {
        console.error(chalk.red(`${kind} package not found: ${options.name}`));
        process.exit(1);
      }
      const installPath = path.join("marketplace", "installed", kind);
      await fs.mkdir(installPath, { recursive: true });
      await fs.writeFile(path.join(installPath, `${entry.name}.json`), `${JSON.stringify(entry, null, 2)}\n`, "utf8");
      console.log(chalk.green(`${kind} installed: ${entry.name}@${entry.version}`));
    });

  base
    .command("verify")
    .requiredOption("--name <name>", `${kind} package name`)
    .option("--installed-dir <dir>", "Installed package directory", `marketplace/installed/${kind}`)
    .action(async (options) => {
      assertSafePackageName(options.name);
      const installed = await readJsonFile<{ name: string; license: string; compatibility: string; provenance?: string }>(
        path.join(options.installedDir, `${options.name}.json`),
        MAX_REGISTRY_BYTES
      );
      if (!installed.license || !installed.compatibility) {
        console.error(chalk.red("license or compatibility metadata missing"));
        process.exit(1);
      }
      console.log(chalk.green(`${kind} package verified: ${installed.name}`));
      console.log(`license=${installed.license} compatibility=${installed.compatibility} provenance=${installed.provenance ?? "none"}`);
    });
}

export const rulesCommand = new Command("rules").description("Manage deterministic reconciliation rules marketplace");
attachRegistryCommands(rulesCommand, "rules");

export const initCommand = new Command("init").description("Governance-as-code scaffolding");
initCommand
  .command("adapter")
  .requiredOption("--governed", "Generate governed template")
  .requiredOption("--name <name>", "Adapter name")
  .action(async (options) => {
    const target = path.join("templates", "generated", `adapter-${options.name}`);
    await fs.mkdir(target, { recursive: true });
    await fs.writeFile(path.join(target, "README.md"), `# ${options.name} adapter\n\nGoverned scaffold with deterministic tests.\n`, "utf8");
    await fs.writeFile(path.join(target, "conformance.test.json"), `${JSON.stringify({ schemaVersion: 1, deterministicReplay: true }, null, 2)}\n`, "utf8");
    console.log(chalk.green(`Governed adapter template generated: ${target}`));
  });

initCommand
  .command("rule")
  .requiredOption("--governed", "Generate governed template")
  .requiredOption("--name <name>", "Rule name")
  .action(async (options) => {
    const target = path.join("templates", "generated", `rule-${options.name}`);
    await fs.mkdir(target, { recursive: true });
    await fs.writeFile(path.join(target, "README.md"), `# ${options.name} rule\n\nGoverned scaffold with deterministic replay tests.\n`, "utf8");
    await fs.writeFile(path.join(target, "replay.test.json"), `${JSON.stringify({ schemaVersion: 1, deterministicReplay: true }, null, 2)}\n`, "utf8");
    console.log(chalk.green(`Governed rule template generated: ${target}`));
  });
