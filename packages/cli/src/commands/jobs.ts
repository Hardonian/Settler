import { Command } from "commander";
import chalk from "chalk";
import Settler from "@settler/sdk";

const jobsCommand = new Command("jobs");

jobsCommand.description("Manage reconciliation jobs").alias("job");

jobsCommand
  .command("list")
  .description("List all reconciliation jobs")
  .action(async (options: { parent?: { apiKey?: string; baseUrl?: string } }) => {
    try {
      const apiKey = process.env.SETTLER_API_KEY || options.parent?.apiKey;
      if (!apiKey) {
        console.error(chalk.red("Error: API key required. Set SETTLER_API_KEY or use --api-key"));
        process.exit(1);
      }

      const client = new Settler({
        apiKey,
        ...(options.parent?.baseUrl ? { baseUrl: options.parent.baseUrl } : {}),
      });

      const response = await client.jobs.list();

      if (response.data.length === 0) {
        console.log(chalk.yellow("No jobs found."));
        return;
      }

      console.log(chalk.bold("\nReconciliation Jobs:\n"));
      response.data.forEach((job) => {
        console.log(chalk.cyan(`  ${job.id}`));
        console.log(`    Name: ${job.name}`);
        console.log(`    Status: ${job.status}`);
        console.log(`    Created: ${new Date(job.createdAt).toLocaleString()}`);
        console.log();
      });
    } catch (error) {
      console.error(
        chalk.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
      );
      process.exit(1);
    }
  });

jobsCommand
  .command("create")
  .description("Create a new reconciliation job")
  .option("-n, --name <name>", "Job name")
  .option("-s, --source <adapter>", "Source adapter")
  .option("-t, --target <adapter>", "Target adapter")
  .action(
    async (options: {
      name?: string;
      source?: string;
      target?: string;
      parent?: { parent?: { apiKey?: string; baseUrl?: string } };
    }) => {
      try {
        const apiKey = process.env.SETTLER_API_KEY || options.parent?.parent?.apiKey;
        if (!apiKey) {
          console.error(chalk.red("Error: API key required"));
          process.exit(1);
        }

        // In a real CLI, you'd use inquirer for interactive prompts
        console.log(chalk.yellow("Creating job..."));
        console.log(chalk.gray("Note: Use the web UI or API for full configuration"));

        const client = new Settler({
          apiKey,
          ...(options.parent?.parent?.baseUrl ? { baseUrl: options.parent.parent.baseUrl } : {}),
        });

        // Example job creation
        const emptyConfig: Record<string, unknown> = {};
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
              { field: "order_id" as const, type: "exact" as const },
              { field: "amount" as const, type: "exact" as const, tolerance: 0.01 },
            ],
          },
        });

        console.log(chalk.green(`\n✓ Job created: ${response.data.id}`));
        console.log(chalk.gray(`  Name: ${response.data.name}`));
      } catch (error) {
        console.error(
          chalk.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
        );
        process.exit(1);
      }
    }
  );

jobsCommand
  .command("run <id>")
  .description("Run a reconciliation job")
  .option("--wait", "Wait for job completion")
  .action(async (id, options) => {
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

      const response = await client.jobs.run(id);
      console.log(chalk.green(`\n✓ Job execution started: ${response.data.id}`));

      if (options.wait) {
        console.log(chalk.blue("Waiting for completion..."));
        // Poll for completion
        let completed = false;
        let attempts = 0;
        const maxAttempts = 60; // 5 minutes max

        while (!completed && attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          // Check execution status via reports endpoint instead of job status
          // Job status is "active" | "paused" | "archived", not execution status
          try {
            // If we can get a report, the execution likely completed
            await client.reports.get(id, {
              startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              endDate: new Date().toISOString(),
            });
            completed = true;
            console.log(chalk.green("✓ Job execution completed"));
          } catch {
            // Execution might still be running, continue polling
          }
          attempts++;
        }

        if (!completed) {
          console.log(chalk.yellow("⚠ Job still running after 5 minutes"));
        }
      }
    } catch (error) {
      console.error(
        chalk.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
      );
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
        console.error(chalk.red("Error: API key required"));
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
        const error = (await response.json()) as { message?: string };
        console.error(chalk.red(`Error: ${error?.message || "Failed to fetch logs"}`));
        process.exit(1);
      }

      const logs = (await response.json()) as {
        data?: Array<{
          timestamp: string;
          level: string;
          message: string;
          metadata?: Record<string, unknown>;
        }>;
      };

      if (!logs.data || logs.data.length === 0) {
        console.log(chalk.yellow("No logs found"));
        return;
      }

      console.log(chalk.bold(`\nJob Logs (${logs.data.length} entries):\n`));
      logs.data.forEach((log) => {
        const timestamp = new Date(log.timestamp).toLocaleString();
        const level = log.level.toUpperCase();
        const levelColor =
          level === "ERROR"
            ? chalk.red
            : level === "WARN"
              ? chalk.yellow
              : level === "INFO"
                ? chalk.blue
                : chalk.gray;

        console.log(`${chalk.gray(timestamp)} ${levelColor(level)} ${log.message}`);
        if (log.metadata) {
          console.log(chalk.gray(`  ${JSON.stringify(log.metadata, null, 2)}`));
        }
      });

      if (options.tail) {
        console.log(chalk.blue("\nFollowing logs... (Ctrl+C to stop)"));
        // In a real implementation, you'd use WebSocket or Server-Sent Events
        console.log(chalk.yellow("Note: Real-time tailing requires WebSocket support"));
      }
    } catch (error) {
      console.error(
        chalk.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
      );
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
        console.error(chalk.red("Error: API key required"));
        process.exit(1);
      }

      const baseUrl = options.parent.parent?.baseUrl || "https://api.settler.io";

      const body: Record<string, unknown> = {
        dryRun: options.dryRun || false,
      };

      if (options.fromDate) {
        body.fromDate = options.fromDate;
      }

      if (options.eventId) {
        body.eventId = options.eventId;
      }

      console.log(chalk.blue("Replaying events..."));

      const response = await fetch(`${baseUrl}/api/v1/jobs/${id}/replay`, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = (await response.json()) as { message?: string };
        console.error(chalk.red(`Error: ${error.message || "Failed to replay events"}`));
        process.exit(1);
      }

      const result = (await response.json()) as {
        eventsProcessed?: number;
        eventsReplayed?: number;
      };

      if (options.dryRun) {
        console.log(chalk.yellow("Dry run mode - no events were actually replayed"));
      } else {
        console.log(chalk.green("✓ Events replayed successfully"));
      }

      console.log(chalk.gray(`   Events processed: ${result.eventsProcessed || 0}`));
      console.log(chalk.gray(`   Events replayed: ${result.eventsReplayed || 0}`));
    } catch (error) {
      console.error(
        chalk.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
      );
      process.exit(1);
    }
  });

export { jobsCommand };
