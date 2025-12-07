"use client";

import { use } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const CATEGORY_ARTICLES: Record<
  string,
  Array<{ id: string; title: string; description: string; href: string }>
> = {
  "getting-started": [
    {
      id: "1",
      title: "Quick Start Guide",
      description: "Get up and running with Settler in 5 minutes",
      href: "/support/articles/quick-start",
    },
    {
      id: "2",
      title: "Creating Your First Job",
      description: "Step-by-step guide to creating your first reconciliation job",
      href: "/support/articles/first-job",
    },
    {
      id: "3",
      title: "Understanding Matching Rules",
      description: "Learn how to configure matching rules for accurate reconciliation",
      href: "/support/articles/matching-rules",
    },
  ],
  integrations: [
    {
      id: "4",
      title: "Setting Up Stripe",
      description: "Connect your Stripe account to Settler",
      href: "/support/articles/stripe-setup",
    },
    {
      id: "5",
      title: "Setting Up Shopify",
      description: "Connect your Shopify store to Settler",
      href: "/support/articles/shopify-setup",
    },
    {
      id: "6",
      title: "Troubleshooting Connections",
      description: "Common issues and solutions for integration connections",
      href: "/support/articles/troubleshooting",
    },
  ],
  billing: [
    {
      id: "7",
      title: "Understanding Your Bill",
      description: "Learn how Settler billing works",
      href: "/support/articles/billing",
    },
    {
      id: "8",
      title: "Upgrading Your Plan",
      description: "How to upgrade to a higher plan",
      href: "/support/articles/upgrade",
    },
    {
      id: "9",
      title: "Payment Issues",
      description: "Troubleshoot payment and billing problems",
      href: "/support/articles/payment-issues",
    },
  ],
};

export default function CategoryPage({ params }: { params: Promise<{ categoryId: string }> }) {
  const { categoryId } = use(params);
  const articles = CATEGORY_ARTICLES[categoryId] || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/support">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Support
          </Link>
        </Button>

        <h1 className="text-4xl font-bold mb-8 text-slate-900 dark:text-white capitalize">
          {categoryId.replace("-", " ")}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <Card key={article.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{article.title}</CardTitle>
                <CardDescription>{article.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href={article.href}>Read Article</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
