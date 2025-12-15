/**
 * Go SDK Documentation Page
 */

import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CodeBlock } from '@/components/ui/code-block';
import Link from 'next/link';
import { Package, Code2, Zap, Shield } from 'lucide-react';

export default function GoSDKPage() {
  const features = [
    { icon: Code2, title: 'Go Idiomatic', description: 'Follows Go best practices and conventions' },
    { icon: Zap, title: 'Concurrent Safe', description: 'Safe for concurrent use with goroutines' },
    { icon: Shield, title: 'Strong Typing', description: 'Full type safety with Go interfaces' },
    { icon: Package, title: 'Minimal Dependencies', description: 'Lightweight with minimal external deps' },
  ];

  const installationCode = `go get github.com/settler/settler-go`;

  const quickstartCode = `package main

import (
	"fmt"
	"log"
	
	"github.com/settler/settler-go/settler"
)

func main() {
	// Initialize client
	client, err := settler.NewClient("sk_your_api_key")
	if err != nil {
		log.Fatal(err)
	}

	// Create a reconciliation job
	job, err := client.Jobs().Create(settler.CreateJobRequest{
		Name: "Shopify-Stripe Reconciliation",
		Source: settler.AdapterConfig{
			Adapter: "shopify",
			Config: map[string]interface{}{
				"api_key": "your_shopify_api_key",
				"shop":     "your-shop",
			},
		},
		Target: settler.AdapterConfig{
			Adapter: "stripe",
			Config: map[string]interface{}{
				"api_key": "sk_your_stripe_key",
			},
		},
		Rules: settler.MatchingRules{
			Matching: []settler.MatchingRule{
				{Field: "order_id", Type: "exact"},
				{Field: "amount", Type: "exact", Tolerance: 0.01},
			},
		},
	})
	if err != nil {
		log.Fatal(err)
	}

	// Run the job
	execution, err := client.Jobs().Run(job.ID)
	if err != nil {
		log.Fatal(err)
	}

	// Get report
	report, err := client.Reports().Get(job.ID, "")
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("Matched: %d\\n", report.Summary.Matched)
}`;

  const errorHandlingCode = `import (
	"github.com/settler/settler-go/settler"
	"github.com/settler/settler-go/errors"
)

job, err := client.Jobs().Create(req)
if err != nil {
	switch e := err.(type) {
	case *errors.ValidationError:
		fmt.Printf("Validation error: %s\\n", e.Message)
		fmt.Printf("Field: %s\\n", e.Field)
	case *errors.AuthError:
		fmt.Printf("Authentication failed: %s\\n", e.Message)
	case *errors.RateLimitError:
		fmt.Printf("Rate limit exceeded. Retry after: %v\\n", e.RetryAfter)
	case *errors.NetworkError:
		fmt.Printf("Network error: %s\\n", e.Message)
	default:
		fmt.Printf("Error: %s\\n", err)
	}
}`;

  const contextCode = `import (
	"context"
	"time"
)

// Use context for timeouts and cancellation
ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
defer cancel()

job, err := client.Jobs().CreateWithContext(ctx, req)
if err != nil {
	if err == context.DeadlineExceeded {
		fmt.Println("Request timed out")
	}
}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        <Breadcrumbs items={[
          { label: 'Docs', href: '/docs' },
          { label: 'SDK', href: '/docs/sdk' },
          { label: 'Go' },
        ]} />

        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <Badge className="bg-blue-600">Official SDK</Badge>
            <Badge variant="outline">Go 1.21+</Badge>
            <Badge variant="outline">Context Support</Badge>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Go SDK
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
            Production-grade Go SDK with context support and concurrent safety.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index}>
                <CardHeader>
                  <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Installation */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Installation</CardTitle>
            <CardDescription>Install using go get</CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock code={installationCode} language="bash" />
          </CardContent>
        </Card>

        {/* Quick Start */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>Get started in 5 minutes</CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock code={quickstartCode} language="go" />
          </CardContent>
        </Card>

        {/* Examples */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Examples</CardTitle>
            <CardDescription>Common use cases and patterns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Error Handling</h3>
              <CodeBlock code={errorHandlingCode} language="go" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Context Support</h3>
              <CodeBlock code={contextCode} language="go" />
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <div className="flex gap-4">
          <Button asChild>
            <Link href="/console/playground">
              Try in Playground
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/docs/sdk/nodejs">
              Node.js SDK →
            </Link>
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
