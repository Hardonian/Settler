"use client";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function ConvertPlayground() {
  const [value, setValue] = useState("100");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("EUR");
  const [result, setResult] = useState<string | null>(null);

  const convert = () => {
    setResult("92.50");
  }

  return (
    <div className="space-y-6">
        <div>
            <h2 className="text-2xl font-bold">Conversion Playground</h2>
            <p className="text-muted-foreground">Test currency and unit conversions.</p>
        </div>
        <Card>
            <CardHeader><CardTitle>Currency Converter</CardTitle></CardHeader>
            <CardContent>
                <div className="flex items-end gap-4">
                    <div className="space-y-2 flex-1">
                        <label className="text-sm font-medium">Amount</label>
                        <input 
                            type="number" 
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            className="w-full p-2 border rounded bg-slate-50 dark:bg-slate-900"
                        />
                    </div>
                    <div className="space-y-2 w-24">
                        <label className="text-sm font-medium">From</label>
                        <select 
                            value={from} onChange={(e) => setFrom(e.target.value)}
                            className="w-full p-2 border rounded bg-slate-50 dark:bg-slate-900"
                        >
                            <option>USD</option>
                            <option>EUR</option>
                            <option>GBP</option>
                        </select>
                    </div>
                    <div className="pb-3 text-slate-400">
                        <ArrowRight />
                    </div>
                    <div className="space-y-2 w-24">
                        <label className="text-sm font-medium">To</label>
                        <select 
                            value={to} onChange={(e) => setTo(e.target.value)}
                            className="w-full p-2 border rounded bg-slate-50 dark:bg-slate-900"
                        >
                            <option>USD</option>
                            <option>EUR</option>
                            <option>GBP</option>
                        </select>
                    </div>
                    <Button onClick={convert}>Convert</Button>
                </div>
                
                {result && (
                    <div className="mt-8 p-4 bg-slate-100 dark:bg-slate-800 rounded text-center">
                        <div className="text-sm text-slate-500 mb-1">Result</div>
                        <div className="text-3xl font-bold">
                            {result} <span className="text-xl text-slate-500 font-normal">{to}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-2">Rate: 0.9250</div>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
