/**
 * BullMQ Job Scheduler
 * Replaces setTimeout/setInterval with proper job queue system
 */

import { Queue, Worker, QueueEvents } from "bullmq";
import { Redis } from "ioredis";
import { logInfo, logError } from "../../utils/logger";
import { cleanupOldData } from "../../jobs/data-retention";
import { processTrialLifecycleEmails, processMonthlySummaryEmails, processLowActivityEmails } from "../../jobs/email-scheduler";
import { syncFXRatesJob } from "../../jobs/fx-rate-sync";
import { processPendingWebhooks } from "../../utils/webhook-queue";
import { processLifecycleEmails } from "../../services/email/lifecycle-sequences";
import { aggregateInsights } from "../../services/ai-insights/insight-aggregator";
import { suggestImprovements, saveImprovementSuggestions } from "../../services/ai-insights/improvement-suggester";
import { runDailyUsageAggregation } from "../../jobs/usage-aggregation";

// Redis connection for BullMQ
const redisConnection = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
  maxRetriesPerRequest: null,
});

// Job queue
export const jobQueue = new Queue("scheduled-jobs", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
});

// Note: QueueScheduler is deprecated in BullMQ v5+, using repeat patterns in Queue.add instead

// Queue events (for monitoring)
export const queueEvents = new QueueEvents("scheduled-jobs", {
  connection: redisConnection,
});

// Job handlers
const jobHandlers: Record<string, () => Promise<void>> = {
  "data-retention": async () => {
    logInfo("Starting data retention job");
    await cleanupOldData();
    logInfo("Data retention job completed");
  },
  "email-lifecycle": async () => {
    logInfo("Starting email lifecycle job");
    await processTrialLifecycleEmails();
    await processLowActivityEmails();
    logInfo("Email lifecycle job completed");
  },
  "email-monthly": async () => {
    logInfo("Starting monthly summary emails");
    await processMonthlySummaryEmails();
    logInfo("Monthly summary emails completed");
  },
  "fx-rate-sync": async () => {
    logInfo("Starting FX rate sync job");
    await syncFXRatesJob();
    logInfo("FX rate sync job completed");
  },
  "webhook-retry": async () => {
    logInfo("Starting webhook retry job");
    await processPendingWebhooks();
    logInfo("Webhook retry job completed");
  },
  "onboarding-emails": async () => {
    logInfo("Starting onboarding email sequence");
    // processOnboardingEmails is handled by email-lifecycle job
    logInfo("Onboarding email sequence completed");
  },
  "system-health": async () => {
    logInfo("Starting system health check");
    const { checkSystemHealth } = await import("../../services/alerts/manager");
    await checkSystemHealth();
    logInfo("System health check completed");
  },
  "lifecycle-emails": async () => {
    logInfo("Starting lifecycle email sequence");
    await processLifecycleEmails();
    logInfo("Lifecycle email sequence completed");
  },
  "usage-aggregation": async () => {
    logInfo("Starting daily usage aggregation");
    await runDailyUsageAggregation();
    logInfo("Daily usage aggregation completed");
  },
  "ai-insights": async () => {
    logInfo("Starting AI insights aggregation");
    const insights = await aggregateInsights("week");
    logInfo("AI insights aggregated", { summary: insights.summary });
    
    // Generate improvement suggestions
    const suggestions = await suggestImprovements();
    if (suggestions.length > 0) {
      await saveImprovementSuggestions(suggestions);
      logInfo("Improvement suggestions generated", { count: suggestions.length });
    }
  },
};

// Worker to process jobs
export const jobWorker = new Worker(
  "scheduled-jobs",
  async (job) => {
    const handler = jobHandlers[job.name];
    if (!handler) {
      throw new Error(`No handler found for job: ${job.name}`);
    }
    await handler();
  },
  {
    connection: redisConnection,
    concurrency: 5, // Process up to 5 jobs concurrently
  }
);

// Event listeners
jobWorker.on("completed", (job) => {
  logInfo("Job completed", {
    jobId: job.id,
    jobName: job.name,
    duration: job.finishedOn ? job.finishedOn - job.processedOn! : 0,
  });
});

jobWorker.on("failed", (job, err) => {
  logError("Job failed", err, {
    jobId: job?.id,
    jobName: job?.name,
    attemptsMade: job?.attemptsMade,
  });
});

