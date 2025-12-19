import { Metadata } from 'next';
import { CodeBlock } from '@/components/docs/CodeBlock';

export const metadata: Metadata = {
  title: 'Auth & Security - Docs',
  description: 'Authentication and security best practices',
};

export default function AuthPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <h1>Authentication & Security</h1>
      
      <section>
        <h2>API Keys</h2>
        <p>
          Settler uses API keys to authenticate requests. You can create and manage API keys in the{' '}
          <a href="/console/api-keys">Console</a>.
        </p>
        
        <h3>Using API Keys</h3>
        <CodeBlock
          code={`import { Settler } from '@settler/sdk';

const client = new Settler({
  apiKey: process.env.SETTLER_API_KEY, // Never hardcode keys!
});`}
          language="typescript"
        />
        
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 my-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>⚠️ Security Best Practices:</strong>
          </p>
          <ul className="text-sm text-yellow-800 dark:text-yellow-200 mt-2 space-y-1">
            <li>Never commit API keys to version control</li>
            <li>Use environment variables or secret management</li>
            <li>Rotate keys regularly</li>
            <li>Use different keys for development and production</li>
            <li>Revoke compromised keys immediately</li>
          </ul>
        </div>
      </section>

      <section>
        <h2>Workspace Scoping</h2>
        <p>
          All API requests are automatically scoped to your workspace. You can only access resources
          within workspaces where you have membership.
        </p>
      </section>

      <section>
        <h2>Rate Limiting</h2>
        <p>
          API requests are rate-limited per workspace. See{' '}
          <a href="/docs/status">Status & Limits</a> for current limits.
        </p>
      </section>
    </div>
  );
}
