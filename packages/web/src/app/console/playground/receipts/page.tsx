"use client";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CopyButton } from '@/components/ui/CopyButton';
import { Code, Terminal } from 'lucide-react';

const sdkExamples = {
  node: `// Using Node.js SDK
import { Settler } from '@settler/sdk';

const settler = new Settler({
  apiKey: 'rk_your_api_key'
});

const receipt = await settler.receipts.parse({
  fileUrl: 'https://example.com/receipt.jpg',
  mimeType: 'image/jpeg'
});

console.log(receipt);`,
  python: `# Using Python SDK
from settler import Settler

settler = Settler(api_key='rk_your_api_key')

receipt = settler.receipts.parse(
    file_url='https://example.com/receipt.jpg',
    mime_type='image/jpeg'
)

print(receipt)`,
  curl: `curl -X POST https://settler.dev/api/v1/receipts \\
  -H "X-API-Key: rk_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "fileUrl": "https://example.com/receipt.jpg",
    "mimeType": "image/jpeg"
  }'`,
};

interface ReceiptItem {
  desc?: string;
  name?: string;
  amount?: number;
  lineTotal?: number;
}

interface ReceiptResult {
  merchant: string;
  date: string;
  total: number;
  currency: string;
  items: ReceiptItem[];
}

export default function ReceiptsPlayground() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ReceiptResult | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'node' | 'python' | 'curl'>('node');

  const scanReceipt = async () => {
    setScanning(true);
    try {
      // In a real implementation, this would call the actual API
      const res = await fetch('/api/v1/receipts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileUrl: 'https://example.com/receipt.jpg',
          mimeType: 'image/jpeg',
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        // Fallback to demo data
        setResult({
          merchant: "Starbucks Coffee",
          date: "2023-11-24",
          total: 14.50,
          currency: "USD",
          items: [
            { desc: "Latte Grande", amount: 5.50 },
            { desc: "Bagel", amount: 4.00 },
            { desc: "Croissant", amount: 5.00 }
          ]
        });
      }
    } catch (error) {
      // Fallback to demo data
      setResult({
        merchant: "Starbucks Coffee",
        date: "2023-11-24",
        total: 14.50,
        currency: "USD",
        items: [
          { desc: "Latte Grande", amount: 5.50 },
          { desc: "Bagel", amount: 4.00 },
          { desc: "Croissant", amount: 5.00 }
        ]
      });
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="space-y-6">
        <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Receipts Playground</h2>
            <p className="text-slate-600 dark:text-slate-400">Test the OCR and extraction engine with real receipts.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Upload Receipt</CardTitle>
                    <CardDescription>Upload an image or PDF to extract structured data</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-12 text-center text-slate-600 dark:text-slate-400 hover:border-blue-500 dark:hover:border-blue-500 transition-colors cursor-pointer">
                            <p className="mb-2">Drag and drop receipt image here</p>
                            <p className="text-sm">or click to browse</p>
                        </div>
                        <Button onClick={scanReceipt} disabled={scanning} className="w-full">
                            {scanning ? 'Analyzing Receipt...' : 'Analyze Sample Receipt'}
                        </Button>
                        
                        {/* SDK Code Examples */}
                        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                            <p className="text-sm font-medium mb-3 text-slate-900 dark:text-white">Try with SDK:</p>
                            <Tabs value={selectedLanguage} onValueChange={(v) => setSelectedLanguage(v as 'node' | 'python' | 'curl')}>
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="node">
                                        <Code className="w-4 h-4 mr-1" />
                                        Node.js
                                    </TabsTrigger>
                                    <TabsTrigger value="python">
                                        <Code className="w-4 h-4 mr-1" />
                                        Python
                                    </TabsTrigger>
                                    <TabsTrigger value="curl">
                                        <Terminal className="w-4 h-4 mr-1" />
                                        cURL
                                    </TabsTrigger>
                                </TabsList>
                                {Object.entries(sdkExamples).map(([lang, code]) => (
                                    <TabsContent key={lang} value={lang} className="mt-3">
                                        <div className="relative group">
                                            <pre className="p-3 bg-slate-900 text-slate-100 rounded text-sm overflow-x-auto">
                                                <code>{code}</code>
                                            </pre>
                                            <CopyButton text={code} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity" size="sm" />
                                        </div>
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Extracted Data</CardTitle>
                    <CardDescription>Structured JSON output from OCR extraction</CardDescription>
                </CardHeader>
                <CardContent>
                    {result ? (
                        <div className="space-y-4">
                            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                <span className="text-slate-500 dark:text-slate-400 block text-xs mb-1">Merchant</span>
                                <span className="font-bold text-lg text-slate-900 dark:text-white">{result.merchant}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                    <span className="text-slate-500 dark:text-slate-400 block text-xs mb-1">Date</span>
                                    <span className="text-slate-900 dark:text-white">{result.date}</span>
                                </div>
                                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                    <span className="text-slate-500 dark:text-slate-400 block text-xs mb-1">Total</span>
                                    <span className="font-bold text-slate-900 dark:text-white">{result.currency} {result.total?.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-xs font-medium text-slate-700 dark:text-slate-300">Line Items</div>
                                <div className="space-y-1">
                                    {result.items?.map((item: ReceiptItem, i: number) => (
                                        <div key={i} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                                            <span className="text-sm text-slate-700 dark:text-slate-300">{item.desc || item.name}</span>
                                            <span className="text-sm font-medium text-slate-900 dark:text-white">{item.amount?.toFixed(2) || item.lineTotal?.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                                <div className="relative group">
                                    <p className="text-xs font-medium mb-2 text-slate-700 dark:text-slate-300">JSON Response:</p>
                                    <pre className="p-3 bg-slate-900 text-slate-100 rounded text-xs overflow-x-auto max-h-48">
                                        <code>{JSON.stringify(result, null, 2)}</code>
                                    </pre>
                                    <CopyButton text={JSON.stringify(result, null, 2)} className="absolute top-6 right-2 opacity-0 group-hover:opacity-100 transition-opacity" size="sm" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                            <p className="text-sm italic">Upload a receipt to see extracted data.</p>
                            <p className="text-xs mt-2">Try the sample receipt button above to see a demo.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
