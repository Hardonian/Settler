import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Status & Limits - Docs',
  description: 'API status, rate limits, and quotas',
};

export default function StatusPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <h1>Status & Limits</h1>
      
      <section>
        <h2>API Status</h2>
        <p>
          Check current API status at{' '}
          <a href="/status" target="_blank" rel="noopener noreferrer">
            settler.dev/status
          </a>
        </p>
      </section>

      <section>
        <h2>Rate Limits</h2>
        <table>
          <thead>
            <tr>
              <th>Plan</th>
              <th>Requests per minute</th>
              <th>Requests per day</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Free</td>
              <td>60</td>
              <td>10,000</td>
            </tr>
            <tr>
              <td>Commercial</td>
              <td>300</td>
              <td>100,000</td>
            </tr>
            <tr>
              <td>Enterprise</td>
              <td>1,000</td>
              <td>Unlimited</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>Quotas</h2>
        <ul>
          <li><strong>Reconciliations:</strong> See <a href="/pricing">pricing page</a> for plan limits</li>
          <li><strong>Receipt Parsing:</strong> See <a href="/pricing">pricing page</a> for plan limits</li>
          <li><strong>Feature Flags:</strong> See <a href="/pricing">pricing page</a> for plan limits</li>
        </ul>
      </section>

      <section>
        <h2>Rate Limit Headers</h2>
        <p>API responses include rate limit headers:</p>
        <pre className="bg-card dark:bg-card rounded-lg p-4">
          <code>{`X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640000000`}</code>
        </pre>
      </section>
    </div>
  );
}
