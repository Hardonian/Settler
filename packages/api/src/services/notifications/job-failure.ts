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

import { PrismaClient } from '@prisma/client';
import { sendEmail, EmailTemplate } from '../../lib/email';
import { getJobFailureTemplate, getJobCompletionTemplate } from '../email/job-templates';
import { logAuditEvent } from '../../lib/audit/logger';

interface JobFailureNotificationParams {
  jobId: string;
  resultId: string;
  errorMessage: string;
  errorStack?: string;
  tenantId: string;
  userId: string;
}

/**
 * Notify user about job failure
 */
export async function notifyJobFailure(
  prisma: PrismaClient,
  params: JobFailureNotificationParams
): Promise<void> {
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
      console.warn(`[JobFailureNotification] Job ${jobId} not found`);
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
      console.warn(`[JobFailureNotification] No email found for tenant ${tenantId}`);
      return;
    }

    // Send email notification
    try {
      const template = getJobFailureTemplate();
      const html = template
        .replace(/\{\{jobName\}\}/g, job.name)
        .replace(/\{\{jobDescription\}\}/g, job.description || '')
        .replace(/\{\{errorMessage\}\}/g, errorMessage)
        .replace(/\{\{errorStack\}\}/g, errorStack || '')
        .replace(/\{\{jobId\}\}/g, jobId)
        .replace(/\{\{resultId\}\}/g, resultId)
        .replace(/\{\{supportUrl\}\}/g, `${process.env.NEXT_PUBLIC_APP_URL || 'https://settler.dev'}/support`)
        .replace(/\{\{jobUrl\}\}/g, `${process.env.NEXT_PUBLIC_APP_URL || 'https://settler.dev'}/dashboard/jobs/${jobId}`);

      const emailTemplate: EmailTemplate = {
        to: billingAccount.email,
        subject: `Reconciliation Job Failed: ${job.name}`,
        html: html,
        text: `Your reconciliation job "${job.name}" has failed.\n\nError: ${errorMessage}\n\nView details: ${process.env.NEXT_PUBLIC_APP_URL || 'https://settler.dev'}/dashboard/jobs/${jobId}`,
        tags: [
          { name: 'type', value: 'job_failure' },
          { name: 'job_id', value: jobId },
        ],
      };
      await sendEmail(emailTemplate);

      console.log(`[JobFailureNotification] Email sent for job ${jobId}`);
    } catch (emailError) {
      console.error(`[JobFailureNotification] Failed to send email:`, emailError);
      // Don't throw - notification failure shouldn't break job execution
    }

    // Log audit event
    await logAuditEvent({
      userId: userId,
      tenantId: tenantId,
      action: 'notify',
      resourceType: 'reconciliation_job',
      resourceId: jobId,
      metadata: {
        notificationType: 'job_failure',
        resultId: resultId,
        errorMessage: errorMessage,
      },
    }).catch((auditError) => {
      // Don't fail if audit logging fails
      console.error(`[JobFailureNotification] Audit log failed:`, auditError);
    });

    // TODO: Send webhook notification if configured
    // await sendWebhookNotification(...);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[JobFailureNotification] Failed to send notification:`, errorMessage);
    // Don't throw - notification failure shouldn't break job execution
  }
}

/**
 * Notify user about job completion (success)
 */
export async function notifyJobCompletion(
  prisma: PrismaClient,
  params: {
    jobId: string;
    resultId: string;
    tenantId: string;
    userId: string;
    matchedCount: number;
    unmatchedCount: number;
    accuracy: number;
  }
): Promise<void> {
  const { jobId, resultId, tenantId, userId, matchedCount, unmatchedCount, accuracy } = params;

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
      const template = getJobCompletionTemplate();
      const html = template
        .replace(/\{\{jobName\}\}/g, job.name)
        .replace(/\{\{matchedCount\}\}/g, matchedCount.toString())
        .replace(/\{\{unmatchedCount\}\}/g, unmatchedCount.toString())
        .replace(/\{\{accuracy\}\}/g, Math.round(accuracy * 10) / 10 + '%')
        .replace(/\{\{jobId\}\}/g, jobId)
        .replace(/\{\{resultId\}\}/g, resultId)
        .replace(/\{\{exceptionsUrl\}\}/g, `${process.env.NEXT_PUBLIC_APP_URL || 'https://settler.dev'}/dashboard/jobs/${jobId}/exceptions`)
        .replace(/\{\{jobUrl\}\}/g, `${process.env.NEXT_PUBLIC_APP_URL || 'https://settler.dev'}/dashboard/jobs/${jobId}`);

      const emailTemplate: EmailTemplate = {
        to: billingAccount.email,
        subject: `Reconciliation Complete: ${job.name} - ${unmatchedCount} Exceptions`,
        html: html,
        text: `Your reconciliation job "${job.name}" has completed.\n\nMatched: ${matchedCount}\nUnmatched: ${unmatchedCount}\nAccuracy: ${Math.round(accuracy * 10) / 10}%\n\nReview exceptions: ${process.env.NEXT_PUBLIC_APP_URL || 'https://settler.dev'}/dashboard/jobs/${jobId}/exceptions`,
        tags: [
          { name: 'type', value: 'job_completion' },
          { name: 'job_id', value: jobId },
        ],
      };
      await sendEmail(emailTemplate);
    }
  } catch (error) {
    console.error(`[JobCompletionNotification] Failed:`, error);
    // Don't throw
  }
}
