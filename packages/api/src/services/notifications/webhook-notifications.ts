/**
 * Webhook Notification Service
 * 
 * Sends webhook notifications for job events
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - PrismaClient is generated at build time
import { PrismaClient, Prisma } from '@prisma/client';
import { logInfo, logError } from '../../utils/logger';

interface WebhookNotificationParams {
  tenantId: string;
  userId: string;
  eventType: 'job_failed' | 'job_completed' | 'job_progress';
  jobId: string;
  resultId?: string;
  errorMessage?: string;
  jobName?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Send webhook notification if configured
 */
export async function sendWebhookNotification(
  prisma: PrismaClient,
  params: WebhookNotificationParams
): Promise<void> {
  const { tenantId, userId, eventType, jobId, resultId, errorMessage, jobName, metadata } = params;

  try {
    // Fetch webhook configuration for tenant
    const webhooks = await prisma.webhook.findMany({
      where: {
        tenantId: tenantId,
        status: 'active',
        deletedAt: null,
      },
      select: {
        id: true,
        url: true,
        secret: true,
        events: true,
      },
    });

    // Filter webhooks that subscribe to this event type
    const webhook = webhooks.find((wh: { events: unknown }) => {
      const events = Array.isArray(wh.events) ? wh.events : [];
      return events.includes(eventType);
    });

    if (!webhook) {
      // No webhook configured - that's okay
      return;
    }

    // Prepare webhook payload
    const payload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data: {
        jobId,
        resultId,
        jobName,
        errorMessage,
        tenantId,
        userId,
        ...metadata,
      },
    };

    // Sign payload with webhook secret if available
    const signature = webhook.secret
      ? await signWebhookPayload(JSON.stringify(payload), webhook.secret)
      : null;

    // Send webhook
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Settler-Event': eventType,
        'X-Settler-Webhook-Id': webhook.id,
        ...(signature ? { 'X-Settler-Signature': signature } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook returned ${response.status}: ${response.statusText}`);
    }

    // Log webhook delivery
    await prisma.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        url: webhook.url,
        payload: payload as Prisma.InputJsonValue,
        status: 'delivered',
        statusCode: response.status,
        responseBody: await response.text().catch(() => null),
        attempts: 1,
      },
    });

    logInfo('Webhook notification sent', {
      webhookId: webhook.id,
      eventType,
      jobId,
      status: response.status,
    });
  } catch (error) {
    logError('Failed to send webhook notification', error, {
      tenantId,
      eventType,
      jobId,
    });

    // Log failed delivery
    try {
      const failedWebhook = await prisma.webhook.findFirst({
        where: { tenantId, status: 'active', deletedAt: null },
        select: { id: true, url: true },
      });

      if (failedWebhook) {
        await prisma.webhookDelivery.create({
          data: {
            webhookId: failedWebhook.id,
            url: failedWebhook.url,
            payload: { jobId, errorMessage, jobName, eventType } as Prisma.InputJsonValue,
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            attempts: 1,
          },
        });
      }
    } catch (logErr) {
      // Don't fail if logging fails - use logger if available, otherwise silent fail
      logError('Failed to log webhook delivery failure', logErr);
    }
  }
}

/**
 * Sign webhook payload with HMAC-SHA256
 */
async function signWebhookPayload(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const payloadData = encoder.encode(payload);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, payloadData);
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}
