/**
 * Receipts API Marketing Page
 *
 * Product page for Settler Receipts API - converts receipt images/PDFs to structured JSON.
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Receipt, Code, Zap, Shield } from "lucide-react";

export default function ReceiptsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-electric-cyan/10 mb-6">
            <Receipt className="w-8 h-8 text-electric-cyan" />
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-electric-cyan to-electric-blue bg-clip-text text-transparent">
            Receipts → JSON API
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Turn receipt images and PDFs into structured JSON. Built for bookkeeping tools, AI
            agents, and fintech apps that need reliable receipt parsing.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg" className="bg-electric-cyan hover:bg-electric-cyan/90">
              <Link href="/docs/api">View API Docs</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/console/playground/receipts">Try Playground</Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="p-6 rounded-lg border border-border/40 bg-white">
            <Code className="w-8 h-8 text-electric-cyan mb-4" />
            <h3 className="text-xl font-semibold mb-2">Structured JSON</h3>
            <p className="text-muted-foreground">
              Get clean, normalized JSON with vendor, date, totals, line items, and more. No manual
              parsing required.
            </p>
          </div>
          <div className="p-6 rounded-lg border border-border/40 bg-white">
            <Zap className="w-8 h-8 text-electric-purple mb-4" />
            <h3 className="text-xl font-semibold mb-2">Fast & Reliable</h3>
            <p className="text-muted-foreground">
              Process receipts in seconds. Availability and SLAs are contractual and monitored per
              deployment — see the public status page for point-in-time connectivity only.
            </p>
          </div>
          <div className="p-6 rounded-lg border border-border/40 bg-white">
            <Shield className="w-8 h-8 text-electric-indigo mb-4" />
            <h3 className="text-xl font-semibold mb-2">Type-Safe</h3>
            <p className="text-muted-foreground">
              Fully typed TypeScript SDK. Predictable responses, clear error handling, and
              comprehensive documentation.
            </p>
          </div>
        </div>

        {/* Example */}
        <div className="bg-card rounded-lg p-8 mb-16">
          <h2 className="text-2xl font-bold text-white mb-4">Example Response</h2>
          <pre className="text-sm text-muted-foreground/40 overflow-x-auto">
            {`{
  "id": "rec_abc123",
  "vendor": "ACME Grocery",
  "date": "2024-01-15T14:30:00Z",
  "currency": "USD",
  "subtotal": 11.48,
  "tax": 0.92,
  "total": 12.40,
  "paymentMethod": "Credit Card",
  "confidenceScore": 0.95,
  "items": [
    {
      "name": "Apples",
      "quantity": 1,
      "unitPrice": 2.99,
      "lineTotal": 2.99
    },
    {
      "name": "Bread",
      "quantity": 2,
      "unitPrice": 1.75,
      "lineTotal": 3.50
    }
  ]
}`}
          </pre>
        </div>

        {/* Use Cases */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Perfect For</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-lg bg-muted/10">
              <h3 className="text-xl font-semibold mb-2">Bookkeeping Tools</h3>
              <p className="text-muted-foreground">
                Automatically extract expense data from receipts for accounting software
                integration.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-muted/10">
              <h3 className="text-xl font-semibold mb-2">AI Agents</h3>
              <p className="text-muted-foreground">
                Give your AI assistant the ability to read and understand receipts for expense
                tracking.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-muted/10">
              <h3 className="text-xl font-semibold mb-2">Fintech Apps</h3>
              <p className="text-muted-foreground">
                Build expense management features without building OCR infrastructure from scratch.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-muted/10">
              <h3 className="text-xl font-semibold mb-2">Business Intelligence</h3>
              <p className="text-muted-foreground">
                Aggregate spending data from receipts for analytics and reporting dashboards.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-electric-cyan to-electric-blue rounded-lg p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg mb-6 opacity-90">
            Start parsing receipts in minutes. No credit card required for the first 100 requests.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link href="/console/playground/receipts">Try Playground</Link>
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
