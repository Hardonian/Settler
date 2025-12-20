'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Copy, Check } from 'lucide-react';
import { SubscriptionGate } from '@/components/console/SubscriptionGate';

/**
 * API Test Console - CLI Code Editor
 * Route: /console/api-test
 * 
 * Test API calls, webhooks, CLI commands, and SDK operations
 */

const API_EXAMPLES = {
  receipts: {
    name: 'Receipts API',
    examples: [
      {
        title: 'Upload Receipt',
        method: 'POST',
        endpoint: '/api/v1/receipts',
        code: `curl -X POST https://api.settler.dev/v1/receipts \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@receipt.pdf"`,
      },
      {
        title: 'Get Receipt',
        method: 'GET',
        endpoint: '/api/v1/receipts/{id}',
        code: `curl https://api.settler.dev/v1/receipts/{id} \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
      },
    ],
  },
  reconciliation: {
    name: 'Reconciliation API',
    examples: [
      {
        title: 'Create Recon Job',
        method: 'POST',
        endpoint: '/api/v1/recon/jobs',
        code: `curl -X POST https://api.settler.dev/v1/recon/jobs \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Stripe vs QuickBooks",
    "sourceAdapter": "stripe",
    "targetAdapter": "quickbooks"
  }'`,
      },
      {
        title: 'Get Recon Results',
        method: 'GET',
        endpoint: '/api/v1/recon/jobs/{id}/results',
        code: `curl https://api.settler.dev/v1/recon/jobs/{id}/results \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
      },
    ],
  },
  featureFlags: {
    name: 'Feature Flags API',
    examples: [
      {
        title: 'Evaluate Flag',
        method: 'POST',
        endpoint: '/api/v1/feature-flags/evaluate',
        code: `curl -X POST https://api.settler.dev/v1/feature-flags/evaluate \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "key": "new-dashboard",
    "userId": "user-123"
  }'`,
      },
      {
        title: 'List Flags',
        method: 'GET',
        endpoint: '/api/v1/feature-flags',
        code: `curl https://api.settler.dev/v1/feature-flags \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
      },
    ],
  },
  webhooks: {
    name: 'Webhooks',
    examples: [
      {
        title: 'Create Webhook',
        method: 'POST',
        endpoint: '/api/v1/webhooks',
        code: `curl -X POST https://api.settler.dev/v1/webhooks \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://your-app.com/webhook",
    "events": ["receipt.parsed", "recon.completed"]
  }'`,
      },
      {
        title: 'Test Webhook',
        method: 'POST',
        endpoint: '/api/v1/webhooks/{id}/test',
        code: `curl -X POST https://api.settler.dev/v1/webhooks/{id}/test \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
      },
    ],
  },
};

export default function APITestPage() {
  const [selectedService, setSelectedService] = useState<keyof typeof API_EXAMPLES>('receipts');
  const [selectedExample, setSelectedExample] = useState(0);
  const [code, setCode] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const service = API_EXAMPLES[selectedService];
  const example = service.examples[selectedExample];
  
  useEffect(() => {
    if (example) {
      setCode(example.code);
      setSelectedExample(0);
    }
  }, [selectedService]);
  
  useEffect(() => {
    if (example) {
      setCode(example.code);
    }
  }, [selectedExample, selectedService, example]);
  
  async function executeCode() {
    setLoading(true);
    setResponse(null);
    
    try {
      // Parse the curl command and execute
      // This is a simplified version - in production, you'd parse the curl command properly
      const response = await fetch('/api/console/test-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      
      const result = await response.json();
      setResponse(result);
    } catch (err: any) {
      setResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  }
  
  function copyCode() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  
  return (
    <SubscriptionGate requiredTier="subscribed_unpaid" feature="API Test Console">
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">API Test Console</h1>
      <p className="text-gray-600 mb-6">
        Test API calls, webhooks, CLI commands, and SDK operations for Settler's core services.
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Service Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border p-4">
            <h2 className="font-semibold mb-4">API Services</h2>
            <div className="space-y-2">
              {Object.keys(API_EXAMPLES).map((key) => (
                <button
                  key={key}
                  onClick={() => setSelectedService(key as keyof typeof API_EXAMPLES)}
                  className={`w-full text-left px-3 py-2 rounded ${
                    selectedService === key
                      ? 'bg-blue-100 text-blue-900'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {API_EXAMPLES[key as keyof typeof API_EXAMPLES].name}
                </button>
              ))}
            </div>
            
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Examples</h3>
              <div className="space-y-1">
                {service.examples.map((ex, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedExample(idx)}
                    className={`w-full text-left px-3 py-2 rounded text-sm ${
                      selectedExample === idx
                        ? 'bg-blue-50 text-blue-900'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {ex.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Code Editor */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border">
            <div className="flex justify-between items-center p-4 border-b">
              <div>
                <h2 className="font-semibold">{example?.title || ''}</h2>
                <p className="text-sm text-gray-500">{example?.method || ''} {example?.endpoint || ''}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyCode}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-50 flex items-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  Copy
                </button>
                <button
                  onClick={executeCode}
                  disabled={loading}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  Run
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-64 font-mono text-sm border rounded p-4 bg-gray-50"
                placeholder="Enter API call code..."
              />
            </div>
            
            {response && (
              <div className="p-4 border-t bg-gray-50">
                <h3 className="font-semibold mb-2">Response</h3>
                <pre className="bg-white p-4 rounded border overflow-auto max-h-64 text-xs">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            )}
            
            {loading && (
              <div className="p-4 border-t text-center text-gray-500">
                Executing...
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Quick Links */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          href="/console/tables/receipts"
          className="p-4 border rounded hover:bg-gray-50"
        >
          <div className="font-semibold">Receipts Tables</div>
          <div className="text-sm text-gray-500">View receipt data</div>
        </Link>
        <Link
          href="/console/tables/recon_jobs"
          className="p-4 border rounded hover:bg-gray-50"
        >
          <div className="font-semibold">Reconciliation Tables</div>
          <div className="text-sm text-gray-500">View recon jobs</div>
        </Link>
        <Link
          href="/console/tables/feature_flags"
          className="p-4 border rounded hover:bg-gray-50"
        >
          <div className="font-semibold">Feature Flags Tables</div>
          <div className="text-sm text-gray-500">View flags</div>
        </Link>
        <Link
          href="/console/tables/webhooks"
          className="p-4 border rounded hover:bg-gray-50"
        >
          <div className="font-semibold">Webhooks Tables</div>
          <div className="text-sm text-gray-500">View webhooks</div>
        </Link>
      </div>
      </div>
    </SubscriptionGate>
  );
}
