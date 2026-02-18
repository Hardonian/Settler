import fs from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import { Command } from "commander";

import Settler from "@settler/sdk";
import type { Adapter } from "@settler/sdk";

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
      console.error(
        chalk.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
      );
      process.exit(1);
    }
  });

async function readRegistry(file: string): Promise<Array<{ name: string; version: string; license: string; compatibility: string; provenance?: string }>> {
  const raw = await fs.readFile(file, "utf8");
  return JSON.parse(raw) as Array<{ name: string; version: string; license: string; compatibility: string; provenance?: string }>;
}

adaptersCommand
  .command("search")
  .description("Search OSS-first adapter registry")
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
  .description("Install adapter from local git-style registry metadata")
  .requiredOption("--name <name>", "Adapter package name")
  .option("--registry <file>", "Registry manifest", "marketplace/adapters/registry.json")
  .action(async (options) => {
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
    const installedFile = path.join(options.installedDir, `${options.name}.json`);
    const raw = await fs.readFile(installedFile, "utf8");
    const installed = JSON.parse(raw) as { name: string; license?: string; compatibility?: string; provenance?: string };

    if (!installed.license || !installed.compatibility) {
      console.error(chalk.red("license or compatibility metadata missing"));
      process.exit(1);
    }

    console.log(chalk.green(`Adapter package verified: ${installed.name}`));
    console.log(`license=${installed.license} compatibility=${installed.compatibility} provenance=${installed.provenance ?? "none"}`);
  });

export { adaptersCommand };
