'use client';

import { useState, useEffect, useRef } from "react";
import { initGuestSession } from "@/lib/auth/guest";
import { isSafeMode } from "@/lib/safe";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ConversionCTA } from "@/components/ConversionCTA";
import { TrustBadges } from "@/components/TrustBadges";
import { AnimatedPageWrapper } from "@/components/AnimatedPageWrapper";
import { AnimatedHero } from "@/components/AnimatedHero";
import { runDemoSimulation, DemoResult } from "../actions/playground";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, AlertTriangle, Play, RefreshCw, ArrowRight } from "lucide-react";

export default function Playground() {
  const [code, setCode] = useState(`import { Settler } from "@settler/sdk";

const client = new Settler({
  apiKey: "sk_your_api_key",
});

// Create a reconciliation job
const job = await client.jobs.create({
  name: "Shopify-Stripe Reconciliation",
  source: {
    adapter: "shopify",
    config: { apiKey: process.env.SHOPIFY_KEY },
  },
  target: {
    adapter: "stripe",
    config: { apiKey: process.env.STRIPE_KEY },
  },
  rules: {
    matching: [
      { field: "order_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
    ]
  }
});

const report = await client.jobs.run(job.data.id);
console.log(report.data.summary);`);

  const [output, setOutput] = useState<string>("// Click 'Run Code' to execute and see results here");
  const [isRunning, setIsRunning] = useState(false);
  const [demoResult, setDemoResult] = useState<DemoResult | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput("// Running...\n");
    
    // Simulate API call (in production, this would call your backend)
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        setOutput(`✅ Job created: job_abc123xyz
📊 Report Summary:
   Total: 150
   Matched: 145
   Unmatched: 3
   Conflicts: 2
   Accuracy: 98.7%

🎉 Reconciliation completed successfully!`);
        setIsRunning(false);
        resolve();
      }, 1500);
    });
  };

  const handleRunDemo = async () => {
    setDemoLoading(true);
    setDemoError(null);
    try {
      const result = await runDemoSimulation();
      setDemoResult(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to run demo";
      setDemoError(message);
    } finally {
      setDemoLoading(false);
    }
  };

  const playgroundRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSafeMode()) {
      initGuestSession().catch(console.error);
    }
  }, []);

  return (
    <AnimatedPageWrapper aria-label="Interactive playground">
      <Navigation />

      <AnimatedHero
        badge="Interactive Playground"
        title="Try Settler API"
        description="Experience the power of deterministic reconciliation. Run a simulation against our demo dataset or write code to test the SDK."
      />

      <section
        ref={playgroundRef}
        className="py-12 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          
          <Tabs defaultValue="visual" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="visual">Visual Simulation</TabsTrigger>
                <TabsTrigger value="code">Code Editor</TabsTrigger>
              </TabsList>
            </div>

            {/* VISUAL MODE */}
            <TabsContent value="visual" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Demo Environment</CardTitle>
                  <CardDescription>
                    Run a full reconciliation on a pre-generated dataset of 30 days of Stripe vs. Bank transactions.
                    See how our engine handles Payouts, Fees, and Anomalies.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                    {!demoResult && !demoLoading && !demoError && (
                      <div className="text-center">
                        <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                          <Play className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">Ready to Start?</h3>
                        <p className="text-slate-500 mb-6 max-w-md">
                          We'll load 1 month of transaction data (Stripe Charges, Payouts, Refunds) and reconcile it against a simulated Bank Ledger.
                        </p>
                        <Button size="lg" onClick={handleRunDemo} className="bg-blue-600 hover:bg-blue-700">
                          Run Simulation
                        </Button>
                      </div>
                    )}

                    {demoLoading && (
                      <div className="text-center py-12">
                        <RefreshCw className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
                        <p className="text-lg font-medium text-slate-700 dark:text-slate-300">Reconciling 150+ transactions...</p>
                        <p className="text-sm text-slate-500">Applying deterministic rules...</p>
                      </div>
                    )}

                    {demoError && (
                      <div className="text-center text-red-500">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                        <p className="font-medium">Error: {demoError}</p>
                        <Button variant="outline" onClick={handleRunDemo} className="mt-4">Try Again</Button>
                      </div>
                    )}

                    {demoResult && (
                      <div className="w-full space-y-8 animate-in fade-in duration-500">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <Card className="bg-white dark:bg-slate-800">
                            <CardContent className="pt-6 text-center">
                              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                {demoResult.summary.totalSource + demoResult.summary.totalTarget}
                              </div>
                              <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Total Records</div>
                            </CardContent>
                          </Card>
                          <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
                            <CardContent className="pt-6 text-center">
                              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {demoResult.summary.matched}
                              </div>
                              <div className="text-xs text-emerald-600/80 uppercase tracking-wide mt-1">Matched</div>
                            </CardContent>
                          </Card>
                          <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                            <CardContent className="pt-6 text-center">
                              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                {demoResult.summary.unmatchedSource + demoResult.summary.unmatchedTarget}
                              </div>
                              <div className="text-xs text-red-600/80 uppercase tracking-wide mt-1">Unmatched</div>
                            </CardContent>
                          </Card>
                          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                            <CardContent className="pt-6 text-center">
                              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {demoResult.summary.matchRate}
                              </div>
                              <div className="text-xs text-blue-600/80 uppercase tracking-wide mt-1">Match Rate</div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Matches List (Preview) */}
                        <div className="grid md:grid-cols-2 gap-8">
                          <div>
                            <h4 className="flex items-center gap-2 font-medium mb-4 text-emerald-600">
                              <CheckCircle2 className="w-5 h-5" /> Recent Matches (High Confidence)
                            </h4>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                              {demoResult.matches.map((m) => (
                                <div key={m.id} className="bg-white dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700 text-sm flex justify-between items-center">
                                  <div>
                                    <div className="font-medium">Amount: ${m.amount?.toFixed(2)}</div>
                                    <div className="text-xs text-slate-500">ID: {m.sourceId.slice(0,8)}... ↔ {m.targetId.slice(0,8)}...</div>
                                  </div>
                                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">
                                    {(m.confidence * 100).toFixed(0)}%
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Unmatched List */}
                          <div>
                            <h4 className="flex items-center gap-2 font-medium mb-4 text-red-600">
                              <XCircle className="w-5 h-5" /> Unmatched Items (Needs Review)
                            </h4>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                              {demoResult.unmatchedSource.map((u) => (
                                <div key={u.id} className="bg-white dark:bg-slate-800 p-3 rounded border border-red-200 dark:border-red-900/50 text-sm flex justify-between items-center">
                                  <div>
                                    <div className="font-medium">${u.amount?.toFixed(2)} {u.currency}</div>
                                    <div className="text-xs text-slate-500">{u.description || 'Unknown Transaction'}</div>
                                    <div className="text-[10px] text-slate-400 font-mono mt-1">{u.source} • {new Date(u.occurredAt).toLocaleDateString()}</div>
                                  </div>
                                  <Button variant="ghost" size="sm" className="h-6 text-xs text-red-600">
                                    Resolve <ArrowRight className="w-3 h-3 ml-1" />
                                  </Button>
                                </div>
                              ))}
                              {demoResult.unmatchedSource.length === 0 && (
                                <div className="text-center text-slate-500 py-8 italic">
                                  No unmatched items!
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-center pt-4">
                           <Button variant="outline" onClick={() => { setDemoResult(null); }}>
                             Reset Simulation
                           </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* CODE MODE */}
            <TabsContent value="code" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>SDK Code Editor</CardTitle>
                  <CardDescription>
                    Write and execute TypeScript code to interact with the Settler SDK directly.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="relative">
                       <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="w-full h-[400px] p-4 font-mono text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-slate-900 dark:bg-slate-950 text-blue-300 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent resize-none leading-[1.5]"
                        spellCheck={false}
                      />
                      <Button 
                        className="absolute bottom-4 right-4 z-10" 
                        onClick={handleRunCode}
                        disabled={isRunning}
                      >
                        {isRunning ? 'Running...' : 'Run Code'}
                      </Button>
                    </div>
                    <div className="bg-slate-900 dark:bg-slate-950 rounded-md p-4 h-[400px] overflow-auto border border-slate-300 dark:border-slate-700">
                      <pre className="font-mono text-sm text-green-400 whitespace-pre-wrap">{output}</pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-slate-800/50">
        <div className="max-w-7xl mx-auto text-center">
          <TrustBadges />
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <ConversionCTA
            title="Ready to Integrate?"
            description="Get your API key and start reconciling in minutes. 14-day free trial."
            primaryAction="Start Free Trial"
            primaryLink="/signup"
            secondaryAction="View Pricing"
            secondaryLink="/pricing"
            variant="gradient"
          />
        </div>
      </section>

      <Footer />
    </AnimatedPageWrapper>
  );
}
