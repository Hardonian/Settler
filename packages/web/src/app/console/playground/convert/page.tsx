"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RequestResponseViewer,
  type RequestResponseViewerProps,
} from "@/components/console/RequestResponseViewer";
import { UsageLimit } from "@/components/console/FeatureGate";
import { Calculator, ArrowRight, Play, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const currencies = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "INR", "BRL"];
const units = [
  "meter",
  "kilometer",
  "mile",
  "foot",
  "inch",
  "yard",
  "pound",
  "kilogram",
  "ounce",
  "gram",
];

interface ConversionResult {
  original: number;
  converted: number;
  from: string;
  to: string;
  rate: number;
  type: "currency" | "unit";
}

export default function ConvertPlayground() {
  const [conversionType, setConversionType] = useState<"currency" | "unit">("currency");
  const [value, setValue] = useState("100");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("EUR");
  const [fromUnit, setFromUnit] = useState("meter");
  const [toUnit, setToUnit] = useState("kilometer");
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [request, setRequest] = useState<RequestResponseViewerProps["request"]>();
  const [response, setResponse] = useState<RequestResponseViewerProps["response"]>();
  const [error, setError] = useState<RequestResponseViewerProps["error"]>();
  const [subscriptionTier, setSubscriptionTier] = useState<
    "free" | "pro" | "enterprise" | "unauthenticated"
  >("unauthenticated");
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    // Fetch subscription info
    fetch("/api/console/subscription")
      .then((res) => res.json())
      .then((data) => setSubscriptionTier(data.tier))
      .catch(() => {});
  }, []);

  const requestLimit =
    subscriptionTier === "unauthenticated"
      ? 10
      : subscriptionTier === "free"
        ? 50
        : subscriptionTier === "pro"
          ? 500
          : -1;

  const convert = async () => {
    // Check rate limits
    if (requestLimit !== -1 && requestCount >= requestLimit) {
      setError({
        message: `Daily request limit reached (${requestLimit} requests). Upgrade to Pro for unlimited requests.`,
        code: "RATE_LIMIT_EXCEEDED",
      });
      return;
    }

    // Validate input value
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      setError({
        message: "Please enter a valid positive number",
        code: "VALIDATION_ERROR",
      });
      return;
    }

    setIsRunning(true);
    setResult(null);
    setError(undefined);
    setResponse(undefined);

    const startTime = Date.now();
    const requestData = {
      method: "POST",
      url: "/api/v1/convert",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": "rk_your_api_key",
      },
      body:
        conversionType === "currency"
          ? { amount: parseFloat(value), from, to, type: "currency" }
          : { value: parseFloat(value), from: fromUnit, to: toUnit, type: "unit" },
    };
    setRequest(requestData);

    try {
      // Simulated delay for conversion
      await new Promise((resolve) => setTimeout(resolve, 500));

      const rate =
        conversionType === "currency"
          ? from === "USD" && to === "EUR"
            ? 0.925
            : from === "EUR" && to === "USD"
              ? 1.0811
              : from === "USD" && to === "GBP"
                ? 0.792
                : 1.0
          : fromUnit === "meter" && toUnit === "kilometer"
            ? 0.001
            : fromUnit === "kilometer" && toUnit === "meter"
              ? 1000
              : 1.0;

      const convertedValue = numValue * rate;

      const resultData: ConversionResult = {
        original: numValue,
        converted: convertedValue,
        from: conversionType === "currency" ? from : fromUnit,
        to: conversionType === "currency" ? to : toUnit,
        rate,
        type: conversionType,
      };

      setResult(resultData);
      setResponse({
        status: 200,
        statusText: "OK",
        body: resultData,
        duration: Date.now() - startTime,
      });
    } catch {
      const errorMessage =
        err instanceof Error
          ? err.name === "AbortError"
            ? "Conversion timed out"
            : err.message
          : "Conversion failed";
      setError({
        message: errorMessage,
        code: err instanceof Error && err.name === "AbortError" ? "TIMEOUT" : "CONVERSION_ERROR",
      });
    } finally {
      setIsRunning(false);
      setRequestCount((prev) => prev + 1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calculator className="w-6 h-6" />
            Conversion Playground
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Test currency and unit conversions with real-time calculations.
          </p>
        </div>
        {subscriptionTier !== "enterprise" && (
          <UsageLimit
            current={requestCount}
            limit={requestLimit}
            label="Requests today"
            tier={subscriptionTier}
            className="min-w-[200px]"
          />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Converter</CardTitle>
          <CardDescription>Convert between currencies or units</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={conversionType}
            onValueChange={(v) => setConversionType(v as "currency" | "unit")}
          >
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
                    {currencies.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
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
                    {currencies.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Button
                    onClick={convert}
                    disabled={
                      isRunning || !value || (requestLimit !== -1 && requestCount >= requestLimit)
                    }
                    size="lg"
                  >
                    {isRunning ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Converting...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Convert
                      </>
                    )}
                  </Button>
                  {requestLimit !== -1 && requestCount >= requestLimit && (
                    <p className="text-xs text-center text-amber-600 dark:text-amber-400">
                      Daily limit reached.{" "}
                      <Link href="/console/billing" className="underline">
                        Upgrade for more
                      </Link>
                    </p>
                  )}
                </div>
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
                    {units.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
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
                    {units.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Button
                    onClick={convert}
                    disabled={
                      isRunning || !value || (requestLimit !== -1 && requestCount >= requestLimit)
                    }
                    size="lg"
                  >
                    {isRunning ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Converting...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Convert
                      </>
                    )}
                  </Button>
                  {requestLimit !== -1 && requestCount >= requestLimit && (
                    <p className="text-xs text-center text-amber-600 dark:text-amber-400">
                      Daily limit reached.{" "}
                      <Link href="/console/billing" className="underline">
                        Upgrade for more
                      </Link>
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {result && (
            <div className="mt-8 p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border-2 border-green-200 dark:border-green-800 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Conversion Result
                </span>
              </div>
              <div className="text-4xl font-bold text-green-700 dark:text-green-400 mb-2">
                {result.converted.toFixed(4)}{" "}
                <span className="text-2xl text-slate-500 font-normal">{result.to}</span>
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {result.original} {result.from} × {result.rate.toFixed(6)} ={" "}
                {result.converted.toFixed(4)} {result.to}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request/Response Viewer */}
      {(request || response || error) && (
        <RequestResponseViewer request={request} response={response} error={error} />
      )}
    </div>
  );
}
