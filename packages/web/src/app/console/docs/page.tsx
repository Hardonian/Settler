/**
 * Console Docs & Examples Page
 * 
 * Provides API documentation, SDK installation, CLI commands, and code examples for all services.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CopyButton } from '@/components/ui/CopyButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Code, Terminal, Package, Download, CheckCircle2, ExternalLink, FileText, RefreshCw, Flag } from 'lucide-react';
import Link from 'next/link';

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

const sdkInstallation = {
  node: {
    name: 'Node.js / TypeScript',
    install: 'npm install @settler/sdk',
    import: `import { Settler } from '@settler/sdk';

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY
});`,
    example: `// Initialize SDK
const settler = new Settler({
  apiKey: 'rk_your_api_key'
});

// Parse a receipt
const receipt = await settler.receipts.parse({
  fileUrl: 'https://example.com/receipt.jpg',
  mimeType: 'image/jpeg'
});

console.log(receipt.merchant, receipt.total);`,
  },
  python: {
    name: 'Python',
    install: 'pip install settler-sdk',
    import: `from settler import Settler

settler = Settler(api_key=os.getenv('SETTLER_API_KEY'))`,
    example: `# Initialize SDK
from settler import Settler
import os

settler = Settler(api_key=os.getenv('SETTLER_API_KEY'))

# Parse a receipt
receipt = settler.receipts.parse(
    file_url='https://example.com/receipt.jpg',
    mime_type='image/jpeg'
)

print(receipt.merchant, receipt.total)`,
  },
  go: {
    name: 'Go',
    install: 'go get github.com/settler/settler-go',
    import: `import (
    "github.com/settler/settler-go"
)

client := settler.NewClient("rk_your_api_key")`,
    example: `// Initialize SDK
client := settler.NewClient("rk_your_api_key")

// Parse a receipt
receipt, err := client.Receipts.Parse(settler.ParseReceiptRequest{
    FileURL:  "https://example.com/receipt.jpg",
    MimeType: "image/jpeg",
})

if err != nil {
    log.Fatal(err)
}

fmt.Println(receipt.Merchant, receipt.Total)`,
  },
  ruby: {
    name: 'Ruby',
    install: 'gem install settler-sdk',
    import: `require 'settler'

settler = Settler::Client.new(api_key: ENV['SETTLER_API_KEY'])`,
    example: `# Initialize SDK
require 'settler'

settler = Settler::Client.new(api_key: ENV['SETTLER_API_KEY'])

# Parse a receipt
receipt = settler.receipts.parse(
  file_url: 'https://example.com/receipt.jpg',
  mime_type: 'image/jpeg'
)

puts receipt.merchant, receipt.total`,
  },
};

const cliCommands = {
  installation: {
    npm: 'npm install -g @settler/cli',
    brew: 'brew install settler/tap/settler',
    curl: `curl -fsSL https://settler.dev/install.sh | sh`,
  },
  auth: {
    login: `settler auth login`,
    status: `settler auth status`,
    logout: `settler auth logout`,
  },
  receipts: {
    parse: `settler receipts parse receipt.jpg`,
    list: `settler receipts list`,
    get: `settler receipts get rec_abc123`,
  },
  reconcile: {
    create: `settler recon create --source stripe --target shopify`,
    list: `settler recon list`,
    status: `settler recon status job_abc123`,
  },
  flags: {
    list: `settler flags list`,
    evaluate: `settler flags evaluate new-dashboard --env production`,
    create: `settler flags create new-dashboard --type boolean`,
  },
};

export default function DocsPage() {
  const [selectedService, setSelectedService] = useState<keyof typeof serviceDocs>('receipts');
  const [selectedLanguage, setSelectedLanguage] = useState<'curl' | 'node' | 'python'>('curl');
  const [selectedSDK, setSelectedSDK] = useState<keyof typeof sdkInstallation>('node');
  const [apiKey, setApiKey] = useState<string>('');

  useEffect(() => {
    // Try to get API key from localStorage or fetch from API
    const fetchApiKey = async () => {
      try {
        const res = await fetch('/api/console/api-keys');
        if (res.ok) {
          const data = await res.json();
          const activeKey = data.keys?.find((k: any) => !k.revokedAt);
          if (activeKey) {
            setApiKey(`rk_${activeKey.keyPrefix}...`);
          }
        }
      } catch (error) {
        // Ignore errors
      }
    };
    fetchApiKey();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Developer Documentation
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Complete guides for SDKs, CLI, and API endpoints. Get started in minutes.
        </p>
      </div>

      {/* Quick Start Section */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              <CardTitle>SDK Quick Start</CardTitle>
            </div>
            <CardDescription>
              Install the SDK and make your first API call
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={selectedSDK} onValueChange={(v) => setSelectedSDK(v as keyof typeof sdkInstallation)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="node">Node</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
                <TabsTrigger value="go">Go</TabsTrigger>
                <TabsTrigger value="ruby">Ruby</TabsTrigger>
              </TabsList>
              {Object.entries(sdkInstallation).map(([key, sdk]) => (
                <TabsContent key={key} value={key} className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{sdk.name}</Badge>
                      <CopyButton text={sdk.install} size="sm" />
                    </div>
                    <pre className="p-3 bg-slate-900 text-slate-100 rounded text-sm overflow-x-auto">
                      <code>{sdk.install}</code>
                    </pre>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Initialize:</p>
                    <div className="relative">
                      <pre className="p-3 bg-slate-900 text-slate-100 rounded text-sm overflow-x-auto">
                        <code>{sdk.import}</code>
                      </pre>
                      <CopyButton text={sdk.import} className="absolute top-1 right-1" size="sm" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Example:</p>
                    <div className="relative">
                      <pre className="p-3 bg-slate-900 text-slate-100 rounded text-sm overflow-x-auto">
                        <code>{sdk.example}</code>
                      </pre>
                      <CopyButton text={sdk.example} className="absolute top-1 right-1" size="sm" />
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
            <Button asChild variant="outline" className="w-full">
              <Link href="/docs/sdk">
                Full SDK Documentation <ExternalLink className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-purple-600" />
              <CardTitle>CLI Quick Start</CardTitle>
            </div>
            <CardDescription>
              Install the CLI and start using Settler from your terminal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Install:</p>
              <Tabs defaultValue="npm">
                <TabsList>
                  <TabsTrigger value="npm">npm</TabsTrigger>
                  <TabsTrigger value="brew">Homebrew</TabsTrigger>
                  <TabsTrigger value="curl">curl</TabsTrigger>
                </TabsList>
                <TabsContent value="npm" className="mt-2">
                  <div className="relative">
                    <pre className="p-3 bg-slate-900 text-slate-100 rounded text-sm overflow-x-auto">
                      <code>{cliCommands.installation.npm}</code>
                    </pre>
                    <CopyButton text={cliCommands.installation.npm} className="absolute top-1 right-1" size="sm" />
                  </div>
                </TabsContent>
                <TabsContent value="brew" className="mt-2">
                  <div className="relative">
                    <pre className="p-3 bg-slate-900 text-slate-100 rounded text-sm overflow-x-auto">
                      <code>{cliCommands.installation.brew}</code>
                    </pre>
                    <CopyButton text={cliCommands.installation.brew} className="absolute top-1 right-1" size="sm" />
                  </div>
                </TabsContent>
                <TabsContent value="curl" className="mt-2">
                  <div className="relative">
                    <pre className="p-3 bg-slate-900 text-slate-100 rounded text-sm overflow-x-auto">
                      <code>{cliCommands.installation.curl}</code>
                    </pre>
                    <CopyButton text={cliCommands.installation.curl} className="absolute top-1 right-1" size="sm" />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Authenticate:</p>
              <div className="relative">
                <pre className="p-3 bg-slate-900 text-slate-100 rounded text-sm overflow-x-auto">
                  <code>{cliCommands.auth.login}</code>
                </pre>
                <CopyButton text={cliCommands.auth.login} className="absolute top-1 right-1" size="sm" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Try it:</p>
              <div className="relative">
                <pre className="p-3 bg-slate-900 text-slate-100 rounded text-sm overflow-x-auto">
                  <code>{cliCommands.receipts.parse}</code>
                </pre>
                <CopyButton text={cliCommands.receipts.parse} className="absolute top-1 right-1" size="sm" />
              </div>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/docs/cli">
                Full CLI Documentation <ExternalLink className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* API Key Notice */}
      {apiKey && (
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900 dark:text-green-300">
                  API Key Detected
                </p>
                <p className="text-xs text-green-700 dark:text-green-400">
                  Replace <code className="font-mono">rk_your_api_key</code> in examples with your key: <code className="font-mono">{apiKey}</code>
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/console/api-keys">Manage Keys</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Reference Section */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
          API Reference
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Complete API endpoint documentation with examples in multiple languages.
        </p>
      </div>

      <Tabs value={selectedService} onValueChange={(v) => setSelectedService(v as keyof typeof serviceDocs)}>
        <TabsList className="grid w-full grid-cols-3">
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
                      <TabsList className="grid w-full grid-cols-3">
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
                        <div className="relative group">
                          <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg overflow-x-auto text-sm">
                            <code>{endpoint.example[selectedLanguage]}</code>
                          </pre>
                          <CopyButton
                            text={endpoint.example[selectedLanguage].replace('rk_your_api_key', apiKey || 'rk_your_api_key')}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
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

      {/* CLI Commands Reference */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
          CLI Commands Reference
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Complete command-line interface documentation.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="w-5 h-5" />
              Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(cliCommands.auth).map(([cmd, example]) => (
              <div key={cmd}>
                <p className="text-sm font-medium mb-1 capitalize">{cmd}:</p>
                <div className="relative">
                  <pre className="p-3 bg-slate-900 text-slate-100 rounded text-sm overflow-x-auto">
                    <code>{example}</code>
                  </pre>
                  <CopyButton text={example} className="absolute top-1 right-1" size="sm" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Receipts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(cliCommands.receipts).map(([cmd, example]) => (
              <div key={cmd}>
                <p className="text-sm font-medium mb-1 capitalize">{cmd}:</p>
                <div className="relative">
                  <pre className="p-3 bg-slate-900 text-slate-100 rounded text-sm overflow-x-auto">
                    <code>{example}</code>
                  </pre>
                  <CopyButton text={example} className="absolute top-1 right-1" size="sm" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Reconciliation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(cliCommands.reconcile).map(([cmd, example]) => (
              <div key={cmd}>
                <p className="text-sm font-medium mb-1 capitalize">{cmd}:</p>
                <div className="relative">
                  <pre className="p-3 bg-slate-900 text-slate-100 rounded text-sm overflow-x-auto">
                    <code>{example}</code>
                  </pre>
                  <CopyButton text={example} className="absolute top-1 right-1" size="sm" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="w-5 h-5" />
              Feature Flags
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(cliCommands.flags).map(([cmd, example]) => (
              <div key={cmd}>
                <p className="text-sm font-medium mb-1 capitalize">{cmd}:</p>
                <div className="relative">
                  <pre className="p-3 bg-slate-900 text-slate-100 rounded text-sm overflow-x-auto">
                    <code>{example}</code>
                  </pre>
                  <CopyButton text={example} className="absolute top-1 right-1" size="sm" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Additional Resources */}
      <Card className="mt-8 border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle>Additional Resources</CardTitle>
          <CardDescription>
            Explore more documentation and examples
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Button asChild variant="outline" className="h-auto flex-col items-start py-4">
              <Link href="/docs">
                <Package className="w-5 h-5 mb-2" />
                <span className="font-semibold">Full Documentation</span>
                <span className="text-xs text-slate-500 mt-1">Complete API reference</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col items-start py-4">
              <Link href="/console/playground">
                <Code className="w-5 h-5 mb-2" />
                <span className="font-semibold">Interactive Playground</span>
                <span className="text-xs text-slate-500 mt-1">Test APIs in browser</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col items-start py-4">
              <Link href="/cookbooks">
                <FileText className="w-5 h-5 mb-2" />
                <span className="font-semibold">Cookbooks</span>
                <span className="text-xs text-slate-500 mt-1">Code examples & patterns</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
