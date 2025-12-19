import { Metadata } from 'next';
import { CodeBlock } from '@/components/docs/CodeBlock';

export const metadata: Metadata = {
  title: 'Common Errors - Docs',
  description: 'Common API errors and how to resolve them',
};

const commonErrors = [
  {
    code: 'AUTHENTICATION_REQUIRED',
    message: 'Authentication required',
    description: 'API key is missing or invalid',
    solution: 'Check that you\'re including a valid API key in the Authorization header',
    example: `// ❌ Missing API key
const client = new Settler({});

// ✅ Correct
const client = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});`,
  },
  {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Rate limit exceeded',
    description: 'You\'ve exceeded your rate limit',
    solution: 'Wait for the rate limit window to reset, or upgrade your plan',
    example: `// Check rate limit headers
const response = await fetch('/api/v1/jobs', {
  headers: {
    'Authorization': \`Bearer \${apiKey}\`,
  },
});

const remaining = response.headers.get('X-RateLimit-Remaining');
const reset = response.headers.get('X-RateLimit-Reset');`,
  },
  {
    code: 'WORKSPACE_NOT_FOUND',
    message: 'Workspace not found',
    description: 'The workspace ID doesn\'t exist or you don\'t have access',
    solution: 'Verify the workspace ID and ensure you have membership',
    example: `// Check workspace membership
const membership = await getWorkspaceMembership(workspaceId);
if (!membership.authorized) {
  // Handle unauthorized access
}`,
  },
  {
    code: 'VALIDATION_ERROR',
    message: 'Validation error',
    description: 'Request payload is invalid',
    solution: 'Check the API reference for required fields and formats',
    example: `// ❌ Missing required field
await client.jobs.create({
  name: "My Job",
  // Missing source and target
});

// ✅ Correct
await client.jobs.create({
  name: "My Job",
  source: { adapter: "stripe", config: {} },
  target: { adapter: "shopify", config: {} },
});`,
  },
];

export default function ErrorsPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <h1>Common Errors</h1>
      
      <p>
        This guide covers common API errors and how to resolve them. If you encounter an error
        not listed here, please{' '}
        <a href="/support">contact support</a>.
      </p>

      {commonErrors.map((error) => (
        <section key={error.code} className="my-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <h2 className="text-xl font-bold text-red-900 dark:text-red-200 mb-2">
              {error.code}
            </h2>
            <p className="text-red-800 dark:text-red-300 font-medium mb-1">
              {error.message}
            </p>
            <p className="text-sm text-red-700 dark:text-red-400">
              {error.description}
            </p>
          </div>
          
          <h3>Solution</h3>
          <p>{error.solution}</p>
          
          <CodeBlock code={error.example} language="typescript" />
        </section>
      ))}
    </div>
  );
}
