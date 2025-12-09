"use strict";
/**
 * BullMQ Job Scheduler
 * Replaces setTimeout/setInterval with proper job queue system
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobWorker = exports.queueEvents = exports.jobQueue = void 0;
exports.initializeScheduledJobs = initializeScheduledJobs;
exports.shutdownScheduler = shutdownScheduler;
const bullmq_1 = require("bullmq");
const ioredis_1 = require("ioredis");
const logger_1 = require("../../utils/logger");
const data_retention_1 = require("../../jobs/data-retention");
const email_scheduler_1 = require("../../jobs/email-scheduler");
const fx_rate_sync_1 = require("../../jobs/fx-rate-sync");
const webhook_queue_1 = require("../../utils/webhook-queue");
const lifecycle_sequences_1 = require("../../services/email/lifecycle-sequences");
const insight_aggregator_1 = require("../../services/ai-insights/insight-aggregator");
const improvement_suggester_1 = require("../../services/ai-insights/improvement-suggester");
const usage_aggregation_1 = require("../../jobs/usage-aggregation");
// Redis connection for BullMQ
const redisConnection = new ioredis_1.Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
    maxRetriesPerRequest: null,
});
// Job queue
exports.jobQueue = new bullmq_1.Queue("scheduled-jobs", {
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
exports.queueEvents = new bullmq_1.QueueEvents("scheduled-jobs", {
    connection: redisConnection,
});
// Job handlers
const jobHandlers = {
    "data-retention": async () => {
        (0, logger_1.logInfo)("Starting data retention job");
        await (0, data_retention_1.cleanupOldData)();
        (0, logger_1.logInfo)("Data retention job completed");
    },
    "email-lifecycle": async () => {
        (0, logger_1.logInfo)("Starting email lifecycle job");
        await (0, email_scheduler_1.processTrialLifecycleEmails)();
        await (0, email_scheduler_1.processLowActivityEmails)();
        (0, logger_1.logInfo)("Email lifecycle job completed");
    },
    "email-monthly": async () => {
        (0, logger_1.logInfo)("Starting monthly summary emails");
        await (0, email_scheduler_1.processMonthlySummaryEmails)();
        (0, logger_1.logInfo)("Monthly summary emails completed");
    },
    "fx-rate-sync": async () => {
        (0, logger_1.logInfo)("Starting FX rate sync job");
        await (0, fx_rate_sync_1.syncFXRatesJob)();
        (0, logger_1.logInfo)("FX rate sync job completed");
    },
    "webhook-retry": async () => {
        (0, logger_1.logInfo)("Starting webhook retry job");
        await (0, webhook_queue_1.processPendingWebhooks)();
        (0, logger_1.logInfo)("Webhook retry job completed");
    },
    "onboarding-emails": async () => {
        (0, logger_1.logInfo)("Starting onboarding email sequence");
        // processOnboardingEmails is handled by email-lifecycle job
        (0, logger_1.logInfo)("Onboarding email sequence completed");
    },
    "system-health": async () => {
        (0, logger_1.logInfo)("Starting system health check");
        const { checkSystemHealth } = await Promise.resolve().then(() => __importStar(require("../../services/alerts/manager")));
        await checkSystemHealth();
        (0, logger_1.logInfo)("System health check completed");
    },
    "lifecycle-emails": async () => {
        (0, logger_1.logInfo)("Starting lifecycle email sequence");
        await (0, lifecycle_sequences_1.processLifecycleEmails)();
        (0, logger_1.logInfo)("Lifecycle email sequence completed");
    },
    "usage-aggregation": async () => {
        (0, logger_1.logInfo)("Starting daily usage aggregation");
        await (0, usage_aggregation_1.runDailyUsageAggregation)();
        (0, logger_1.logInfo)("Daily usage aggregation completed");
    },
    "ai-insights": async () => {
        (0, logger_1.logInfo)("Starting AI insights aggregation");
        const insights = await (0, insight_aggregator_1.aggregateInsights)("week");
        (0, logger_1.logInfo)("AI insights aggregated", { summary: insights.summary });
        // Generate improvement suggestions
        const suggestions = await (0, improvement_suggester_1.suggestImprovements)();
        if (suggestions.length > 0) {
            await (0, improvement_suggester_1.saveImprovementSuggestions)(suggestions);
            (0, logger_1.logInfo)("Improvement suggestions generated", { count: suggestions.length });
        }
    },
};
// Worker to process jobs
exports.jobWorker = new bullmq_1.Worker("scheduled-jobs", async (job) => {
    const handler = jobHandlers[job.name];
    if (!handler) {
        throw new Error(`No handler found for job: ${job.name}`);
    }
    await handler();
}, {
    connection: redisConnection,
    concurrency: 5, // Process up to 5 jobs concurrently
});
// Event listeners
exports.jobWorker.on("completed", (job) => {
    (0, logger_1.logInfo)("Job completed", {
        jobId: job.id,
        jobName: job.name,
        duration: job.finishedOn ? job.finishedOn - job.processedOn : 0,
    });
});
exports.jobWorker.on("failed", (job, err) => {
    (0, logger_1.logError)("Job failed", err, {
        jobId: job?.id,
        jobName: job?.name,
        attemptsMade: job?.attemptsMade,
    });
});
exports.queueEvents.on("waiting", ({ jobId }) => {
    (0, logger_1.logInfo)("Job waiting", { jobId });
});
exports.queueEvents.on("active", ({ jobId }) => {
    (0, logger_1.logInfo)("Job started", { jobId });
});
/**
 * Initialize scheduled jobs
 */
