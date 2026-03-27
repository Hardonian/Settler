import chalk from "chalk";
import { Command } from "commander";

import Settler from "@settler/sdk";
import type { ReconciliationJob } from "@settler/sdk";
import { createCliLogger, resolveJsonFallbackFromEnv } from "../lib/cli-logger";
import { withIndeterminateProgress } from "../lib/cli-progress";
import { createTraceContext, withTraceHeaders } from "../lib/http";

interface CommandParentOptions {
  apiKey?: string;
  baseUrl?: string;
  parent?: CommandParentOptions;
}

interface CommandOptions {
  parent?: CommandParentOptions;
}

const jobsCommand = new Command("jobs");

jobsCommand.description("Manage reconciliation jobs").alias("job");

jobsCommand
  .command("list")
  .description("List all reconciliation jobs")
  .action(async (options: CommandOptions) => {
    const log = createCliLogger({ isJSONFallback: resolveJsonFallbackFromEnv() });
    try {
      const apiKey = process.env.SETTLER_API_KEY || options.parent?.apiKey;
      if (!apiKey) {
        log.error("API key required. Set SETTLER_API_KEY or use --api-key");
        process.exit(1);
      }

      const client = new Settler({
        apiKey,
        ...(options.parent?.baseUrl ? { baseUrl: options.parent.baseUrl } : {}),
      });

      const response = await withIndeterminateProgress(
        "Fetching jobs…",
        resolveJsonFallbackFromEnv(),
        () => client.jobs.list()
      );

      if (response.data.length === 0) {
        log.warning("No jobs found.");
        return;
      }

      log.rawLine("");
      log.rawLine(chalk.bold("Reconciliation Jobs:"));
      response.data.forEach((job: ReconciliationJob) => {
        log.rawLine(chalk.cyan(`  ${job.id}`));
        log.rawLine(`    Name: ${job.name}`);
        log.rawLine(`    Status: ${job.status}`);
        log.rawLine(`    Created: ${new Date(job.createdAt).toLocaleString()}`);
        log.rawLine("");
      });
    } catch (error) {
      log.error(error instanceof Error ? error.message : "Unknown error");
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
      parent?: CommandParentOptions;
    }) => {
      const log = createCliLogger({ isJSONFallback: resolveJsonFallbackFromEnv() });
      try {
        const apiKey = process.env.SETTLER_API_KEY || options.parent?.parent?.apiKey;
        if (!apiKey) {
          log.error("API key required");
          process.exit(1);
        }

        log.warning("Creating job…");
        log.detail("Note: Use the web UI or API for full configuration");

        const client = new Settler({
          apiKey,
          ...(options.parent?.parent?.baseUrl ? { baseUrl: options.parent.parent.baseUrl } : {}),
        });

        // Example job creation
        const emptyConfig: Record<string, unknown> = {};
        const response = await withIndeterminateProgress(
          "Submitting job…",
          resolveJsonFallbackFromEnv(),
          () =>
            client.jobs.create({
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
            })
        );

        log.success(`Job created: ${response.data.id}`);
        log.detail(`Name: ${response.data.name}`);
      } catch (error) {
        log.error(error instanceof Error ? error.message : "Unknown error");
        process.exit(1);
      }
    }
  );

jobsCommand
  .command("run <id>")
  .description("Run a reconciliation job")
  .option("--wait", "Wait for job completion")
  .action(async (id: string, options: { wait?: boolean; parent?: CommandParentOptions }) => {
    const log = createCliLogger({ isJSONFallback: resolveJsonFallbackFromEnv() });
    try {
      const apiKey = process.env.SETTLER_API_KEY || options.parent?.apiKey;
      if (!apiKey) {
        log.error("API key required");
        process.exit(1);
      }

      const baseUrl =
        options.parent?.baseUrl || process.env.SETTLER_BASE_URL || "https://api.settler.io";

      const client = new Settler({
        apiKey,
        baseUrl,
      });

      const response = await withIndeterminateProgress(
        "Starting job run…",
        resolveJsonFallbackFromEnv(),
        () => client.jobs.run(id)
      );
      log.success(`Job execution started: ${response.data.id}`);

      if (options.wait) {
        log.info("Waiting for completion…");
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
            log.success("Job execution completed");
          } catch {
            // Execution might still be running, continue polling
          }
          attempts++;
        }

        if (!completed) {
          log.warning("Job still running after 5 minutes");
        }
      }
    } catch (error) {
      log.error(error instanceof Error ? error.message : "Unknown error");
      process.exit(1);
    }
  });

