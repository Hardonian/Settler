#!/usr/bin/env node
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const policyPath = path.join(repoRoot, "config", "root-policy.json");

function parseArgs(argv) {
  return {
    json: argv.includes("--json"),
    listAllowed: argv.includes("--list-allowed"),
  };
}

function loadPolicy() {
  const raw = readFileSync(policyPath, "utf8");
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed.allowedEntries)) {
    throw new Error("config/root-policy.json must define an allowedEntries array.");
  }

  return {
    policyDoc: parsed.policyDoc ?? "docs/repo/ROOT_POLICY.md",
    allowed: new Set(parsed.allowedEntries),
    blockedExtensions: Array.isArray(parsed.blockedExtensions) ? parsed.blockedExtensions : [],
    clutterMatchers: (Array.isArray(parsed.localClutterPatterns)
      ? parsed.localClutterPatterns
      : []
    ).map((pattern) => new RegExp(pattern)),
  };
}

function rootEntries() {
  return readdirSync(repoRoot, { withFileTypes: true })
    .map((entry) => entry.name)
    .filter((name) => name !== ".git" && name !== "node_modules")
    .sort((a, b) => a.localeCompare(b));
}

function formatList(title, items) {
  if (items.length === 0) return "";
  const lines = items.map((item) => `  - ${item}`).join("\n");
  return `\n${title}\n${lines}`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const policy = loadPolicy();
  const entries = rootEntries();

  const blocked = entries.filter((name) =>
    policy.blockedExtensions.some((ext) => name.toLowerCase().endsWith(ext.toLowerCase()))
  );

  const unknown = entries.filter((name) => !policy.allowed.has(name));
  const clutter = unknown.filter((name) =>
    policy.clutterMatchers.some((matcher) => matcher.test(name))
  );
  const unexpected = unknown.filter((name) => !clutter.includes(name));

  if (args.listAllowed) {
    for (const item of [...policy.allowed].sort((a, b) => a.localeCompare(b))) {
      console.log(item);
    }
    return;
  }

  const payload = {
    policyPath: path.relative(repoRoot, policyPath),
    policyDoc: policy.policyDoc,
    checkedEntries: entries.length,
    blocked,
    clutter,
    unexpected,
  };

  if (args.json) {
    console.log(JSON.stringify(payload, null, 2));
  }

  // Clutter entries are local/generated files (e.g. .env.local, target/) that are
  // gitignored and should not block CI or push — warn only.
  if (clutter.length) {
    console.warn(formatList("⚠️  Local clutter detected (gitignored, non-blocking):", clutter));
  }

  if (blocked.length || unexpected.length) {
    console.error("\n❌ Root cleanliness policy check failed.");
    console.error(`Policy source: ${payload.policyPath}`);
    console.error(`Policy docs: ${payload.policyDoc}`);

    if (blocked.length) {
      console.error(
        formatList("Blocked artifact extensions at repo root (must be removed):", blocked)
      );
    }

    if (unexpected.length) {
      console.error(
        formatList(
          "Unexpected root entries (either relocate or allowlist intentionally):",
          unexpected
        )
      );
    }

    console.error("\nRemediation:");
    console.error("  1) Move new project files into existing root directories where possible.");
    console.error(
      "  2) Update config/root-policy.json only for intentional, durable root entries."
    );
    console.error("  3) Re-run: pnpm run verify:root");
    process.exit(1);
  }

  console.log(`✅ Root cleanliness check passed (${entries.length} entries checked).`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