async function initializeScheduledJobs() {
    try {
        // Data retention: Daily at 2 AM UTC
        await exports.jobQueue.add("data-retention", {}, {
            repeat: {
                pattern: "0 2 * * *", // Daily at 2 AM
                tz: "UTC",
            },
            jobId: "data-retention-daily",
        });
        // Email lifecycle: Daily at 9 AM UTC
        await exports.jobQueue.add("email-lifecycle", {}, {
            repeat: {
                pattern: "0 9 * * *", // Daily at 9 AM
                tz: "UTC",
            },
            jobId: "email-lifecycle-daily",
        });
        // Monthly summary: 1st of month at 9 AM UTC
        await exports.jobQueue.add("email-monthly", {}, {
            repeat: {
                pattern: "0 9 1 * *", // 1st of month at 9 AM
                tz: "UTC",
            },
            jobId: "email-monthly",
        });
        // FX rate sync: Daily at 1 AM UTC
        await exports.jobQueue.add("fx-rate-sync", {}, {
            repeat: {
                pattern: "0 1 * * *", // Daily at 1 AM
                tz: "UTC",
            },
            jobId: "fx-rate-sync-daily",
        });
        // Usage aggregation: Daily at 3 AM UTC (after data retention)
        await exports.jobQueue.add("usage-aggregation", {}, {
            repeat: {
                pattern: "0 3 * * *", // Daily at 3 AM
                tz: "UTC",
            },
            jobId: "usage-aggregation-daily",
        });
        // Webhook retry: Every 5 minutes
        await exports.jobQueue.add("webhook-retry", {}, {
            repeat: {
                pattern: "*/5 * * * *", // Every 5 minutes
                tz: "UTC",
            },
            jobId: "webhook-retry-recurring",
        });
        // Onboarding emails: Daily at 10 AM UTC
        await exports.jobQueue.add("onboarding-emails", {}, {
            repeat: {
                pattern: "0 10 * * *", // Daily at 10 AM
                tz: "UTC",
            },
            jobId: "onboarding-emails-daily",
        });
        // System health check: Every 15 minutes
        await exports.jobQueue.add("system-health", {}, {
            repeat: {
                pattern: "*/15 * * * *", // Every 15 minutes
                tz: "UTC",
            },
            jobId: "system-health-recurring",
        });
        // Lifecycle emails: Daily at 11 AM UTC
        await exports.jobQueue.add("lifecycle-emails", {}, {
            repeat: {
                pattern: "0 11 * * *", // Daily at 11 AM
                tz: "UTC",
            },
            jobId: "lifecycle-emails-daily",
        });
        // AI insights: Weekly on Monday at 8 AM UTC
        await exports.jobQueue.add("ai-insights", {}, {
            repeat: {
                pattern: "0 8 * * 1", // Monday at 8 AM
                tz: "UTC",
            },
            jobId: "ai-insights-weekly",
        });
        (0, logger_1.logInfo)("Scheduled jobs initialized", {
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
    }
    catch (error) {
        (0, logger_1.logError)("Failed to initialize scheduled jobs", error);
        throw error;
    }
}
/**
 * Graceful shutdown
 */
async function shutdownScheduler() {
    (0, logger_1.logInfo)("Shutting down job scheduler");
    await exports.jobWorker.close();
    await exports.queueEvents.close();
    await exports.jobQueue.close();
    await redisConnection.quit();
    (0, logger_1.logInfo)("Job scheduler shut down complete");
}
//# sourceMappingURL=scheduler.js.map