jobsCommand
  .command("logs <id>")
  .description("View job logs")
  .option("--tail", "Follow logs (like tail -f)")
  .option("--since <duration>", "Show logs since duration (e.g., 1h, 30m)")
  .option("--limit <number>", "Limit number of log entries", "100")
  .action(
    async (
      id: string,
      options: { tail?: boolean; since?: string; limit?: string; parent?: CommandParentOptions }
    ) => {
      const log = createCliLogger({ isJSONFallback: resolveJsonFallbackFromEnv() });
      try {
        const apiKey = process.env.SETTLER_API_KEY || options.parent?.parent?.apiKey;
        if (!apiKey) {
          log.error("API key required. Set SETTLER_API_KEY or use --api-key");
          process.exit(1);
        }

        const baseUrl = options.parent?.parent?.baseUrl || "https://api.settler.io";

        // Fetch logs from API
        const params = new URLSearchParams({
          limit: options.limit || "100",
        });

        if (options.since) {
          params.append("since", options.since);
        }

        const trace = createTraceContext();
        const response = await fetch(`${baseUrl}/api/v1/jobs/${id}/logs?${params.toString()}`, {
          headers: withTraceHeaders(
            {
              "X-API-Key": apiKey,
            },
            trace
          ),
        });

        if (!response.ok) {
          const error = (await response.json()) as { message?: string };
          log.error(error?.message ?? "Failed to fetch logs");
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
          log.warning("No logs found.");
          return;
        }

        log.section(`Job logs (${logs.data.length} entries)`);
        logs.data.forEach((entry) => {
          const timestamp = new Date(entry.timestamp).toLocaleString();
          const level = entry.level.toUpperCase();
          const levelColor =
            level === "ERROR"
              ? chalk.red
              : level === "WARN"
                ? chalk.yellow
                : level === "INFO"
                  ? chalk.blue
                  : chalk.gray;

          log.rawLine(`${chalk.gray(timestamp)} ${levelColor(level)} ${entry.message}`);
          if (entry.metadata) {
            log.detail(JSON.stringify(entry.metadata, null, 2));
          }
        });

        if (options.tail) {
          log.info("Following logs... (Ctrl+C to stop)");
          log.warning("Real-time tailing requires WebSocket support in this environment.");
        }
      } catch (error) {
        log.error(error instanceof Error ? error.message : "Unknown error");
        process.exit(1);
      }
    }
  );

jobsCommand
  .command("replay <id>")
  .description("Replay job events")
  .option("--from-date <date>", "Replay from date (ISO format)")
  .option("--event-id <id>", "Replay specific event ID")
  .option("--dry-run", "Dry run (don't actually replay)")
  .action(
    async (
      id: string,
      options: {
        fromDate?: string;
        eventId?: string;
        dryRun?: boolean;
        parent?: CommandParentOptions;
      }
    ) => {
      const log = createCliLogger({ isJSONFallback: resolveJsonFallbackFromEnv() });
      try {
        const apiKey = process.env.SETTLER_API_KEY || options.parent?.parent?.apiKey;
        if (!apiKey) {
          log.error("API key required. Set SETTLER_API_KEY or use --api-key");
          process.exit(1);
        }

        const baseUrl = options.parent?.parent?.baseUrl || "https://api.settler.io";

        const body: Record<string, unknown> = {
          dryRun: options.dryRun || false,
        };

        if (options.fromDate) {
          body.fromDate = options.fromDate;
        }

        if (options.eventId) {
          body.eventId = options.eventId;
        }

        log.info("Replaying events...");

        const trace = createTraceContext(undefined, id);
        const response = await fetch(`${baseUrl}/api/v1/jobs/${id}/replay`, {
          method: "POST",
          headers: withTraceHeaders(
            {
              "X-API-Key": apiKey,
              "Content-Type": "application/json",
            },
            trace
          ),
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const error = (await response.json()) as { message?: string };
          log.error(error.message ?? "Failed to replay events");
          process.exit(1);
        }

        const result = (await response.json()) as {
          eventsProcessed?: number;
          eventsReplayed?: number;
        };

        if (options.dryRun) {
          log.warning("Dry run — no events were replayed.");
        } else {
          log.success("Events replayed successfully.");
        }

        log.detail(`Events processed: ${result.eventsProcessed ?? 0}`);
        log.detail(`Events replayed: ${result.eventsReplayed ?? 0}`);
      } catch (error) {
        log.error(error instanceof Error ? error.message : "Unknown error");
        process.exit(1);
      }
    }
  );

export { jobsCommand };
