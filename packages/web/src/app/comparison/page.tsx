"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ConversionCTA } from "@/components/ConversionCTA";
import { AnimatedPageWrapper } from "@/components/AnimatedPageWrapper";
import { AnimatedHero } from "@/components/AnimatedHero";
import { Check, X, Clock, DollarSign, Wrench, Zap } from "lucide-react";

export default function ComparisonPage() {
  const comparisonData = [
    {
      feature: "Time to Value",
      settler: "5 minutes",
      inHouse: "3-6 months",
      alternatives: "2-4 weeks",
      settlerIcon: <Zap className="w-5 h-5 text-green-600" />,
      inHouseIcon: <Clock className="w-5 h-5 text-red-600" />,
      alternativesIcon: <Clock className="w-5 h-5 text-yellow-600" />,
    },
    {
      feature: "Initial Cost",
      settler: "$0 (free trial)",
      inHouse: "$50,000+",
      alternatives: "$5,000-$20,000",
      settlerIcon: <DollarSign className="w-5 h-5 text-green-600" />,
      inHouseIcon: <DollarSign className="w-5 h-5 text-red-600" />,
      alternativesIcon: <DollarSign className="w-5 h-5 text-yellow-600" />,
    },
    {
      feature: "Monthly Cost",
      settler: "$99/month",
      inHouse: "$5,000-$15,000",
      alternatives: "$500-$2,000",
      settlerIcon: <DollarSign className="w-5 h-5 text-green-600" />,
      inHouseIcon: <DollarSign className="w-5 h-5 text-red-600" />,
      alternativesIcon: <DollarSign className="w-5 h-5 text-yellow-600" />,
    },
    {
      feature: "Maintenance",
      settler: "Managed by us",
      inHouse: "Your team (ongoing)",
      alternatives: "Your team + vendor",
      settlerIcon: <Check className="w-5 h-5 text-green-600" />,
      inHouseIcon: <Wrench className="w-5 h-5 text-red-600" />,
      alternativesIcon: <Wrench className="w-5 h-5 text-yellow-600" />,
    },
    {
      feature: "Platform Adapters",
      settler: "10+ pre-built",
      inHouse: "Build each one",
      alternatives: "Limited options",
      settlerIcon: <Check className="w-5 h-5 text-green-600" />,
      inHouseIcon: <X className="w-5 h-5 text-red-600" />,
      alternativesIcon: <X className="w-5 h-5 text-yellow-600" />,
    },
    {
      feature: "Accuracy",
      settler: "99.7%",
      inHouse: "Varies (80-95%)",
      alternatives: "85-95%",
      settlerIcon: <Check className="w-5 h-5 text-green-600" />,
      inHouseIcon: <X className="w-5 h-5 text-red-600" />,
      alternativesIcon: <X className="w-5 h-5 text-yellow-600" />,
    },
    {
      feature: "Scalability",
      settler: "Unlimited",
      inHouse: "Requires engineering",
      alternatives: "Limited by plan",
      settlerIcon: <Check className="w-5 h-5 text-green-600" />,
      inHouseIcon: <Wrench className="w-5 h-5 text-red-600" />,
      alternativesIcon: <X className="w-5 h-5 text-yellow-600" />,
    },
    {
      feature: "Support",
      settler: "Email + docs",
      inHouse: "Your team",
      alternatives: "Varies",
      settlerIcon: <Check className="w-5 h-5 text-green-600" />,
      inHouseIcon: <X className="w-5 h-5 text-red-600" />,
      alternativesIcon: <X className="w-5 h-5 text-yellow-600" />,
    },
  ];

  const useCases = [
    {
      title: "Small Business (1K-10K transactions/month)",
      settler: "Free or $99/month",
      inHouse: "$50K+ initial + $5K/month",
      alternatives: "$500-$1,000/month",
      recommendation: "Settler - Best ROI for small businesses",
    },
    {
      title: "Mid-Market (10K-100K transactions/month)",
      settler: "$99/month",
      inHouse: "$100K+ initial + $10K/month",
      alternatives: "$1,000-$2,000/month",
      recommendation: "Settler - Fastest time to value",
    },
    {
      title: "Enterprise (100K+ transactions/month)",
      settler: "Custom pricing",
      inHouse: "$200K+ initial + $15K/month",
      alternatives: "$2,000-$5,000/month",
      recommendation: "Settler - Enterprise features + support",
    },
  ];

  return (
    <AnimatedPageWrapper aria-label="Comparison page">
      <Navigation />

      {/* Hero Section */}
      <AnimatedHero
        badge="Settler vs. Alternatives"
        title="Why Choose Settler Over Building In-House or Using Alternatives?"
        description="Compare Settler with building your own reconciliation system or using alternative solutions. See why 500+ companies choose Settler for faster time to value, lower costs, and better accuracy."
      />

      {/* Quick Comparison Table */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" aria-labelledby="comparison-heading">
        <div className="max-w-7xl mx-auto">
          <h2 id="comparison-heading" className="text-3xl md:text-4xl font-bold text-center mb-12 text-slate-900 dark:text-white">
            Side-by-Side Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white dark:bg-slate-900 rounded-lg shadow-lg">
              <thead>
                <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                  <th className="text-left p-4 font-semibold text-slate-900 dark:text-white">Feature</th>
                  <th className="text-center p-4 font-semibold text-slate-900 dark:text-white">
                    <div className="flex items-center justify-center gap-2">
                      <span>Settler</span>
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">Best</Badge>
                    </div>
                  </th>
                  <th className="text-center p-4 font-semibold text-slate-900 dark:text-white">Building In-House</th>
                  <th className="text-center p-4 font-semibold text-slate-900 dark:text-white">Other Alternatives</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr
                    key={index}
                    className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-4 font-medium text-slate-900 dark:text-white">{row.feature}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                        {row.settlerIcon}
                        <span className="font-semibold">{row.settler}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400">
                        {row.inHouseIcon}
                        <span>{row.inHouse}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-yellow-600 dark:text-yellow-400">
                        {row.alternativesIcon}
                        <span>{row.alternatives}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Use Case Recommendations */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-slate-800/50" aria-labelledby="use-cases-heading">
        <div className="max-w-7xl mx-auto">
          <h2 id="use-cases-heading" className="text-3xl md:text-4xl font-bold text-center mb-12 text-slate-900 dark:text-white">
            Recommendations by Use Case
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {useCases.map((useCase, index) => (
              <Card key={index} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-900 dark:text-white">{useCase.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Settler:</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{useCase.settler}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Building In-House:</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{useCase.inHouse}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Other Alternatives:</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{useCase.alternatives}</p>
                  </div>
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-bold text-green-600 dark:text-green-400">{useCase.recommendation}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Calculator Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" aria-labelledby="roi-heading">
        <div className="max-w-4xl mx-auto">
          <h2 id="roi-heading" className="text-3xl md:text-4xl font-bold text-center mb-12 text-slate-900 dark:text-white">
            Calculate Your ROI
          </h2>
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-2xl text-slate-900 dark:text-white">ROI Comparison</CardTitle>
              <CardDescription>
                See how much you save with Settler vs. building in-house
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h3 className="font-semibold text-green-900 dark:text-green-300 mb-2">With Settler</h3>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">$99/month</p>
                  <p className="text-sm text-green-700 dark:text-green-300">Time to value: 5 minutes</p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-2">No upfront costs</p>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <h3 className="font-semibold text-red-900 dark:text-red-300 mb-2">Building In-House</h3>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">$50,000+</p>
                  <p className="text-sm text-red-700 dark:text-red-300">Time to value: 3-6 months</p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-2">Plus $5K-$15K/month maintenance</p>
                </div>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">Your Savings with Settler:</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">$49,000+ in first year</p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">Plus 3-6 months of development time saved</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Why Settler Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-slate-800/50" aria-labelledby="why-settler-heading">
        <div className="max-w-7xl mx-auto">
          <h2 id="why-settler-heading" className="text-3xl md:text-4xl font-bold text-center mb-12 text-slate-900 dark:text-white">
            Why 500+ Companies Choose Settler
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Fastest Time to Value",
                description: "Get started in 5 minutes vs. 3-6 months of development. Start your free trial today.",
                icon: <Zap className="w-6 h-6 text-blue-600" />,
              },
              {
                title: "Lowest Total Cost",
                description: "Save $50,000+ in first year compared to building in-house. No upfront costs.",
                icon: <DollarSign className="w-6 h-6 text-green-600" />,
              },
              {
                title: "99.7% Accuracy",
                description: "Higher accuracy than most in-house solutions. Automated matching eliminates human error.",
                icon: <Check className="w-6 h-6 text-purple-600" />,
              },
              {
                title: "10+ Pre-Built Adapters",
                description: "Connect Shopify, Stripe, PayPal, and more in minutes. No custom code required.",
                icon: <Check className="w-6 h-6 text-indigo-600" />,
              },
              {
                title: "Managed Infrastructure",
                description: "We handle scaling, maintenance, and updates. You focus on your business.",
                icon: <Check className="w-6 h-6 text-cyan-600" />,
              },
              {
                title: "Enterprise Support",
                description: "Priority support, SLA guarantees, and dedicated account managers for enterprise customers.",
                icon: <Check className="w-6 h-6 text-pink-600" />,
              },
            ].map((benefit, index) => (
              <Card key={index} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    {benefit.icon}
                    <CardTitle className="text-lg text-slate-900 dark:text-white">{benefit.title}</CardTitle>
                  </div>
                  <CardDescription>{benefit.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <ConversionCTA
            title="Ready to Save Time and Money?"
            description="Start your 30-day free trial and see why Settler is the best choice for reconciliation. No credit card required."
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
