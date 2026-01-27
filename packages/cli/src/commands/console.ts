/**
 * Console CLI Commands
 *
 * Manage Console resources via CLI
 * Uses SDK for consistent API access
 */

import { Command } from "commander";
import Settler from "@settler/sdk";
import chalk from "chalk";

export const consoleCommand = new Command("console").description("Manage Console resources");

// API Keys subcommand
const apiKeysCommand = new Command("api-keys").description("Manage API keys");

apiKeysCommand
  .command("list" as const)
  .description("List all API keys")
  .action(async (options: { parent?: { apiKey?: string; baseUrl?: string } }) => {
    const parentApiKey = options.parent?.apiKey;
    const parentBaseUrl = options.parent?.baseUrl;
    const apiKey = process.env.SETTLER_API_KEY || parentApiKey || "";
    const baseUrl = parentBaseUrl || process.env.SETTLER_BASE_URL || "https://api.settler.io";

    if (!apiKey) {
      console.error(chalk.red("Error: SETTLER_API_KEY environment variable not set"));
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
        console.log(chalk.yellow("No API keys found."));
        return;
      }

      console.log(chalk.bold("\nAPI Keys:"));
      console.log("─".repeat(80));
      keys.forEach((key) => {
        console.log(chalk.cyan(`\nID: ${key.id}`));
        if (key.name) console.log(`Name: ${key.name}`);
        console.log(`Prefix: ${key.keyPrefix}`);
        console.log(`Created: ${new Date(key.createdAt).toLocaleString()}`);
        if (key.lastUsedAt) {
          console.log(`Last Used: ${new Date(key.lastUsedAt).toLocaleString()}`);
        }
        if (key.revokedAt) {
          console.log(chalk.red(`Revoked: ${new Date(key.revokedAt).toLocaleString()}`));
        }
        console.log(`Scopes: ${key.scopes.join(", ")}`);
      });
    } catch (error) {
      console.error(
        chalk.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
      );
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
      const apiKey = process.env.SETTLER_API_KEY || options.parent?.apiKey || "";
      const baseUrl =
        options.parent?.baseUrl || process.env.SETTLER_BASE_URL || "https://api.settler.io";

      if (!apiKey) {
        console.error(chalk.red("Error: SETTLER_API_KEY environment variable not set"));
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

        console.log(chalk.green("\n✅ API Key created successfully!\n"));
        console.log(
          chalk.yellow("⚠️  IMPORTANT: Save this key now. You won't be able to see it again.\n")
        );
        console.log(chalk.bold(`Key: ${data.key}`));
        console.log(`ID: ${data.id}`);
        if (data.name) console.log(`Name: ${data.name}`);
        console.log(`Created: ${new Date(data.createdAt).toLocaleString()}\n`);
      } catch (error) {
        console.error(
          chalk.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
        );
        process.exit(1);
      }
    }
  );

apiKeysCommand
  .command("revoke <id>")
  .description("Revoke an API key")
  .action(async (id: string, options: { parent?: { apiKey?: string; baseUrl?: string } }) => {
    const apiKey = process.env.SETTLER_API_KEY || options.parent?.apiKey || "";
    const baseUrl =
      options.parent?.baseUrl || process.env.SETTLER_BASE_URL || "https://api.settler.io";

    if (!apiKey) {
      console.error(chalk.red("Error: SETTLER_API_KEY environment variable not set"));
      process.exit(1);
    }

    if (!id) {
      console.error(chalk.red("Error: API key ID required"));
      process.exit(1);
    }

    try {
      const client = new Settler({
        apiKey,
        baseUrl,
      });

      await client.console.revokeApiKey(id);
      console.log(chalk.green("✅ API key revoked successfully"));
    } catch (error) {
      console.error(
        chalk.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
      );
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
    const apiKey = process.env.SETTLER_API_KEY || options.parent?.apiKey || "";
    const baseUrl =
      options.parent?.baseUrl || process.env.SETTLER_BASE_URL || "https://api.settler.io";

    if (!apiKey) {
      console.error(chalk.red("Error: SETTLER_API_KEY environment variable not set"));
      process.exit(1);
    }

    try {
      const client = new Settler({
        apiKey,
        baseUrl,
      });

      const days = parseInt(options.days || "7", 10);
      const data = await client.console.getUsage(days);
      const summary = data.summary || {};

      console.log(chalk.bold(`\n📊 Usage Summary (Last ${days} days)`));
      console.log("─".repeat(80));
      console.log(`Total API Calls: ${chalk.cyan(summary.totalCalls?.toLocaleString() || 0)}`);
      console.log(`Error Rate: ${chalk.yellow(((summary.errorRate || 0) * 100).toFixed(2))}%`);
      console.log(`Active Services: ${chalk.cyan(Object.keys(summary.byService || {}).length)}`);

      if (summary.byService && Object.keys(summary.byService).length > 0) {
        console.log(chalk.bold("\nBy Service:"));
        Object.entries(summary.byService).forEach(([service, count]: [string, number]) => {
          console.log(`  ${service}: ${chalk.cyan(count.toLocaleString())} calls`);
        });
      }

      console.log("");
    } catch (error) {
      console.error(
        chalk.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
      );
      process.exit(1);
    }
  });

// Health check subcommand
const healthCommand = new Command("health").description("Check Console health");

healthCommand.action(async (options: { parent?: { baseUrl?: string } }) => {
  const baseUrl =
    options.parent?.baseUrl || process.env.SETTLER_BASE_URL || "https://api.settler.io";

  try {
    // Health check doesn't require auth, but SDK needs an API key
    // Use a dummy key for health checks
    const client = new Settler({
      apiKey: "health-check",
      baseUrl,
    });

    const data = await client.console.health();

    console.log(chalk.bold("\n🏥 Console Health Check"));
    console.log("─".repeat(80));
    console.log(
      `Status: ${data.status === "healthy" ? chalk.green(data.status) : chalk.red(data.status)}`
    );
    console.log(
      `Environment: ${data.checks.env.status === "ok" ? chalk.green(data.checks.env.status) : chalk.red(data.checks.env.status)}`
    );
    console.log(
      `Supabase: ${data.checks.supabase.status === "ok" ? chalk.green(data.checks.supabase.status) : chalk.red(data.checks.supabase.status)}`
    );
    console.log(
      `Auth: ${data.checks.auth.status === "ok" ? chalk.green(data.checks.auth.status) : chalk.yellow(data.checks.auth.status)}`
    );
    console.log(`Timestamp: ${new Date().toLocaleString()}\n`);

    if (data.status !== "healthy") {
      process.exit(1);
    }
  } catch {
    console.error(chalk.red("❌ Health check failed:"), "Unknown error");
    process.exit(1);
  }
});

// Add subcommands
consoleCommand.addCommand(apiKeysCommand);
consoleCommand.addCommand(usageCommand);
consoleCommand.addCommand(healthCommand);
