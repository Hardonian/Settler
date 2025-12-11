"use client";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ReceiptsPlayground() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const scanReceipt = () => {
    setScanning(true);
    setTimeout(() => {
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
        setScanning(false);
    }, 2000);
  }

  return (
    <div className="space-y-6">
        <div>
            <h2 className="text-2xl font-bold">Receipts Playground</h2>
            <p className="text-muted-foreground">Test the OCR and extraction engine.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader><CardTitle>Upload Receipt</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-12 text-center text-muted-foreground">
                            Drag and drop receipt image here
                        </div>
                        <Button onClick={scanReceipt} disabled={scanning} className="w-full">
                            {scanning ? 'Analyzing Receipt...' : 'Analyze Sample Receipt'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Extracted Data</CardTitle></CardHeader>
                <CardContent>
                    {result ? (
                        <div className="space-y-4 font-mono text-sm">
                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded">
                                <span className="text-slate-500 block text-xs">Merchant</span>
                                <span className="font-bold text-lg">{result.merchant}</span>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1 p-2 bg-slate-100 dark:bg-slate-800 rounded">
                                    <span className="text-slate-500 block text-xs">Date</span>
                                    <span>{result.date}</span>
                                </div>
                                <div className="flex-1 p-2 bg-slate-100 dark:bg-slate-800 rounded">
                                    <span className="text-slate-500 block text-xs">Total</span>
                                    <span className="font-bold">{result.currency} {result.total.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-xs text-slate-500">Line Items</div>
                                {result.items.map((item: any, i: number) => (
                                    <div key={i} className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1 last:border-0">
                                        <span>{item.desc}</span>
                                        <span>{item.amount.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-muted-foreground text-sm italic">Upload a receipt to see extracted data.</div>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
