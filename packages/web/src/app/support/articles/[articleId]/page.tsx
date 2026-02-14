"use client";

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ArticlePageProps {
  params: Promise<{ articleId: string }>;
}

const ARTICLES: Record<string, { title: string; content: string; categoryHref: string }> = {
  'quick-start': {
    title: 'Quick Start Guide',
    content: 'Connect your data sources, define matching keys, and run your first reconciliation in under five minutes.',
    categoryHref: '/support/category/getting-started',
  },
  'first-job': {
    title: 'Creating Your First Job',
    content: 'Create a job from the console, select source adapters, and configure schedule + retry settings safely.',
    categoryHref: '/support/category/getting-started',
  },
  'matching-rules': {
    title: 'Understanding Matching Rules',
    content: 'Use deterministic fields and priority order so matches remain explainable and repeatable across runs.',
    categoryHref: '/support/category/getting-started',
  },
  'stripe-setup': {
    title: 'Setting Up Stripe',
    content: 'Generate restricted API keys in Stripe, store them in secure env vars, and validate webhook signatures.',
    categoryHref: '/support/category/integrations',
  },
  'shopify-setup': {
    title: 'Setting Up Shopify',
    content: 'Create a private app, grant least-privilege scopes, and verify order + payout data synchronization.',
    categoryHref: '/support/category/integrations',
  },
  troubleshooting: {
    title: 'Troubleshooting Connections',
    content: 'Check credentials, network allowlists, and adapter logs before retrying ingestion to avoid duplicate work.',
    categoryHref: '/support/category/integrations',
  },
  billing: {
    title: 'Understanding Your Bill',
    content: 'Usage is measured by reconciled records and processed jobs; review plan limits in your billing console.',
    categoryHref: '/support/category/billing',
  },
  upgrade: {
    title: 'Upgrading Your Plan',
    content: 'Plan changes are prorated. Upgrade before peak volume windows to prevent throttling.',
    categoryHref: '/support/category/billing',
  },
  'payment-issues': {
    title: 'Payment Issues',
    content: 'Retry failed payments after updating billing details; if the issue persists, contact support with invoice ID.',
    categoryHref: '/support/category/billing',
  },
};

export default function SupportArticlePage({ params }: ArticlePageProps) {
  const { articleId } = use(params);
  const article = ARTICLES[articleId];

  if (!article) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 py-16">
          <Card>
            <CardHeader>
              <CardTitle>Article not found</CardTitle>
              <CardDescription>The requested support article does not exist.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/support">Back to Support Center</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 py-16">
        <Button asChild variant="ghost" className="mb-6">
          <Link href={article.categoryHref}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Category
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{article.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 dark:text-slate-300">{article.content}</p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
