"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const sdk_1 = __importDefault(require("@settler/sdk"));
const reportsCommand = new commander_1.Command("reports");
exports.reportsCommand = reportsCommand;
reportsCommand
    .description("View reconciliation reports")
    .alias("report");
reportsCommand
    .command("get <jobId>")
    .description("Get reconciliation report for a job")
    .option("-s, --start <date>", "Start date (YYYY-MM-DD)")
    .option("-e, --end <date>", "End date (YYYY-MM-DD)")
    .action(async (jobId, options) => {
    try {
        const apiKey = process.env.SETTLER_API_KEY || options.parent.apiKey;
        if (!apiKey) {
            console.error(chalk_1.default.red("Error: API key required"));
            process.exit(1);
        }
        const client = new sdk_1.default({
            apiKey,
            baseUrl: options.parent.baseUrl,
        });
        const response = await client.reports.get(jobId, {
            startDate: options.start,
            endDate: options.end,
        });
        const { summary } = response.data;
        console.log(chalk_1.default.bold("\nReconciliation Report:\n"));
        console.log(`  Job ID: ${jobId}`);
        console.log(`  Date Range: ${response.data.dateRange.start} to ${response.data.dateRange.end}`);
        console.log();
        console.log(chalk_1.default.bold("Summary:"));
        console.log(`  Matched: ${chalk_1.default.green(summary.matched)}`);
        console.log(`  Unmatched: ${chalk_1.default.yellow(summary.unmatched)}`);
        console.log(`  Errors: ${chalk_1.default.red(summary.errors)}`);
        console.log(`  Accuracy: ${chalk_1.default.cyan(summary.accuracy.toFixed(2))}%`);
        console.log(`  Total Transactions: ${summary.totalTransactions}`);
    }
    catch (error) {
        console.error(chalk_1.default.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`));
        process.exit(1);
    }
});
//# sourceMappingURL=reports.js.map