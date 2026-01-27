import { Command } from "commander";
import chalk from "chalk";
import Settler from "@settler/sdk";

const reportsCommand = new Command("reports");

reportsCommand.description("View reconciliation reports").alias("report");

reportsCommand
  .command("get <jobId>")
  .description("Get reconciliation report for a job")
  .option("-s, --start <date>", "Start date (YYYY-MM-DD)")
  .option("-e, --end <date>", "End date (YYYY-MM-DD)")
  .action(async (jobId, options) => {
    try {
      const apiKey = process.env.SETTLER_API_KEY || options.parent.apiKey;
      if (!apiKey) {
        console.error(chalk.red("Error: API key required"));
        process.exit(1);
      }

      const client = new Settler({
        apiKey,
        baseUrl: options.parent.baseUrl,
      });

      const response = await client.reports.get(jobId, {
        startDate: options.start,
        endDate: options.end,
      });

      const { summary } = response.data;

      console.log(chalk.bold("\nReconciliation Report:\n"));
      console.log(`  Job ID: ${jobId}`);
      console.log(
        `  Date Range: ${response.data.dateRange.start} to ${response.data.dateRange.end}`
      );
      console.log();
      console.log(chalk.bold("Summary:"));
      console.log(`  Matched: ${chalk.green(summary.matched)}`);
      console.log(`  Unmatched: ${chalk.yellow(summary.unmatched)}`);
      console.log(`  Errors: ${chalk.red(summary.errors)}`);
      console.log(`  Accuracy: ${chalk.cyan(summary.accuracy.toFixed(2))}%`);
      console.log(`  Total Transactions: ${summary.totalTransactions}`);
    } catch (error) {
      console.error(
        chalk.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
      );
      process.exit(1);
    }
  });

export { reportsCommand };
