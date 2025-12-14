/**
 * Use Case Landing Page
 * High-intent landing pages for specific use cases
 */

import { Metadata } from "next";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, Zap, Shield, BarChart3 } from "lucide-react";
import Link from "next/link";

const useCases: Record<
  string,
  {
    title: string;
    description: string;
    hero: string;
    features: string[];
    benefits: Array<{ title: string; description: string; icon: React.ComponentType }>;
    cta: string;
  }
> = {
  "ecommerce-reconciliation": {
    title: "E-commerce Reconciliation",
    description: "Automatically match orders, payments, and fulfillment across Shopify, Stripe, and your database",
    hero: "Stop manually reconciling e-commerce transactions. Settler automatically matches orders with payments, handles refunds, and tracks fulfillment—all in real-time.",
    features: [
      "Match Shopify orders with Stripe payments",
      "Handle refunds and chargebacks automatically",
      "Track fulfillment status across platforms",
      "Export reconciliation reports for accounting",
    ],
    benefits: [
      {
        title: "Save 10+ Hours/Week",
        description: "Automate manual reconciliation work",
        icon: Zap,
      },
      {
        title: "100% Accuracy",
        description: "Eliminate human error in matching",
        icon: Shield,
      },
      {
        title: "Real-Time Insights",
        description: "See discrepancies immediately",
        icon: BarChart3,
      },
    ],
    cta: "Start Free Trial",
  },
  "payment-reconciliation": {
    title: "Payment Reconciliation",
    description: "Reconcile payments across Stripe, PayPal, and your accounting system",
    hero: "Automatically match payments between payment processors and your accounting system. Handle multi-currency transactions, fees, and refunds with confidence.",
    features: [
      "Match Stripe/PayPal payments with QuickBooks/Xero",
      "Handle currency conversion automatically",
      "Track payment fees and refunds",
      "Generate audit-ready reports",
    ],
    benefits: [
      {
        title: "Automated Matching",
        description: "AI-powered transaction matching",
        icon: Zap,
      },
      {
        title: "Multi-Currency",
        description: "Handle FX rates automatically",
        icon: Shield,
      },
      {
        title: "Audit Trail",
        description: "Complete transaction history",
        icon: BarChart3,
      },
    ],
    cta: "Start Free Trial",
  },
  "receipt-processing": {
    title: "Receipt Processing",
    description: "Extract structured data from receipts and invoices with AI-powered OCR",
    hero: "Turn PDFs and images into structured JSON. Extract vendors, dates, totals, and line items instantly with Settler's AI-powered receipt parsing.",
    features: [
      "Parse receipts from PDFs and images",
      "Extract vendor, date, total, line items",
      "Support for 50+ receipt formats",
      "Export to JSON, CSV, or accounting systems",
    ],
    benefits: [
      {
        title: "99% Accuracy",
        description: "AI-powered extraction",
        icon: Zap,
      },
      {
        title: "Instant Processing",
        description: "Results in seconds",
        icon: Shield,
      },
      {
        title: "Structured Data",
        description: "Ready for integration",
        icon: BarChart3,
      },
    ],
    cta: "Try Receipt Parser",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const useCase = useCases[slug];

  if (!useCase) {
    return {
      title: "Use Case Not Found",
    };
  }

  return {
    title: `${useCase.title} | Settler`,
    description: useCase.description,
    openGraph: {
      title: `${useCase.title} | Settler`,
      description: useCase.description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${useCase.title} | Settler`,
      description: useCase.description,
    },
  };
}

export default async function UseCasePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const useCase = useCases[slug];

  if (!useCase) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Use Case Not Found</h1>
          <Link href="/" className="text-blue-600 hover:underline">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900 dark:text-white">
            {useCase.title}
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
            {useCase.hero}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Link href="/signup">{useCase.cta}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/docs/getting-started">View Documentation</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center text-slate-900 dark:text-white">
            What You Get
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {useCase.features.map((feature, i) => (
              <Card key={i} className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    {feature}
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center text-slate-900 dark:text-white">
            Why Settler?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {useCase.benefits.map((benefit, i) => {
              const Icon = benefit.icon;
              return (
                <Card key={i} className="text-center border-2">
                  <CardHeader>
                    <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle>{benefit.title}</CardTitle>
                    <CardDescription>{benefit.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Start your free 14-day trial. No credit card required.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-white text-blue-600 hover:bg-blue-50"
          >
            <Link href="/signup">
              Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
