"use client";

import { use } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AnimatedPageWrapper } from "@/components/AnimatedPageWrapper";
import { AnimatedHero } from "@/components/AnimatedHero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, BookOpen, Code2, Settings } from "lucide-react";

interface IntegrationDocsPageProps {
  params: Promise<{ integrationId: string }>;
}

const integrationInfo: Record<
  string,
  {
    name: string;
    description: string;
    category: string;
    status: "available" | "beta" | "coming-soon";
    docs: {
      overview: string;
      setup: string;
      configuration: string;
      examples: string;
    };
  }
> = {
  stripe: {
    name: "Stripe",
    description: "Payment processing platform",
    category: "Payment Processor",
    status: "available",
    docs: {
      overview:
        "Stripe is a payment processing platform that allows you to accept payments online. Settler can reconcile Stripe payments with orders from e-commerce platforms or accounting systems.",
      setup:
        "To connect Stripe, you'll need your Stripe API key. Navigate to your Stripe Dashboard > Developers > API keys to find your secret key.",
      configuration:
        "Configure the Stripe adapter with your API key. The adapter supports both test and live modes.",
      examples:
        "Common use cases include reconciling Stripe charges with Shopify orders, matching Stripe payouts with bank deposits, and syncing Stripe subscriptions with accounting systems.",
    },
  },
  shopify: {
    name: "Shopify",
    description: "E-commerce platform",
    category: "E-commerce Platform",
    status: "available",
    docs: {
      overview:
        "Shopify is a leading e-commerce platform. Settler can reconcile Shopify orders with payment processors, shipping providers, and accounting systems.",
      setup:
        "To connect Shopify, you'll need to create a private app in your Shopify admin. Go to Settings > Apps and sales channels > Develop apps > Create an app.",
      configuration:
        "Configure the Shopify adapter with your shop domain and access token. The adapter supports both Shopify and Shopify Plus.",
      examples:
        "Common use cases include reconciling Shopify orders with Stripe payments, matching Shopify refunds with payment processor refunds, and syncing Shopify sales with QuickBooks.",
    },
  },
  paypal: {
    name: "PayPal",
    description: "Payment processing platform",
    category: "Payment Processor",
    status: "available",
    docs: {
      overview:
        "PayPal is a widely used payment processing platform. Settler can reconcile PayPal transactions with orders and accounting systems.",
      setup:
        "To connect PayPal, you'll need to create a PayPal app and obtain your client ID and secret. Visit the PayPal Developer Dashboard to create an app.",
      configuration:
        "Configure the PayPal adapter with your client ID and secret. The adapter supports both sandbox and production environments.",
      examples:
        "Common use cases include reconciling PayPal payments with WooCommerce orders, matching PayPal payouts with bank deposits, and syncing PayPal transactions with Xero.",
    },
  },
  quickbooks: {
    name: "QuickBooks",
    description: "Accounting software",
    category: "Accounting System",
    status: "available",
    docs: {
      overview:
        "QuickBooks is a popular accounting software. Settler can reconcile QuickBooks transactions with payment processors and e-commerce platforms.",
      setup:
        "To connect QuickBooks, you'll need to create a QuickBooks app and obtain OAuth credentials. Visit the Intuit Developer Portal to create an app.",
      configuration:
        "Configure the QuickBooks adapter with your OAuth credentials. The adapter supports both QuickBooks Online and QuickBooks Desktop.",
      examples:
        "Common use cases include reconciling Stripe payments with QuickBooks invoices, matching Shopify sales with QuickBooks sales receipts, and syncing PayPal transactions with QuickBooks bank deposits.",
    },
  },
  xero: {
    name: "Xero",
    description: "Accounting software",
    category: "Accounting System",
    status: "available",
    docs: {
      overview:
        "Xero is a cloud-based accounting software. Settler can reconcile Xero transactions with payment processors and e-commerce platforms.",
      setup:
        "To connect Xero, you'll need to create a Xero app and obtain OAuth credentials. Visit the Xero Developer Portal to create an app.",
      configuration:
        "Configure the Xero adapter with your OAuth credentials. The adapter supports all Xero subscription types.",
      examples:
        "Common use cases include reconciling Stripe payments with Xero invoices, matching Shopify sales with Xero sales invoices, and syncing PayPal transactions with Xero bank transactions.",
    },
  },
};

export default function IntegrationDocsPage({ params }: IntegrationDocsPageProps) {
  const { integrationId } = use(params);
  const integration = integrationInfo[integrationId.toLowerCase()];

  if (!integration) {
    return (
      <AnimatedPageWrapper aria-label="Integration Documentation page">
        <Navigation />
        <AnimatedHero
          badge="Integration Not Found"
          title="Integration Documentation"
          description="The requested integration documentation could not be found."
        />
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardContent className="p-8">
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                  The integration "{integrationId}" was not found. Please check the integration name
                  or request a new integration.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button asChild>
                    <Link href="/docs">View All Documentation</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/integrations/request">Request Integration</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        <Footer />
      </AnimatedPageWrapper>
    );
  }

  return (
    <AnimatedPageWrapper aria-label={`${integration.name} Integration Documentation`}>
      <Navigation />

      <AnimatedHero
        badge={integration.category}
        title={`${integration.name} Integration`}
        description={integration.description}
      />

      <section className="py-16 px-4 sm:px-6 lg:px-8" aria-labelledby="integration-docs-heading">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button asChild variant="outline">
              <Link href="/docs">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Documentation
              </Link>
            </Button>
          </div>

          <div className="mb-6">
            <Badge
              className={
                integration.status === "available"
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  : integration.status === "beta"
                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300"
              }
            >
              {integration.status === "available"
                ? "Available"
                : integration.status === "beta"
                  ? "Beta"
                  : "Coming Soon"}
            </Badge>
          </div>

          <div className="space-y-6">
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  <CardTitle>Overview</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">{integration.docs.overview}</p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  <CardTitle>Setup & Configuration</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2 text-slate-900 dark:text-white">Setup</h3>
                  <p className="text-slate-600 dark:text-slate-300">{integration.docs.setup}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-slate-900 dark:text-white">
                    Configuration
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    {integration.docs.configuration}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Code2 className="w-5 h-5" />
                  <CardTitle>Examples & Use Cases</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">{integration.docs.examples}</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Need more help?</h3>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
              Check out our comprehensive documentation or reach out to our support team.
            </p>
            <div className="flex gap-4">
              <Button asChild variant="outline" size="sm">
                <Link href="/docs">View Full Docs</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/support">Get Support</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/console/playground">Try Playground</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </AnimatedPageWrapper>
  );
}
