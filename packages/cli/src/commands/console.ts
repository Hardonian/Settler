/**
 * Console CLI Commands
 *
 * Manage Console resources via CLI
 * Uses SDK for consistent API access
 */

import chalk from "chalk";
import { Command } from "commander";

import Settler from "@settler/sdk";
import type { ApiKey, UsageSummary } from "@settler/sdk";

import { createCliLogger, resolveJsonFallbackFromEnv } from "../lib/cli-logger";

export const consoleCommand = new Command("console").description("Manage Console resources");

// API Keys subcommand
const apiKeysCommand = new Command("api-keys").description("Manage API keys");

apiKeysCommand
  .command("list" as const)
  .description("List all API keys")
  .action(async (options: { parent?: { apiKey?: string; baseUrl?: string } }) => {
    const json = resolveJsonFallbackFromEnv();
    const log = createCliLogger({ isJSONFallback: json });
    const parentApiKey = options.parent?.apiKey;
    const parentBaseUrl = options.parent?.baseUrl;
    const apiKey = process.env.SETTLER_API_KEY || parentApiKey || "";
    const baseUrl = parentBaseUrl || process.env.SETTLER_BASE_URL || "https://api.settler.io";

    if (!apiKey) {
      log.error("SETTLER_API_KEY environment variable not set");
      process.exit(1);
    }

    try {
      const client = new Settler({
        apiKey,
        baseUrl,
      });

      const response = await client.console.listApiKeys();
      const keys = response.data || [];

      if (keys.length === 0) {
        log.warning("No API keys found.");
        return;
      }

      log.section("API keys");
      keys.forEach((key: ApiKey) => {
        if (json) {
          log.detail(`ID: ${key.id}`);
          if (key.name) {
            log.detail(`Name: ${key.name}`);
          }
          log.detail(`Prefix: ${key.keyPrefix}`);
          log.detail(`Created: ${new Date(key.createdAt).toLocaleString()}`);
          if (key.lastUsedAt) {
            log.detail(`Last Used: ${new Date(key.lastUsedAt).toLocaleString()}`);
          }
          if (key.revokedAt) {
            log.detail(`Revoked: ${new Date(key.revokedAt).toLocaleString()}`);
          }
          log.detail(`Scopes: ${key.scopes.join(", ")}`);
          log.detail("");
        } else {
          log.rawLine("");
          log.rawLine(chalk.cyan(`ID: ${key.id}`));
          if (key.name) {
            log.rawLine(`Name: ${key.name}`);
          }
          log.rawLine(`Prefix: ${key.keyPrefix}`);
          log.rawLine(`Created: ${new Date(key.createdAt).toLocaleString()}`);
          if (key.lastUsedAt) {
            log.rawLine(`Last Used: ${new Date(key.lastUsedAt).toLocaleString()}`);
          }
          if (key.revokedAt) {
            log.rawLine(chalk.red(`Revoked: ${new Date(key.revokedAt).toLocaleString()}`));
          }
          log.rawLine(`Scopes: ${key.scopes.join(", ")}`);
        }
      });
    } catch (error) {
      log.error(error instanceof Error ? error.message : "Unknown error");
      process.exit(1);
    }
  });

apiKeysCommand
  .command("create")
  .description("Create a new API key")
  .option("-n, --name <name>", "Key name")
  .option("-s, --scopes <scopes>", "Comma-separated scopes", "*")
  .action(
    async (options: {
      name?: string;
      scopes?: string;
      parent?: { apiKey?: string; baseUrl?: string };
    }) => {
      const log = createCliLogger({ isJSONFallback: resolveJsonFallbackFromEnv() });
      const apiKey = process.env.SETTLER_API_KEY || options.parent?.apiKey || "";
      const baseUrl =
        options.parent?.baseUrl || process.env.SETTLER_BASE_URL || "https://api.settler.io";

      if (!apiKey) {
        log.error("SETTLER_API_KEY environment variable not set");
        process.exit(1);
      }

      try {
        const client = new Settler({
          apiKey,
          baseUrl,
        });

        const scopes = options.scopes?.split(",").map((s: string) => s.trim()) || ["*"];

        const data = await client.console.createApiKey({
          name: options.name,
          scopes: scopes,
        });

        log.success("API key created successfully.");
        log.warning("Save this key now. You will not be able to see it again.");
        log.rawLine(chalk.bold(`Key: ${data.key}`));
        log.detail(`ID: ${data.id}`);
        if (data.name) {
          log.detail(`Name: ${data.name}`);
        }
        log.detail(`Created: ${new Date(data.createdAt).toLocaleString()}`);
      } catch (error) {
        log.error(error instanceof Error ? error.message : "Unknown error");
        process.exit(1);
      }
    }
  );

