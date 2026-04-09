/**
 * Admin CLI Commands
 * CLI interface for admin operations
 */

import chalk from "chalk";
import { Command } from "commander";

import { getJobForgeConfig, parseJsonOption, requireJobForgeClient } from "../lib/jobforge";

export function createAdminCommands(): Command {
  const admin = new Command("admin");

  // Get saga status
  admin
    .command("saga:status")
    .description("Get saga status")
    .requiredOption("--saga-id <id>", "Saga ID")
    .requiredOption("--saga-type <type>", "Saga type")
    .action(async (options) => {
      // Implementation would call AdminService
      console.log(`Getting status for saga ${options.sagaId} of type ${options.sagaType}`);
    });

  // List events for aggregate
  admin
    .command("events:list")
    .description("List events for an aggregate")
    .requiredOption("--aggregate-id <id>", "Aggregate ID")
    .requiredOption("--aggregate-type <type>", "Aggregate type")
    .action(async (options) => {
      console.log(`Listing events for ${options.aggregateType}:${options.aggregateId}`);
    });

  // Resume saga
  admin
    .command("saga:resume")
    .description("Resume a saga")
    .requiredOption("--saga-id <id>", "Saga ID")
    .requiredOption("--saga-type <type>", "Saga type")
    .action(async (options) => {
      console.log(`Resuming saga ${options.sagaId}`);
    });

  // Retry saga
  admin
    .command("saga:retry")
    .description("Retry a saga")
    .requiredOption("--saga-id <id>", "Saga ID")
    .requiredOption("--saga-type <type>", "Saga type")
    .action(async (options) => {
      console.log(`Retrying saga ${options.sagaId}`);
    });

  // Cancel saga
  admin
    .command("saga:cancel")
    .description("Cancel a saga")
    .requiredOption("--saga-id <id>", "Saga ID")
    .requiredOption("--saga-type <type>", "Saga type")
    .action(async (options) => {
      console.log(`Cancelling saga ${options.sagaId}`);
    });

  // List dead letter queue
  admin
    .command("dlq:list")
    .description("List dead letter queue entries")
    .option("--tenant-id <id>", "Filter by tenant ID")
    .option("--limit <n>", "Limit results", "100")
    .action(async (options) => {
      console.log(`Listing DLQ entries (limit: ${options.limit})`);
    });

  // Resolve dead letter entry
  admin
    .command("dlq:resolve")
    .description("Resolve a dead letter queue entry")
    .requiredOption("--id <id>", "Entry ID")
    .option("--notes <text>", "Resolution notes")
    .action(async (options) => {
      console.log(`Resolving DLQ entry ${options.id}`);
    });

  // Rebuild projections
  admin
    .command("projections:rebuild")
    .description("Rebuild read model projections")
    .option("--reconciliation-id <id>", "Rebuild specific reconciliation")
    .action(async (options) => {
      if (options.reconciliationId) {
        console.log(`Rebuilding projection for reconciliation ${options.reconciliationId}`);
      } else {
        console.log("Rebuilding all projections");
      }
    });

  // Dry-run reconciliation
  admin
    .command("reconciliation:dry-run")
    .description("Dry-run reconciliation using historical events")
    .requiredOption("--reconciliation-id <id>", "Reconciliation ID")
    .action(async (options) => {
      console.log(`Dry-running reconciliation ${options.reconciliationId}`);
    });

  // JobForge: Submit event
  admin
    .command("jobforge:submit-event")
    .description("Submit a JobForge event (admin)")
    .requiredOption("--tenant-id <id>", "Tenant ID (UUID)")
    .requiredOption("--project-id <id>", "Project ID (UUID)")
    .requiredOption("--event-name <name>", "Event name")
    .option("--payload <json>", "Event payload JSON", "{}")
    .option("--idempotency-key <key>", "Idempotency key")
    .action(async (options) => {
      try {
        const client = requireJobForgeClient();
        const payload = parseJsonOption(options.payload);

        const job = await client.enqueueJob({
          tenant_id: options.tenantId,
          type: "settler.admin.event",
          payload: {
            tenant_id: options.tenantId,
            project_id: options.projectId,
            event_name: options.eventName,
            payload,
          },
          idempotency_key: options.idempotencyKey,
        });

        console.log(chalk.green(`✓ JobForge event submitted: ${job.id}`));
      } catch (error) {
        console.error(
          chalk.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
        );
        process.exit(1);
      }
    });

  // JobForge: Module dry-run
  admin
    .command("jobforge:module:dry-run")
    .description("Run a JobForge module in dry-run mode")
    .requiredOption("--tenant-id <id>", "Tenant ID (UUID)")
    .requiredOption("--project-id <id>", "Project ID (UUID)")
    .requiredOption("--module-name <name>", "Module name")
    .option("--input <json>", "Module input JSON", "{}")
    .option("--idempotency-key <key>", "Idempotency key")
    .action(async (options) => {
      try {
        const client = requireJobForgeClient();
        const input = parseJsonOption(options.input);

        const job = await client.enqueueJob({
          tenant_id: options.tenantId,
          type: "settler.admin.module.dry_run",
          payload: {
            tenant_id: options.tenantId,
            project_id: options.projectId,
            module_name: options.moduleName,
            input,
            dry_run: true,
          },
          idempotency_key: options.idempotencyKey,
        });

        console.log(chalk.green(`✓ JobForge dry-run queued: ${job.id}`));
      } catch (error) {
        console.error(
          chalk.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
        );
        process.exit(1);
      }
    });

  // JobForge: View report
  admin
    .command("jobforge:report")
    .description("View a JobForge report by job ID")
    .requiredOption("--tenant-id <id>", "Tenant ID (UUID)")
    .requiredOption("--project-id <id>", "Project ID (UUID)")
    .requiredOption("--job-id <id>", "Job ID (UUID)")
    .action(async (options) => {
      try {
        const client = requireJobForgeClient();
        const job = await client.getJob(options.jobId, options.tenantId);

        if (!job) {
          console.log(chalk.yellow("No JobForge job found."));
          return;
        }

        const result = job.result_id
          ? await client.getResult(job.result_id, options.tenantId)
          : null;

        console.log(chalk.cyan("JobForge Job:"));
        console.log(JSON.stringify(job, null, 2));
        console.log(chalk.cyan("JobForge Result:"));
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        console.error(
          chalk.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
        );
        process.exit(1);
      }
    });

  // JobForge: Request bundle execution (gated)
  admin
    .command("jobforge:bundle:request")
    .description("Request a JobForge bundle execution (gated)")
    .requiredOption("--tenant-id <id>", "Tenant ID (UUID)")
    .requiredOption("--project-id <id>", "Project ID (UUID)")
    .requiredOption("--bundle-id <id>", "Bundle ID")
    .option("--report-job-id <id>", "Report Job ID (UUID)")
    .requiredOption("--confirm", "Confirm bundle execution request")
    .action(async (options) => {
      try {
        const config = getJobForgeConfig();
        if (!config.bundleExecutionEnabled) {
          console.error(
            chalk.red(
              "Bundle execution requests are disabled. Set JOBFORGE_BUNDLE_EXECUTION_ENABLED=1 to enable."
            )
          );
          process.exit(1);
        }

        const client = requireJobForgeClient();

        const job = await client.enqueueJob({
          tenant_id: options.tenantId,
          type: "settler.admin.bundle.execute",
          payload: {
            tenant_id: options.tenantId,
            project_id: options.projectId,
            bundle_id: options.bundleId,
            report_job_id: options.reportJobId ?? null,
            requested_at: new Date().toISOString(),
          },
        });

        console.log(chalk.green(`✓ Bundle execution requested: ${job.id}`));
      } catch (error) {
        console.error(
          chalk.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
        );
        process.exit(1);
      }
    });

  return admin;
}