queueEvents.on("waiting", ({ jobId }) => {
  logInfo("Job waiting", { jobId });
});

queueEvents.on("active", ({ jobId }) => {
  logInfo("Job started", { jobId });
});

/**
 * Initialize scheduled jobs
 */
export async function initializeScheduledJobs(): Promise<void> {
  try {
    // Data retention: Daily at 2 AM UTC
    await jobQueue.add(
      "data-retention",
      {},
      {
        repeat: {
          pattern: "0 2 * * *", // Daily at 2 AM
          tz: "UTC",
        },
        jobId: "data-retention-daily",
      }
    );

    // Email lifecycle: Daily at 9 AM UTC
    await jobQueue.add(
      "email-lifecycle",
      {},
      {
        repeat: {
          pattern: "0 9 * * *", // Daily at 9 AM
          tz: "UTC",
        },
        jobId: "email-lifecycle-daily",
      }
    );

    // Monthly summary: 1st of month at 9 AM UTC
    await jobQueue.add(
      "email-monthly",
      {},
      {
        repeat: {
          pattern: "0 9 1 * *", // 1st of month at 9 AM
          tz: "UTC",
        },
        jobId: "email-monthly",
      }
    );

    // FX rate sync: Daily at 1 AM UTC
    await jobQueue.add(
      "fx-rate-sync",
      {},
      {
        repeat: {
          pattern: "0 1 * * *", // Daily at 1 AM
          tz: "UTC",
        },
        jobId: "fx-rate-sync-daily",
      }
    );

    // Usage aggregation: Daily at 3 AM UTC (after data retention)
    await jobQueue.add(
      "usage-aggregation",
      {},
      {
        repeat: {
          pattern: "0 3 * * *", // Daily at 3 AM
          tz: "UTC",
        },
        jobId: "usage-aggregation-daily",
      }
    );

    // Webhook retry: Every 5 minutes
    await jobQueue.add(
      "webhook-retry",
      {},
      {
        repeat: {
          pattern: "*/5 * * * *", // Every 5 minutes
          tz: "UTC",
        },
        jobId: "webhook-retry-recurring",
      }
    );

    // Onboarding emails: Daily at 10 AM UTC
    await jobQueue.add(
      "onboarding-emails",
      {},
      {
        repeat: {
          pattern: "0 10 * * *", // Daily at 10 AM
          tz: "UTC",
        },
        jobId: "onboarding-emails-daily",
      }
    );

    // System health check: Every 15 minutes
    await jobQueue.add(
      "system-health",
      {},
      {
        repeat: {
          pattern: "*/15 * * * *", // Every 15 minutes
          tz: "UTC",
        },
        jobId: "system-health-recurring",
      }
    );

    // Lifecycle emails: Daily at 11 AM UTC
    await jobQueue.add(
      "lifecycle-emails",
      {},
      {
        repeat: {
          pattern: "0 11 * * *", // Daily at 11 AM
          tz: "UTC",
        },
        jobId: "lifecycle-emails-daily",
      }
    );

    // AI insights: Weekly on Monday at 8 AM UTC
    await jobQueue.add(
      "ai-insights",
      {},
      {
        repeat: {
          pattern: "0 8 * * 1", // Monday at 8 AM
          tz: "UTC",
        },
        jobId: "ai-insights-weekly",
      }
    );

    logInfo("Scheduled jobs initialized", {
      jobs: [
        "data-retention (daily 2 AM)",
        "usage-aggregation (daily 3 AM)",
        "email-lifecycle (daily 9 AM)",
        "email-monthly (1st of month 9 AM)",
        "fx-rate-sync (daily 1 AM)",
        "webhook-retry (every 5 minutes)",
        "lifecycle-emails (daily 11 AM)",
        "ai-insights (weekly Monday 8 AM)",
      ],
    });
  } catch (error) {
    logError("Failed to initialize scheduled jobs", error);
    throw error;
  }
}

/**
 * Graceful shutdown
 */
export async function shutdownScheduler(): Promise<void> {
  logInfo("Shutting down job scheduler");
  await jobWorker.close();
  await queueEvents.close();
  await jobQueue.close();
  await redisConnection.quit();
  logInfo("Job scheduler shut down complete");
}
