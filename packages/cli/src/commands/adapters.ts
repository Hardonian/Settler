import { Command } from "commander";
import chalk from "chalk";
import Settler from "@settler/sdk";

const adaptersCommand = new Command("adapters");

adaptersCommand
  .description("List available adapters")
  .alias("adapter");

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
      response.data.forEach((adapter) => {
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

export { adaptersCommand };
