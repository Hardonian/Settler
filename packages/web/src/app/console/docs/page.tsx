/**
 * Console Docs & Examples Page
 * 
 * Provides API documentation and code examples for all services.
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CopyButton } from '@/components/ui/CopyButton';
import { Code, Terminal } from 'lucide-react';

const serviceDocs = {
  reconcile: {
    name: 'Reconcile API',
    description: 'Financial data reconciliation across platforms',
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/recon/jobs',
        description: 'Create a reconciliation job',
        example: {
          curl: `curl -X POST https://settler.dev/api/v1/recon/jobs \\
  -H "X-API-Key: rk_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Monthly Reconciliation",
    "sourceAdapter": "stripe",
    "targetAdapter": "shopify"
  }'`,
          node: `const response = await fetch('https://settler.dev/api/v1/recon/jobs', {
  method: 'POST',
  headers: {
    'X-API-Key': 'rk_your_api_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Monthly Reconciliation',
    sourceAdapter: 'stripe',
    targetAdapter: 'shopify'
  })
});`,
          python: `import requests

response = requests.post(
    'https://settler.dev/api/v1/recon/jobs',
    headers={
        'X-API-Key': 'rk_your_api_key',
        'Content-Type': 'application/json'
    },
    json={
        'name': 'Monthly Reconciliation',
        'sourceAdapter': 'stripe',
        'targetAdapter': 'shopify'
    }
)`,
        },
      },
    ],
  },
  receipts: {
    name: 'Receipts API',
    description: 'Parse receipt images and PDFs into structured JSON',
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/receipts',
        description: 'Parse a receipt from an image or PDF',
        example: {
          curl: `curl -X POST https://settler.dev/api/v1/receipts \\
  -H "X-API-Key: rk_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "fileUrl": "https://example.com/receipt.jpg",
    "mimeType": "image/jpeg"
  }'`,
          node: `const response = await fetch('https://settler.dev/api/v1/receipts', {
  method: 'POST',
  headers: {
    'X-API-Key': 'rk_your_api_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fileUrl: 'https://example.com/receipt.jpg',
    mimeType: 'image/jpeg'
  })
});

const receipt = await response.json();`,
          python: `import requests

response = requests.post(
    'https://settler.dev/api/v1/receipts',
    headers={
        'X-API-Key': 'rk_your_api_key',
        'Content-Type': 'application/json'
    },
    json={
        'fileUrl': 'https://example.com/receipt.jpg',
        'mimeType': 'image/jpeg'
    }
)

receipt = response.json()`,
        },
      },
      {
        method: 'GET',
        path: '/api/v1/receipts/:id',
        description: 'Get a stored receipt',
        example: {
          curl: `curl https://settler.dev/api/v1/receipts/rec_abc123 \\
  -H "X-API-Key: rk_your_api_key"`,
          node: `const response = await fetch('https://settler.dev/api/v1/receipts/rec_abc123', {
  headers: {
    'X-API-Key': 'rk_your_api_key'
  }
});

const receipt = await response.json();`,
          python: `import requests

response = requests.get(
    'https://settler.dev/api/v1/receipts/rec_abc123',
    headers={'X-API-Key': 'rk_your_api_key'}
)

receipt = response.json()`,
        },
      },
    ],
  },
  'feature-flags': {
    name: 'Feature Flags API',
    description: 'Manage feature flags for your applications',
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/feature-flags',
        description: 'Create a new feature flag',
        example: {
          curl: `curl -X POST https://settler.dev/api/v1/feature-flags \\
  -H "X-API-Key: rk_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "key": "new-dashboard",
    "name": "New Dashboard UI",
    "type": "boolean",
    "defaultValue": false
  }'`,
          node: `const response = await fetch('https://settler.dev/api/v1/feature-flags', {
  method: 'POST',
  headers: {
    'X-API-Key': 'rk_your_api_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    key: 'new-dashboard',
    name: 'New Dashboard UI',
    type: 'boolean',
    defaultValue: false
  })
});`,
          python: `import requests

response = requests.post(
    'https://settler.dev/api/v1/feature-flags',
    headers={
        'X-API-Key': 'rk_your_api_key',
        'Content-Type': 'application/json'
    },
    json={
        'key': 'new-dashboard',
        'name': 'New Dashboard UI',
        'type': 'boolean',
        'defaultValue': False
    }
)`,
        },
      },
      {
        method: 'POST',
        path: '/api/v1/feature-flags/evaluate',
        description: 'Evaluate a feature flag value',
        example: {
          curl: `curl -X POST https://settler.dev/api/v1/feature-flags/evaluate \\
  -H "X-API-Key: rk_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "flagKey": "new-dashboard",
    "environment": "production",
    "context": { "userId": "user_123" }
  }'`,
          node: `const response = await fetch('https://settler.dev/api/v1/feature-flags/evaluate', {
  method: 'POST',
  headers: {
    'X-API-Key': 'rk_your_api_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    flagKey: 'new-dashboard',
    environment: 'production',
    context: { userId: 'user_123' }
  })
});

const result = await response.json();`,
          python: `import requests

response = requests.post(
    'https://settler.dev/api/v1/feature-flags/evaluate',
    headers={
        'X-API-Key': 'rk_your_api_key',
        'Content-Type': 'application/json'
    },
    json={
        'flagKey': 'new-dashboard',
        'environment': 'production',
        'context': {'userId': 'user_123'}
    }
)

result = response.json()`,
        },
      },
    ],
  },
};

export default function DocsPage() {
  const [selectedService, setSelectedService] = useState<keyof typeof serviceDocs>('receipts');
  const [selectedLanguage, setSelectedLanguage] = useState<'curl' | 'node' | 'python'>('curl');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          API Documentation
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Explore API endpoints and code examples for all Settler services.
        </p>
      </div>

      <Tabs value={selectedService} onValueChange={(v) => setSelectedService(v as keyof typeof serviceDocs)}>
        <TabsList>
          {Object.entries(serviceDocs).map(([key, doc]) => (
            <TabsTrigger key={key} value={key}>
              {doc.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(serviceDocs).map(([key, doc]) => (
          <TabsContent key={key} value={key} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{doc.name}</CardTitle>
                <CardDescription>{doc.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {doc.endpoints.map((endpoint, idx) => (
                  <div key={idx} className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 text-xs font-mono bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                          {endpoint.method}
                        </span>
                        <code className="text-sm font-mono">{endpoint.path}</code>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {endpoint.description}
                      </p>
                    </div>

                    <Tabs value={selectedLanguage} onValueChange={(v) => setSelectedLanguage(v as 'curl' | 'node' | 'python')}>
                      <TabsList>
                        <TabsTrigger value="curl">
                          <Terminal className="w-4 h-4 mr-1" />
                          cURL
                        </TabsTrigger>
                        <TabsTrigger value="node">
                          <Code className="w-4 h-4 mr-1" />
                          Node.js
                        </TabsTrigger>
                        <TabsTrigger value="python">
                          <Code className="w-4 h-4 mr-1" />
                          Python
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value={selectedLanguage} className="mt-4">
                        <div className="relative">
                          <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg overflow-x-auto text-sm">
                            <code>{endpoint.example[selectedLanguage]}</code>
                          </pre>
                          <CopyButton
                            text={endpoint.example[selectedLanguage]}
                            className="absolute top-2 right-2"
                          />
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
