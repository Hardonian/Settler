"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ConversionCTA } from "@/components/ConversionCTA";
import { AnimatedPageWrapper } from "@/components/AnimatedPageWrapper";
import { AnimatedHero } from "@/components/AnimatedHero";
import Link from "next/link";

export default function DocsCliPage() {
  return (
    <AnimatedPageWrapper aria-label="CLI Documentation page">
      <Navigation />

      <AnimatedHero
        badge="Command Line Interface"
        title="CLI Documentation"
        description="Command-line tool for reconciliation operations"
      />

      <section className="py-16 px-4 sm:px-6 lg:px-8" aria-labelledby="cli-content-heading">
        <div className="max-w-4xl mx-auto">
          <h2 id="cli-content-heading" className="sr-only">
            CLI Documentation Content
          </h2>

          <Card className="bg-white dark:bg-card border-border/40 dark:border-border mb-8">
            <CardHeader>
              <CardTitle className="text-2xl mb-2">Installation</CardTitle>
              <CardDescription>Install the Settler CLI tool</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">npm</h3>
                  <div className="bg-card dark:bg-card/80 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-green-400 text-sm">
                      <code>npm install -g @settler/cli</code>
                    </pre>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    yarn
                  </h3>
                  <div className="bg-card dark:bg-card/80 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-green-400 text-sm">
                      <code>yarn global add @settler/cli</code>
                    </pre>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    pnpm
                  </h3>
                  <div className="bg-card dark:bg-card/80 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-green-400 text-sm">
                      <code>pnpm add -g @settler/cli</code>
                    </pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-card border-border/40 dark:border-border mb-8">
            <CardHeader>
              <CardTitle className="text-2xl mb-2">Authentication</CardTitle>
              <CardDescription>Configure your API key</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Set your API key as an environment variable or use the configure command:
                </p>
                <div className="bg-card dark:bg-card/80 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-green-400 text-sm">
                    <code>{`export SETTLER_API_KEY=sk_...
# Or
settler configure`}</code>
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-card border-border/40 dark:border-border mb-8">
            <CardHeader>
              <CardTitle className="text-2xl mb-2">Commands</CardTitle>
              <CardDescription>Available CLI commands</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      COMMAND
                    </Badge>
                    <h3 className="text-lg font-semibold text-foreground">
                      settler jobs
                    </h3>
                  </div>
                  <p className="text-muted-foreground mb-2">
                    Manage reconciliation jobs
                  </p>
                  <div className="bg-card dark:bg-card/80 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-green-400 text-sm">
                      <code>{`settler jobs list
settler jobs create <config-file>
settler jobs get <job-id>
settler jobs run <job-id>`}</code>
                    </pre>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      COMMAND
                    </Badge>
                    <h3 className="text-lg font-semibold text-foreground">
                      settler reports
                    </h3>
                  </div>
                  <p className="text-muted-foreground mb-2">
                    View reconciliation reports
                  </p>
                  <div className="bg-card dark:bg-card/80 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-green-400 text-sm">
                      <code>{`settler reports get <job-id>
settler reports export <job-id> --format json`}</code>
                    </pre>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      COMMAND
                    </Badge>
                    <h3 className="text-lg font-semibold text-foreground">
                      settler adapters
                    </h3>
                  </div>
                  <p className="text-muted-foreground mb-2">List available adapters</p>
                  <div className="bg-card dark:bg-card/80 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-green-400 text-sm">
                      <code>settler adapters list</code>
                    </pre>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      COMMAND
                    </Badge>
                    <h3 className="text-lg font-semibold text-foreground">
                      settler webhooks
                    </h3>
                  </div>
                  <p className="text-muted-foreground mb-2">
                    Manage webhook subscriptions
                  </p>
                  <div className="bg-card dark:bg-card/80 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-green-400 text-sm">
                      <code>{`settler webhooks list
settler webhooks create <url>
settler webhooks delete <webhook-id>`}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>💡 Pro Tip:</strong> For more detailed documentation, see our{" "}
              <Link href="/docs" className="underline hover:text-blue-600 dark:hover:text-blue-300">
                main documentation
              </Link>{" "}
              or explore the{" "}
              <Link
                href="/cookbook"
                className="underline hover:text-blue-600 dark:hover:text-blue-300"
              >
                cookbooks
              </Link>{" "}
              for examples.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <ConversionCTA
            title="Ready to Get Started?"
            description="Start your 14-day free trial and get full access to all features. No credit card required."
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
