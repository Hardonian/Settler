'use client';

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ConversionCTA } from "@/components/ConversionCTA";
import { TrustBadges } from "@/components/TrustBadges";
import { AnimatedPageWrapper } from "@/components/AnimatedPageWrapper";
import { AnimatedHero } from "@/components/AnimatedHero";

export default function Playground() {
  const [apiKey, setApiKey] = useState("");
  const [code, setCode] = useState(`import { Settler } from "@settler/sdk";

const client = new Settler({
  apiKey: "${apiKey || "sk_your_api_key"}",
});

// Create a reconciliation job
const job = await client.jobs.create({
  name: "Shopify-Stripe Reconciliation",
  source: {
    adapter: "shopify",
    config: {
      apiKey: process.env.SHOPIFY_API_KEY,
    },
  },
  target: {
    adapter: "stripe",
    config: {
      apiKey: process.env.STRIPE_SECRET_KEY,
    },
  },
  rules: {
    matching: [
      { field: "order_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
    ],
    conflictResolution: "last-wins",
  },
});

console.log("Job created:", job.data.id);

// Run the job and get report
const report = await client.jobs.run(job.data.id);
console.log("Report:", report.data.summary);
// {
//   total: 150,
//   matched: 145,
//   unmatched: 3,
//   conflicts: 2,
//   accuracy: 0.987
// }`);

  const [output, setOutput] = useState<string>("// Click 'Run Code' to execute and see results here");
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = async () => {
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

  const [isVisible, setIsVisible] = useState(false);
  const playgroundRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (playgroundRef.current) {
      observer.observe(playgroundRef.current);
    }

    return () => {
      if (playgroundRef.current) {
        observer.unobserve(playgroundRef.current);
      }
    };
  }, []);

  return (
    <AnimatedPageWrapper aria-label="Interactive playground">
      <Navigation />

      {/* Hero Section */}
      <AnimatedHero
        badge="Interactive Playground"
        title="Try Settler API"
        description="Test the API, see examples, and experiment with reconciliation jobs"
      />

      {/* Playground Content */}
      <section
        ref={playgroundRef}
        className="py-12 px-4 sm:px-6 lg:px-8"
        aria-labelledby="playground-heading"
      >
        <div className="max-w-7xl mx-auto">
          <h2 id="playground-heading" className="sr-only">
            Interactive Playground
          </h2>
          {/* API Key Input */}
          <Card
            className={`
              bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 mb-6
              transition-all duration-700
              ${isVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
              }
            `}
            role="region"
            aria-labelledby="api-config-heading"
          >
            <CardHeader>
              <CardTitle id="api-config-heading" className="text-slate-900 dark:text-white">
                API Configuration
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300">
                Enter your API key to test with real credentials, or leave empty for demo mode
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setCode(code.replace(/sk_your_api_key/g, e.target.value || "sk_your_api_key"));
                  }}
                  placeholder="sk_your_api_key"
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  aria-label="API key input"
                />
                <Button
                  onClick={handleRun}
                  disabled={isRunning}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 transition-all transform hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label={isRunning ? 'Running code' : 'Run code'}
                >
                  {isRunning ? 'Running...' : 'Run Code'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Code Editor and Output */}
          <div
            className={`
              grid grid-cols-1 lg:grid-cols-2 gap-6
              transition-all duration-700
              ${isVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
              }
            `}
            style={{ transitionDelay: '200ms' }}
          >
            {/* Code Editor */}
            <Card
              className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-all duration-300 hover:shadow-lg"
              role="region"
              aria-labelledby="editor-heading"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle id="editor-heading" className="text-slate-900 dark:text-white">
                    Code Editor
                  </CardTitle>
                  <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    TypeScript
                  </Badge>
                </div>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Edit the code below to experiment with the Settler API
                </CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-[500px] p-4 font-mono text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-slate-900 dark:bg-slate-950 text-green-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  spellCheck={false}
                  aria-label="Code editor"
                />
              </CardContent>
            </Card>

            {/* Output */}
            <Card
              className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-all duration-300 hover:shadow-lg"
              role="region"
              aria-labelledby="output-heading"
              aria-live="polite"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle id="output-heading" className="text-slate-900 dark:text-white">
                    Output
                  </CardTitle>
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                    Console
                  </Badge>
                </div>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Results and logs from your code execution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="w-full h-[500px] p-4 bg-slate-900 dark:bg-slate-950 text-green-400 font-mono text-sm rounded-md overflow-auto border border-slate-300 dark:border-slate-700"
                  role="log"
                  aria-label="Code execution output"
                >
                  <pre className="whitespace-pre-wrap">{output}</pre>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Examples */}
          <div
            className={`
              mt-8
              transition-all duration-700
              ${isVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
              }
            `}
            style={{ transitionDelay: '400ms' }}
          >
            <Card
              className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-all duration-300 hover:shadow-lg"
              role="region"
              aria-labelledby="examples-heading"
            >
              <CardHeader>
                <CardTitle id="examples-heading" className="text-slate-900 dark:text-white">
                  Quick Examples
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Try these pre-configured examples
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                  role="list"
                  aria-label="Quick example templates"
                >
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCode(`import { Settler } from "@settler/sdk";

const client = new Settler({
  apiKey: "${apiKey || "sk_your_api_key"}",
});

// QuickBooks to Stripe reconciliation
const job = await client.jobs.create({
  name: "QuickBooks-Stripe",
  source: { adapter: "quickbooks", config: { apiKey: "..." } },
  target: { adapter: "stripe", config: { apiKey: "..." } },
  rules: {
    matching: [
      { field: "transaction_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 }
    ]
  }
});

const report = await client.jobs.run(job.data.id);
console.log(report.data.summary);`);
                    }}
                    className="h-auto py-4 text-left transition-all transform hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    role="listitem"
                    aria-label="Load QuickBooks to Stripe example"
                  >
                    <div>
                      <div className="font-semibold mb-1">QuickBooks → Stripe</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Accounting to payments
                      </div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCode(`import { Settler } from "@settler/sdk";

const client = new Settler({
  apiKey: "${apiKey || "sk_your_api_key"}",
});

// PayPal to Shopify reconciliation
const job = await client.jobs.create({
  name: "PayPal-Shopify",
  source: { adapter: "paypal", config: { apiKey: "..." } },
  target: { adapter: "shopify", config: { apiKey: "..." } },
  rules: {
    matching: [
      { field: "order_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
      { field: "date", type: "range", days: 1 }
    ]
  }
});

const report = await client.jobs.run(job.data.id);
console.log(report.data.summary);`);
                    }}
                    className="h-auto py-4 text-left transition-all transform hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    role="listitem"
                    aria-label="Load PayPal to Shopify example"
                  >
                    <div>
                      <div className="font-semibold mb-1">PayPal → Shopify</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Payment to e-commerce
                      </div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCode(`import { Settler } from "@settler/sdk";

const client = new Settler({
  apiKey: "${apiKey || "sk_your_api_key"}",
});

// Real-time webhook reconciliation
const job = await client.jobs.create({
  name: "Real-time Webhook Sync",
  source: { adapter: "webhook", config: { endpoint: "..." } },
  target: { adapter: "stripe", config: { apiKey: "..." } },
  rules: {
    matching: [{ field: "id", type: "exact" }],
    realtime: true
  }
});

// Listen for webhook events
client.webhooks.on("reconciliation.complete", (event) => {
  console.log("Reconciliation complete:", event.data);
});`);
                    }}
                    className="h-auto py-4 text-left transition-all transform hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    role="listitem"
                    aria-label="Load real-time webhooks example"
                  >
                    <div>
                      <div className="font-semibold mb-1">Real-time Webhooks</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Live event reconciliation
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              Secure & Reliable
            </h2>
          </div>
          <TrustBadges />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <ConversionCTA
            title="Ready to Integrate?"
            description="Get your API key and start reconciling in minutes. Free tier available."
            primaryAction="Get API Key"
            primaryLink="/pricing"
            secondaryAction="View Documentation"
            secondaryLink="/docs"
            variant="gradient"
          />
        </div>
      </section>

      <Footer />
    </AnimatedPageWrapper>
  );
}
