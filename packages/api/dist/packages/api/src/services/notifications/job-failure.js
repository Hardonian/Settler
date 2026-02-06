"use strict";
/**
 * Job Failure Notification Service
 *
 * Sends notifications when reconciliation jobs fail.
 * Enterprise-ready with:
 * - Type-safe Prisma queries
 * - Comprehensive error handling
 * - Idempotent operations
 * - Multiple notification channels (email, webhook)
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
exports.notifyJobFailure = notifyJobFailure;
exports.notifyJobCompletion = notifyJobCompletion;
const email_1 = require("../../lib/email");
const job_templates_1 = require("../email/job-templates");
const webhook_notifications_1 = require("./webhook-notifications");
const logger_1 = require("../../utils/logger");
/**
 * Notify user about job failure
 */
async function notifyJobFailure(prisma, params) {
    const { jobId, resultId, errorMessage, errorStack, tenantId, userId } = params;
    try {
        // Fetch job details
        const job = await prisma.reconJob.findFirst({
            where: {
                id: jobId,
                tenantId: tenantId,
            },
            select: {
                id: true,
                name: true,
                description: true,
            },
        });
        if (!job) {
            (0, logger_1.logWarn)(`[JobFailureNotification] Job ${jobId} not found`);
            return;
        }
        // Fetch user email from billing account
        const billingAccount = await prisma.billingAccount.findFirst({
            where: {
                tenantId: tenantId,
            },
            select: {
                email: true,
                userId: true,
            },
        });
        if (!billingAccount || !billingAccount.email) {
            (0, logger_1.logWarn)(`[JobFailureNotification] No email found for tenant ${tenantId}`);
            return;
        }
        // Send email notification
        try {
            const template = (0, job_templates_1.getJobFailureTemplate)();
            const html = template
                .replace(/\{\{jobName\}\}/g, job.name)
                .replace(/\{\{jobDescription\}\}/g, job.description || "")
                .replace(/\{\{errorMessage\}\}/g, errorMessage)
                .replace(/\{\{errorStack\}\}/g, errorStack || "")
                .replace(/\{\{jobId\}\}/g, jobId)
                .replace(/\{\{resultId\}\}/g, resultId)
                .replace(/\{\{supportUrl\}\}/g, `${process.env.NEXT_PUBLIC_APP_URL || "https://settler.dev"}/support`)
                .replace(/\{\{jobUrl\}\}/g, `${process.env.NEXT_PUBLIC_APP_URL || "https://settler.dev"}/dashboard/jobs/${jobId}`);
            const emailTemplate = {
                to: billingAccount.email,
                subject: `Reconciliation Job Failed: ${job.name}`,
                html: html,
                text: `Your reconciliation job "${job.name}" has failed.\n\nError: ${errorMessage}\n\nView details: ${process.env.NEXT_PUBLIC_APP_URL || "https://settler.dev"}/dashboard/jobs/${jobId}`,
                tags: [
                    { name: "type", value: "job_failure" },
                    { name: "job_id", value: jobId },
                ],
            };
            await (0, email_1.sendEmail)(emailTemplate);
            (0, logger_1.logInfo)(`[JobFailureNotification] Email sent for job ${jobId}`);
        }
        catch (emailError) {
            (0, logger_1.logError)(`[JobFailureNotification] Failed to send email`, emailError);
            // Don't throw - notification failure shouldn't break job execution
        }
        // Log audit event (if audit logger exists)
        // Note: Audit logger may not exist in API package - this is optional
        try {
            // Use dynamic import with error suppression for optional module
            let auditModule = null;
            try {
                // @ts-expect-error - Module may not exist in API package
                auditModule = await Promise.resolve().then(() => __importStar(require("../../lib/audit/logger")));
            }
            catch {
                // Module doesn't exist - that's okay
                auditModule = null;
            }
            if (auditModule?.logAuditEvent) {
                await auditModule.logAuditEvent({
                    userId: userId,
                    tenantId: tenantId,
                    action: "notify",
                    resourceType: "reconciliation_job",
                    resourceId: jobId,
                    metadata: {
                        notificationType: "job_failure",
                        resultId: resultId,
                        errorMessage: errorMessage,
                    },
                });
            }
        }
        catch (auditError) {
            // Don't fail if audit logging fails
            (0, logger_1.logError)(`[JobFailureNotification] Audit log failed`, auditError);
        }
        // Send webhook notification if configured
        try {
            await (0, webhook_notifications_1.sendWebhookNotification)(prisma, {
                tenantId,
                userId,
                eventType: "job_failed",
                jobId,
                resultId,
                errorMessage,
                jobName: job.name,
            });
        }
        catch (webhookError) {
            (0, logger_1.logError)(`[JobFailureNotification] Webhook notification failed`, webhookError);
            // Don't throw - webhook failure shouldn't break notification flow
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        (0, logger_1.logError)(`[JobFailureNotification] Failed to send notification`, error, { errorMessage });
        // Don't throw - notification failure shouldn't break job execution
    }
}
/**
 * Notify user about job completion (success)
 */
async function notifyJobCompletion(prisma, params) {
    const { jobId, resultId, tenantId, matchedCount, unmatchedCount, accuracy } = params;
    try {
        // Fetch job details
        const job = await prisma.reconJob.findFirst({
            where: {
                id: jobId,
                tenantId: tenantId,
            },
            select: {
                id: true,
                name: true,
                description: true,
            },
        });
        if (!job) {
            return;
        }
        // Fetch user email
        const billingAccount = await prisma.billingAccount.findFirst({
            where: {
                tenantId: tenantId,
            },
            select: {
                email: true,
            },
        });
        if (!billingAccount || !billingAccount.email) {
            return;
        }
        // Only send notification if there are unmatched transactions
        if (unmatchedCount > 0) {
            const template = (0, job_templates_1.getJobCompletionTemplate)();
            const html = template
                .replace(/\{\{jobName\}\}/g, job.name)
                .replace(/\{\{matchedCount\}\}/g, matchedCount.toString())
                .replace(/\{\{unmatchedCount\}\}/g, unmatchedCount.toString())
                .replace(/\{\{accuracy\}\}/g, Math.round(accuracy * 10) / 10 + "%")
                .replace(/\{\{jobId\}\}/g, jobId)
                .replace(/\{\{resultId\}\}/g, resultId)
                .replace(/\{\{exceptionsUrl\}\}/g, `${process.env.NEXT_PUBLIC_APP_URL || "https://settler.dev"}/dashboard/jobs/${jobId}/exceptions`)
                .replace(/\{\{jobUrl\}\}/g, `${process.env.NEXT_PUBLIC_APP_URL || "https://settler.dev"}/dashboard/jobs/${jobId}`);
            const emailTemplate = {
                to: billingAccount.email,
                subject: `Reconciliation Complete: ${job.name} - ${unmatchedCount} Exceptions`,
                html: html,
                text: `Your reconciliation job "${job.name}" has completed.\n\nMatched: ${matchedCount}\nUnmatched: ${unmatchedCount}\nAccuracy: ${Math.round(accuracy * 10) / 10}%\n\nReview exceptions: ${process.env.NEXT_PUBLIC_APP_URL || "https://settler.dev"}/dashboard/jobs/${jobId}/exceptions`,
                tags: [
                    { name: "type", value: "job_completion" },
                    { name: "job_id", value: jobId },
                ],
            };
            await (0, email_1.sendEmail)(emailTemplate);
        }
    }
    catch (error) {
        (0, logger_1.logError)(`[JobCompletionNotification] Failed`, error);
        // Don't throw
    }
}
//# sourceMappingURL=job-failure.js.map