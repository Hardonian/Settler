"use client";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RequestResponseViewer, type RequestResponseViewerProps } from '@/components/console/RequestResponseViewer';
import { Badge } from '@/components/ui/badge';
import { Calculator, ArrowRight, Play, Loader2, CheckCircle2 } from 'lucide-react';

const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'];
const units = ['meter', 'kilometer', 'mile', 'foot', 'inch', 'yard', 'pound', 'kilogram', 'ounce', 'gram'];

interface ConversionResult {
  original: number;
  converted: number;
  from: string;
  to: string;
  rate: number;
  type: 'currency' | 'unit';
}

export default function ConvertPlayground() {
  const [conversionType, setConversionType] = useState<'currency' | 'unit'>('currency');
  const [value, setValue] = useState("100");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("EUR");
  const [fromUnit, setFromUnit] = useState("meter");
  const [toUnit, setToUnit] = useState("kilometer");
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [request, setRequest] = useState<RequestResponseViewerProps['request']>();
  const [response, setResponse] = useState<RequestResponseViewerProps['response']>();
  const [error, setError] = useState<RequestResponseViewerProps['error']>();

  const convert = async () => {
    setIsRunning(true);
    setResult(null);
    setError(null);
    setResponse(null);

    const startTime = Date.now();
    const requestData = {
      method: 'POST',
      url: '/api/v1/convert',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'rk_your_api_key'
      },
      body: conversionType === 'currency' 
        ? { amount: parseFloat(value), from, to, type: 'currency' }
        : { value: parseFloat(value), from: fromUnit, to: toUnit, type: 'unit' }
    };
    setRequest(requestData);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const rate = conversionType === 'currency' 
        ? (from === 'USD' && to === 'EUR' ? 0.9250 : 
           from === 'EUR' && to === 'USD' ? 1.0811 :
           from === 'USD' && to === 'GBP' ? 0.7920 : 1.0)
        : (fromUnit === 'meter' && toUnit === 'kilometer' ? 0.001 :
           fromUnit === 'kilometer' && toUnit === 'meter' ? 1000 : 1.0);

      const convertedValue = parseFloat(value) * rate;
      
      const resultData = {
        original: parseFloat(value),
        converted: convertedValue,
        from: conversionType === 'currency' ? from : fromUnit,
        to: conversionType === 'currency' ? to : toUnit,
        rate,
        type: conversionType
      };

      setResult(resultData);
      setResponse({
        status: 200,
        statusText: 'OK',
        body: resultData,
        duration: Date.now() - startTime
      });
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Conversion failed',
        code: 'CONVERSION_ERROR'
      });
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="space-y-6">
        <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calculator className="w-6 h-6" />
                Conversion Playground
            </h2>
            <p className="text-slate-600 dark:text-slate-400">Test currency and unit conversions with real-time calculations.</p>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>Converter</CardTitle>
                <CardDescription>Convert between currencies or units</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={conversionType} onValueChange={(v) => setConversionType(v as 'currency' | 'unit')}>
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="currency">Currency</TabsTrigger>
                        <TabsTrigger value="unit">Units</TabsTrigger>
                    </TabsList>

                    <TabsContent value="currency" className="space-y-4">
                        <div className="flex items-end gap-4">
                            <div className="space-y-2 flex-1">
                                <Label htmlFor="amount">Amount</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    placeholder="100"
                                    className="text-lg"
                                />
                            </div>
                            <div className="space-y-2 w-32">
                                <Label htmlFor="from-currency">From</Label>
                                <select
                                    id="from-currency"
                                    value={from}
                                    onChange={(e) => setFrom(e.target.value)}
                                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                >
                                    {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="pb-3 text-slate-400">
                                <ArrowRight className="w-5 h-5" />
                            </div>
                            <div className="space-y-2 w-32">
                                <Label htmlFor="to-currency">To</Label>
                                <select
                                    id="to-currency"
                                    value={to}
                                    onChange={(e) => setTo(e.target.value)}
                                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                >
                                    {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <Button 
                                onClick={convert} 
                                disabled={isRunning || !value}
                                size="lg"
                            >
                                {isRunning ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Play className="w-4 h-4" />
                                )}
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="unit" className="space-y-4">
                        <div className="flex items-end gap-4">
                            <div className="space-y-2 flex-1">
                                <Label htmlFor="unit-value">Value</Label>
                                <Input
                                    id="unit-value"
                                    type="number"
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    placeholder="100"
                                    className="text-lg"
                                />
                            </div>
                            <div className="space-y-2 w-40">
                                <Label htmlFor="from-unit">From</Label>
                                <select
                                    id="from-unit"
                                    value={fromUnit}
                                    onChange={(e) => setFromUnit(e.target.value)}
                                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                >
                                    {units.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                            <div className="pb-3 text-slate-400">
                                <ArrowRight className="w-5 h-5" />
                            </div>
                            <div className="space-y-2 w-40">
                                <Label htmlFor="to-unit">To</Label>
                                <select
                                    id="to-unit"
                                    value={toUnit}
                                    onChange={(e) => setToUnit(e.target.value)}
                                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                >
                                    {units.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                            <Button 
                                onClick={convert} 
                                disabled={isRunning || !value}
                                size="lg"
                            >
                                {isRunning ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Play className="w-4 h-4" />
                                )}
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
                
                {result && (
                    <div className="mt-8 p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border-2 border-green-200 dark:border-green-800 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <span className="text-sm text-slate-600 dark:text-slate-400">Conversion Result</span>
                        </div>
                        <div className="text-4xl font-bold text-green-700 dark:text-green-400 mb-2">
                            {result.converted.toFixed(4)} <span className="text-2xl text-slate-500 font-normal">{result.to}</span>
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                            {result.original} {result.from} × {result.rate.toFixed(6)} = {result.converted.toFixed(4)} {result.to}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>

        {/* Request/Response Viewer */}
        {(request || response || error) && (
            <RequestResponseViewer
                request={request}
                response={response}
                error={error}
            />
        )}
    </div>
  );
}
