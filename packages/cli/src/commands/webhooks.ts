import chalk from "chalk";
import { Command } from "commander";

import Settler from "@settler/sdk";
import type { Webhook } from "@settler/sdk";

interface CommandParentOptions {
  apiKey?: string;
  baseUrl?: string;
}

const webhooksCommand = new Command("webhooks");

webhooksCommand.description("Manage webhooks").alias("webhook");

webhooksCommand
  .command("list")
  .description("List all webhooks")
  .action(async (options: { parent?: CommandParentOptions }) => {
    try {
      const apiKey = process.env.SETTLER_API_KEY || options.parent?.apiKey;
      if (!apiKey) {
        console.error(chalk.red("Error: API key required"));
        process.exit(1);
      }

      const baseUrl =
        options.parent?.baseUrl || process.env.SETTLER_BASE_URL || "https://api.settler.io";

      const client = new Settler({
        apiKey,
        baseUrl,
      });

      const response = await client.webhooks.list();

      if (response.data.length === 0) {
        console.log(chalk.yellow("No webhooks found."));
        return;
      }

      console.log(chalk.bold("\nWebhooks:\n"));
      response.data.forEach((webhook: Webhook) => {
        console.log(chalk.cyan(`  ${webhook.id}`));
        console.log(`    URL: ${webhook.url}`);
        console.log(`    Events: ${webhook.events.join(", ")}`);
        console.log(`    Status: ${webhook.status}`);
        console.log();
      });
    } catch (error) {
      console.error(
        chalk.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
      );
      process.exit(1);
    }
  });

export { webhooksCommand };
