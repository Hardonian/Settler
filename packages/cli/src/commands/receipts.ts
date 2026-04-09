import { Command } from "commander";
import { SettlerClient } from "@settler/sdk";
import chalk from "chalk";

export const receiptsCommand = new Command("receipts").description("Manage receipts");

receiptsCommand
  .command("parse <file>")
  .description("Parse a receipt from a file or URL")
  .option("-u, --url", "Treat file argument as a URL")
  .action(async (file, options) => {
    const client = new SettlerClient({
      apiKey: process.env.SETTLER_API_KEY || "demo_key",
    });

    console.log(chalk.blue(`Parsing receipt: ${file}...`));

    try {
      let receipt;
      if (options.url || file.startsWith("http")) {
        receipt = await client.receipts.parse(file);
      } else {
        // Read file and convert to base64 or upload (mocked for now)
        // In a real CLI we would upload to signed URL first
        console.log(chalk.yellow("Local file upload not fully implemented in CLI demo."));
        return;
      }

      console.log(chalk.green("✓ Receipt parsed successfully"));
      console.log(JSON.stringify(receipt, null, 2));
    } catch (error: any) {
      console.error(chalk.red("Error parsing receipt:"), error.message);
    }
  });

receiptsCommand
  .command("get <id>")
  .description("Get a receipt by ID")
  .action(async (id) => {
    const client = new SettlerClient({
      apiKey: process.env.SETTLER_API_KEY || "demo_key",
    });

    try {
      const receipt = await client.receipts.get(id);
      console.log(JSON.stringify(receipt, null, 2));
    } catch (error: any) {
      console.error(chalk.red("Error fetching receipt:"), error.message);
    }
  });