apiKeysCommand
  .command("revoke <id>")
  .description("Revoke an API key")
  .action(async (id: string, options: { parent?: { apiKey?: string; baseUrl?: string } }) => {
    const log = createCliLogger({ isJSONFallback: resolveJsonFallbackFromEnv() });
    const apiKey = process.env.SETTLER_API_KEY || options.parent?.apiKey || "";
    const baseUrl =
      options.parent?.baseUrl || process.env.SETTLER_BASE_URL || "https://api.settler.io";

    if (!apiKey) {
      log.error("SETTLER_API_KEY environment variable not set");
      process.exit(1);
    }

    if (!id) {
      log.error("API key ID required");
      process.exit(1);
    }

    try {
      const client = new Settler({
        apiKey,
        baseUrl,
      });

      await client.console.revokeApiKey(id);
      log.success("API key revoked successfully.");
    } catch (error) {
      log.error(error instanceof Error ? error.message : "Unknown error");
      process.exit(1);
    }
  });

// Usage subcommand
const usageCommand = new Command("usage").description("View usage statistics");

usageCommand
  .command("summary")
  .description("Get usage summary")
  .option("-d, --days <days>", "Number of days", "7")
  .action(async (options: { days?: string; parent?: { apiKey?: string; baseUrl?: string } }) => {
    const json = resolveJsonFallbackFromEnv();
    const log = createCliLogger({ isJSONFallback: json });
    const apiKey = process.env.SETTLER_API_KEY || options.parent?.apiKey || "";
    const baseUrl =
      options.parent?.baseUrl || process.env.SETTLER_BASE_URL || "https://api.settler.io";

    if (!apiKey) {
      log.error("SETTLER_API_KEY environment variable not set");
      process.exit(1);
    }

    try {
      const client = new Settler({
        apiKey,
        baseUrl,
      });

      const days = parseInt(options.days || "7", 10);
      const data = await client.console.getUsage(days);
      const summary: UsageSummary = data.summary || {
        totalCalls: 0,
        byService: {},
        byOperation: {},
        errorRate: 0,
        period: {
          start: "",
          end: "",
        },
      };

      log.section(`Usage summary (last ${days} days)`);
      if (json) {
        log.detail(`Total API Calls: ${summary.totalCalls?.toLocaleString() ?? 0}`);
        log.detail(`Error Rate: ${((summary.errorRate ?? 0) * 100).toFixed(2)}%`);
        log.detail(`Active Services: ${Object.keys(summary.byService || {}).length}`);
      } else {
        log.rawLine(`Total API Calls: ${chalk.cyan(summary.totalCalls?.toLocaleString() ?? "0")}`);
        log.rawLine(`Error Rate: ${chalk.yellow(((summary.errorRate ?? 0) * 100).toFixed(2))}%`);
        log.rawLine(`Active Services: ${chalk.cyan(Object.keys(summary.byService || {}).length)}`);
      }

      if (summary.byService && Object.keys(summary.byService).length > 0) {
        log.section("By service");
        const byServiceEntries = Object.entries(summary.byService) as Array<[string, number]>;
        byServiceEntries.forEach(([service, count]) => {
          if (json) {
            log.detail(`${service}: ${count.toLocaleString()} calls`);
          } else {
            log.rawLine(`  ${service}: ${chalk.cyan(count.toLocaleString())} calls`);
          }
        });
      }

      log.detail("");
    } catch (error) {
      log.error(error instanceof Error ? error.message : "Unknown error");
      process.exit(1);
    }
  });

// Health check subcommand
const healthCommand = new Command("health").description("Check Console health");

healthCommand.action(async (options: { parent?: { baseUrl?: string } }) => {
  const json = resolveJsonFallbackFromEnv();
  const log = createCliLogger({ isJSONFallback: json });
  const baseUrl =
    options.parent?.baseUrl || process.env.SETTLER_BASE_URL || "https://api.settler.io";

  try {
    const client = new Settler({
      apiKey: "health-check",
      baseUrl,
    });

    const data = await client.console.health();

    log.section("Console health");
    if (json) {
      log.detail(`Status: ${data.status}`);
      log.detail(`Environment: ${data.checks.env.status}`);
      log.detail(`Supabase: ${data.checks.supabase.status}`);
      log.detail(`Auth: ${data.checks.auth.status}`);
      log.detail(`Timestamp: ${new Date().toLocaleString()}`);
    } else {
      log.rawLine(
        `Status: ${data.status === "healthy" ? chalk.green(data.status) : chalk.red(data.status)}`
      );
      log.rawLine(
        `Environment: ${data.checks.env.status === "ok" ? chalk.green(data.checks.env.status) : chalk.red(data.checks.env.status)}`
      );
      log.rawLine(
        `Supabase: ${data.checks.supabase.status === "ok" ? chalk.green(data.checks.supabase.status) : chalk.red(data.checks.supabase.status)}`
      );
      log.rawLine(
        `Auth: ${data.checks.auth.status === "ok" ? chalk.green(data.checks.auth.status) : chalk.yellow(data.checks.auth.status)}`
      );
      log.rawLine(`Timestamp: ${new Date().toLocaleString()}`);
    }

    if (data.status !== "healthy") {
      process.exit(1);
    }
  } catch {
    log.error("Health check failed.");
    process.exit(1);
  }
});

// Add subcommands
consoleCommand.addCommand(apiKeysCommand);
consoleCommand.addCommand(usageCommand);
consoleCommand.addCommand(healthCommand);
