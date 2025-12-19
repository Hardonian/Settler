import { Metadata } from 'next';
import { CodeBlock } from '@/components/docs/CodeBlock';

export const metadata: Metadata = {
  title: 'Webhooks - Docs',
  description: 'Webhook integration guide',
};

export default function WebhooksPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <h1>Webhooks</h1>
      
      <p>
        Settler can send webhooks to notify your application of important events, such as when
        a reconciliation job completes or fails.
      </p>

      <section>
        <h2>Setting Up Webhooks</h2>
        <p>Configure webhooks in the Console:</p>
        <ol>
          <li>Go to <a href="/console/webhooks">Console → Webhooks</a></li>
          <li>Click "Add Webhook"</li>
          <li>Enter your endpoint URL</li>
          <li>Select events to subscribe to</li>
          <li>Save and verify</li>
        </ol>
      </section>

      <section>
        <h2>Webhook Events</h2>
        <ul>
          <li><code>reconciliation.completed</code> - Job completed successfully</li>
          <li><code>reconciliation.failed</code> - Job failed</li>
          <li><code>receipt.parsed</code> - Receipt parsing completed</li>
        </ul>
      </section>

      <section>
        <h2>Webhook Payload</h2>
        <CodeBlock
          code={`{
  "event": "reconciliation.completed",
  "data": {
    "jobId": "job_123",
    "workspaceId": "ws_456",
    "status": "completed",
    "summary": {
      "total": 150,
      "matched": 145,
      "unmatched": 3,
      "conflicts": 2
    }
  },
  "timestamp": "2025-12-18T12:00:00Z"
}`}
          language="json"
        />
      </section>

      <section>
        <h2>Verifying Webhooks</h2>
        <p>
          Webhooks include a signature header that you can verify to ensure the request came from Settler.
        </p>
        <CodeBlock
          code={`import crypto from 'crypto';

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}`}
          language="javascript"
        />
      </section>
    </div>
  );
}
