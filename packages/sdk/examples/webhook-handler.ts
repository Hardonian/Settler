/**
 * Webhook Handler Example
 * 
 * Demonstrates how to receive and verify Settler webhooks
 * 
 * Run with: npx ts-node examples/webhook-handler.ts
 */

import express from 'express';
import { verifyWebhookSignature, verifyWebhookSignatureWithTimestamp } from '../src';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to capture raw body for signature verification
app.use('/webhooks', express.raw({ type: 'application/json' }));

/**
 * Webhook endpoint handler
 */
app.post('/webhooks/settler', (req, res) => {
  try {
    const signature = req.headers['x-settler-signature'] as string;
    const timestamp = req.headers['x-settler-timestamp'] as string;
    const eventType = req.headers['x-settler-event-type'] as string;
    const eventId = req.headers['x-settler-event-id'] as string;
    
    const webhookSecret = process.env.SETTLER_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('SETTLER_WEBHOOK_SECRET not configured');
      return res.status(500).send('Webhook secret not configured');
    }
    
    if (!signature || !timestamp) {
      console.error('Missing signature or timestamp');
      return res.status(401).send('Missing signature or timestamp');
    }
    
    // Verify signature
    const payload = req.body.toString();
    const isValid = verifyWebhookSignatureWithTimestamp(
      payload,
      signature,
      parseInt(timestamp),
      webhookSecret
    );
    
    if (!isValid) {
      console.error('Invalid webhook signature');
      return res.status(401).send('Invalid signature');
    }
    
    // Parse event payload
    const event = JSON.parse(payload);
    
    console.log('Webhook received:', {
      eventId,
      eventType,
      timestamp: new Date(parseInt(timestamp) * 1000).toISOString(),
    });
    
    // Process event based on type
    switch (event.type) {
      case 'reconciliation.completed':
        handleReconciliationCompleted(event.data);
        break;
      case 'reconciliation.failed':
        handleReconciliationFailed(event.data);
        break;
      case 'ingestion.completed':
        handleIngestionCompleted(event.data);
        break;
      default:
        console.log('Unhandled event type:', event.type);
    }
    
    // Always return 200 to acknowledge receipt
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).send('Internal server error');
  }
});

/**
 * Handle reconciliation completed event
 */
function handleReconciliationCompleted(data: {
  jobId: string;
  summary: {
    matched: number;
    unmatchedSource: number;
    unmatchedTarget: number;
    accuracy: number;
  };
  completedAt: string;
}) {
  console.log('Reconciliation completed:', {
    jobId: data.jobId,
    matched: data.summary.matched,
    unmatched: data.summary.unmatchedSource + data.summary.unmatchedTarget,
    accuracy: data.summary.accuracy,
  });
  
  // Your business logic here:
  // - Send notification
  // - Update database
  // - Trigger downstream processes
}

/**
 * Handle reconciliation failed event
 */
function handleReconciliationFailed(data: {
  jobId: string;
  error: string;
  failedAt: string;
}) {
  console.error('Reconciliation failed:', {
    jobId: data.jobId,
    error: data.error,
  });
  
  // Your error handling logic here:
  // - Send alert
  // - Log to error tracking
  // - Retry if appropriate
}

/**
 * Handle ingestion completed event
 */
function handleIngestionCompleted(data: {
  jobId: string;
  source: string;
  recordsProcessed: number;
  completedAt: string;
}) {
  console.log('Ingestion completed:', {
    jobId: data.jobId,
    source: data.source,
    recordsProcessed: data.recordsProcessed,
  });
  
  // Your ingestion completion logic here
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Webhook handler listening on port ${PORT}`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/webhooks/settler`);
  console.log('\nMake sure to:');
  console.log('1. Set SETTLER_WEBHOOK_SECRET environment variable');
  console.log('2. Configure webhook URL in Settler dashboard');
  console.log('3. Use ngrok or similar for local testing');
});
