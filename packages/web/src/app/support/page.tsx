"use client";

import { useState } from "react";
import { Search, Book, MessageCircle, FileText, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { AnimatedPageWrapper } from "@/components/AnimatedPageWrapper";

const CATEGORIES = [
  {
    id: "getting-started",
    name: "Getting Started",
    icon: Book,
    articles: [
      { id: "1", title: "Quick Start Guide", href: "/support/articles/quick-start" },
      { id: "2", title: "Creating Your First Job", href: "/support/articles/first-job" },
      { id: "3", title: "Understanding Matching Rules", href: "/support/articles/matching-rules" },
    ],
  },
  {
    id: "integrations",
    name: "Integrations",
    icon: HelpCircle,
    articles: [
      { id: "4", title: "Setting Up Stripe", href: "/support/articles/stripe-setup" },
      { id: "5", title: "Setting Up Shopify", href: "/support/articles/shopify-setup" },
      { id: "6", title: "Troubleshooting Connections", href: "/support/articles/troubleshooting" },
    ],
  },
  {
    id: "billing",
    name: "Billing & Plans",
    icon: FileText,
    articles: [
      { id: "7", title: "Understanding Your Bill", href: "/support/articles/billing" },
      { id: "8", title: "Upgrading Your Plan", href: "/support/articles/upgrade" },
      { id: "9", title: "Payment Issues", href: "/support/articles/payment-issues" },
    ],
  },
];

const POPULAR_ARTICLES = [
  { id: "1", title: "Quick Start Guide", category: "Getting Started", views: 1250 },
  { id: "4", title: "Setting Up Stripe", category: "Integrations", views: 980 },
  { id: "7", title: "Understanding Your Bill", category: "Billing", views: 750 },
];

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <AnimatedPageWrapper aria-label="Support center">
      <Navigation />

      {/* Hero */}
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-slate-900 dark:text-white">
            How can we help you?
          </h1>
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="search"
              placeholder="Search for help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16 text-slate-900 dark:text-white">
            Browse by Category
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <Card key={category.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <CardTitle>{category.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2.5">
                      {category.articles.map((article) => (
                        <li key={article.id}>
                          <Link
                            href={`/support/category/${category.id}`}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline leading-relaxed"
                          >
                            {article.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Button asChild variant="outline" className="w-full mt-5" size="sm">
                      <Link href={`/support/category/${category.id}`}>View All</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16 text-slate-900 dark:text-white">
            Popular Articles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {POPULAR_ARTICLES.map((article) => (
              <Card key={article.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">{article.title}</CardTitle>
                  <CardDescription>{article.category}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                    <span>{article.views} views</span>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/support/category/getting-started`}>Read →</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <MessageCircle className="w-6 h-6" />
                Still Need Help?
              </CardTitle>
              <CardDescription>Our support team is here to help you 24/7</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="flex-1">
                  <Link href="/support/contact">Contact Support</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="flex-1">
                  <Link href="/community">Ask Community</Link>
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
