import fs from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import { Command } from "commander";

import Settler from "@settler/sdk";
import type { Adapter } from "@settler/sdk";
import {
  MAX_REGISTRY_BYTES,
  assertSafePackageName,
  readLimitedUtf8,
  validateRegistryEntries,
  requireUnsafeAcknowledgement,
  resolveWithinCwd,
} from "../lib/safety";

async function readRegistry(file: string) {
  const raw = await readLimitedUtf8(file, MAX_REGISTRY_BYTES);
  const parsed = JSON.parse(raw) as unknown;
  return validateRegistryEntries("adapters", parsed);
}

const adaptersCommand = new Command("adapters");

adaptersCommand.description("List available adapters").alias("adapter");

adaptersCommand
  .command("list")
  .description("List all available adapters")
  .action(async (options: { parent?: { apiKey?: string; baseUrl?: string } }) => {
    try {
      const apiKey = process.env.SETTLER_API_KEY || options.parent?.apiKey;
      if (!apiKey) {
        console.error(chalk.red("Error: API key required"));
        process.exit(1);
      }

      const client = new Settler({
        apiKey,
        ...(options.parent?.baseUrl ? { baseUrl: options.parent.baseUrl } : {}),
      });

      const response = await client.adapters.list();

      console.log(chalk.bold("\nAvailable Adapters:\n"));
      response.data.forEach((adapter: Adapter) => {
        console.log(chalk.cyan(`  ${adapter.id}`));
        console.log(`    Name: ${adapter.name}`);
        console.log(`    Description: ${adapter.description}`);
        console.log(`    Version: ${adapter.version}`);
        console.log();
      });
    } catch (error) {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`));
      process.exit(1);
    }
  });

adaptersCommand
  .command("search")
  .description("Search metadata-only OSS adapter registry")
  .option("--registry <file>", "Registry manifest", "marketplace/adapters/registry.json")
  .argument("[query]", "Search query")
  .action(async (query, options) => {
    const registry = await readRegistry(options.registry);
    const needle = String(query ?? "").toLowerCase();
    const filtered = registry.filter((entry) => !needle || entry.name.toLowerCase().includes(needle));
    console.log(JSON.stringify(filtered, null, 2));
  });

adaptersCommand
  .command("install")
  .description("Install adapter metadata only (no code execution)")
  .requiredOption("--name <name>", "Adapter package name")
  .option("--registry <file>", "Registry manifest", "marketplace/adapters/registry.json")
  .option("--allow-unsafe", "Acknowledge package metadata write to local filesystem")
  .action(async (options) => {
    try {
      requireUnsafeAcknowledgement(options.allowUnsafe);
    } catch {
      console.error(chalk.red("Refusing to install package metadata without explicit acknowledgement. Re-run with --allow-unsafe. See SECURITY.md."));
      process.exit(1);
    }

    assertSafePackageName(options.name);

    const registry = await readRegistry(options.registry);
    const entry = registry.find((item) => item.name === options.name);
    if (!entry) {
      console.error(chalk.red(`Adapter package not found: ${options.name}`));
      process.exit(1);
    }

    const installPath = path.join("marketplace", "installed", "adapters");
    await fs.mkdir(installPath, { recursive: true });
    await fs.writeFile(path.join(installPath, `${entry.name}.json`), `${JSON.stringify(entry, null, 2)}\n`, "utf8");
    console.log(chalk.green(`Adapter installed: ${entry.name}@${entry.version}`));
  });

adaptersCommand
  .command("verify")
  .description("Verify installed adapter metadata")
  .requiredOption("--name <name>", "Adapter package name")
  .option("--installed-dir <dir>", "Installed package directory", "marketplace/installed/adapters")
  .action(async (options) => {
    assertSafePackageName(options.name);

    const installedFile = resolveWithinCwd(path.join(options.installedDir, `${options.name}.json`));
    const raw = await readLimitedUtf8(installedFile, MAX_REGISTRY_BYTES);
    const installed = JSON.parse(raw) as { name: string; license?: string; compatibility?: string; provenance?: string };

    if (!installed.license || !installed.compatibility) {
      console.error(chalk.red("license or compatibility metadata missing"));
      process.exit(1);
    }

    console.log(chalk.green(`Adapter package verified: ${installed.name}`));
    console.log(
      `license=${installed.license} compatibility=${installed.compatibility} provenance=${installed.provenance ?? "none"}`
    );
  });

export { adaptersCommand };
