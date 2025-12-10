"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobsCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const sdk_1 = __importDefault(require("@settler/sdk"));
const jobsCommand = new commander_1.Command("jobs");
exports.jobsCommand = jobsCommand;
jobsCommand
    .description("Manage reconciliation jobs")
    .alias("job");
jobsCommand
    .command("list")
    .description("List all reconciliation jobs")
    .action(async (options) => {
    try {
        const apiKey = process.env.SETTLER_API_KEY || options.parent?.apiKey;
        if (!apiKey) {
            console.error(chalk_1.default.red("Error: API key required. Set SETTLER_API_KEY or use --api-key"));
            process.exit(1);
        }
        const client = new sdk_1.default({
            apiKey,
            ...(options.parent?.baseUrl ? { baseUrl: options.parent.baseUrl } : {}),
        });
        const response = await client.jobs.list();
        if (response.data.length === 0) {
            console.log(chalk_1.default.yellow("No jobs found."));
            return;
        }
        console.log(chalk_1.default.bold("\nReconciliation Jobs:\n"));
        response.data.forEach((job) => {
            console.log(chalk_1.default.cyan(`  ${job.id}`));
            console.log(`    Name: ${job.name}`);
            console.log(`    Status: ${job.status}`);
            console.log(`    Created: ${new Date(job.createdAt).toLocaleString()}`);
            console.log();
        });
    }
    catch (error) {
        console.error(chalk_1.default.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`));
        process.exit(1);
    }
});
jobsCommand
    .command("create")
    .description("Create a new reconciliation job")
    .option("-n, --name <name>", "Job name")
    .option("-s, --source <adapter>", "Source adapter")
    .option("-t, --target <adapter>", "Target adapter")
    .action(async (options) => {
    try {
        const apiKey = process.env.SETTLER_API_KEY || options.parent?.parent?.apiKey;
        if (!apiKey) {
            console.error(chalk_1.default.red("Error: API key required"));
            process.exit(1);
        }
        // In a real CLI, you'd use inquirer for interactive prompts
        console.log(chalk_1.default.yellow("Creating job..."));
        console.log(chalk_1.default.gray("Note: Use the web UI or API for full configuration"));
        const client = new sdk_1.default({
            apiKey,
            ...(options.parent?.parent?.baseUrl ? { baseUrl: options.parent.parent.baseUrl } : {}),
        });
        // Example job creation
        const emptyConfig = {};
        const response = await client.jobs.create({
            name: options.name || "New Reconciliation Job",
            source: {
                adapter: options.source || "shopify",
                config: emptyConfig,
            },
            target: {
                adapter: options.target || "stripe",
                config: emptyConfig,
            },
            rules: {
                matching: [
                    { field: "order_id", type: "exact" },
                    { field: "amount", type: "exact", tolerance: 0.01 },
                ],
            },
        });
        console.log(chalk_1.default.green(`\n✓ Job created: ${response.data.id}`));
        console.log(chalk_1.default.gray(`  Name: ${response.data.name}`));
    }
    catch (error) {
        console.error(chalk_1.default.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`));
        process.exit(1);
    }
});
jobsCommand
    .command("run <id>")
    .description("Run a reconciliation job")
    .option("--wait", "Wait for job completion")
    .action(async (id, options) => {
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
        const response = await client.jobs.run(id);
        console.log(chalk_1.default.green(`\n✓ Job execution started: ${response.data.id}`));
        if (options.wait) {
            console.log(chalk_1.default.blue("Waiting for completion..."));
            // Poll for completion
            let completed = false;
            let attempts = 0;
            const maxAttempts = 60; // 5 minutes max
            while (!completed && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 5000));
                // Check execution status via reports endpoint instead of job status
                // Job status is "active" | "paused" | "archived", not execution status
                try {
                    // If we can get a report, the execution likely completed
                    await client.reports.get(id, {
                        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                        endDate: new Date().toISOString(),
                    });
                    completed = true;
                    console.log(chalk_1.default.green("✓ Job execution completed"));
                }
                catch {
                    // Execution might still be running, continue polling
                }
                attempts++;
            }
            if (!completed) {
                console.log(chalk_1.default.yellow("⚠ Job still running after 5 minutes"));
            }
        }
    }
    catch (error) {
        console.error(chalk_1.default.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`));
        process.exit(1);
    }
});
jobsCommand
    .command("logs <id>")
    .description("View job logs")
    .option("--tail", "Follow logs (like tail -f)")
    .option("--since <duration>", "Show logs since duration (e.g., 1h, 30m)")
    .option("--limit <number>", "Limit number of log entries", "100")
    .action(async (id, options) => {
    try {
        const apiKey = process.env.SETTLER_API_KEY || options.parent.parent?.apiKey;
        if (!apiKey) {
            console.error(chalk_1.default.red("Error: API key required"));
            process.exit(1);
        }
        const baseUrl = options.parent.parent?.baseUrl || "https://api.settler.io";
        // Fetch logs from API
        const params = new URLSearchParams({
            limit: options.limit || "100",
        });
        if (options.since) {
            params.append("since", options.since);
        }
        const response = await fetch(`${baseUrl}/api/v1/jobs/${id}/logs?${params.toString()}`, {
            headers: {
                "X-API-Key": apiKey,
            },
        });
        if (!response.ok) {
            const error = await response.json();
            console.error(chalk_1.default.red(`Error: ${error?.message || "Failed to fetch logs"}`));
            process.exit(1);
        }
        const logs = await response.json();
        if (!logs.data || logs.data.length === 0) {
            console.log(chalk_1.default.yellow("No logs found"));
            return;
        }
        console.log(chalk_1.default.bold(`\nJob Logs (${logs.data.length} entries):\n`));
        logs.data.forEach((log) => {
            const timestamp = new Date(log.timestamp).toLocaleString();
            const level = log.level.toUpperCase();
            const levelColor = level === "ERROR" ? chalk_1.default.red :
                level === "WARN" ? chalk_1.default.yellow :
                    level === "INFO" ? chalk_1.default.blue :
                        chalk_1.default.gray;
            console.log(`${chalk_1.default.gray(timestamp)} ${levelColor(level)} ${log.message}`);
            if (log.metadata) {
                console.log(chalk_1.default.gray(`  ${JSON.stringify(log.metadata, null, 2)}`));
            }
        });
        if (options.tail) {
            console.log(chalk_1.default.blue("\nFollowing logs... (Ctrl+C to stop)"));
            // In a real implementation, you'd use WebSocket or Server-Sent Events
            console.log(chalk_1.default.yellow("Note: Real-time tailing requires WebSocket support"));
        }
    }
    catch (error) {
        console.error(chalk_1.default.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`));
        process.exit(1);
    }
});
jobsCommand
    .command("replay <id>")
    .description("Replay job events")
    .option("--from-date <date>", "Replay from date (ISO format)")
    .option("--event-id <id>", "Replay specific event ID")
    .option("--dry-run", "Dry run (don't actually replay)")
    .action(async (id, options) => {
    try {
        const apiKey = process.env.SETTLER_API_KEY || options.parent.parent?.apiKey;
        if (!apiKey) {
            console.error(chalk_1.default.red("Error: API key required"));
            process.exit(1);
        }
        const baseUrl = options.parent.parent?.baseUrl || "https://api.settler.io";
        const body = {
            dryRun: options.dryRun || false,
        };
        if (options.fromDate) {
            body.fromDate = options.fromDate;
        }
        if (options.eventId) {
            body.eventId = options.eventId;
        }
        console.log(chalk_1.default.blue("Replaying events..."));
        const response = await fetch(`${baseUrl}/api/v1/jobs/${id}/replay`, {
            method: "POST",
            headers: {
                "X-API-Key": apiKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const error = await response.json();
            console.error(chalk_1.default.red(`Error: ${error.message || "Failed to replay events"}`));
            process.exit(1);
        }
        const result = await response.json();
        if (options.dryRun) {
            console.log(chalk_1.default.yellow("Dry run mode - no events were actually replayed"));
        }
        else {
            console.log(chalk_1.default.green("✓ Events replayed successfully"));
        }
        console.log(chalk_1.default.gray(`   Events processed: ${result.eventsProcessed || 0}`));
        console.log(chalk_1.default.gray(`   Events replayed: ${result.eventsReplayed || 0}`));
    }
    catch (error) {
        console.error(chalk_1.default.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`));
        process.exit(1);
    }
});
//# sourceMappingURL=jobs.js.map