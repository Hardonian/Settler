"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { TrustBadges } from "@/components/TrustBadges";
import { ConversionCTA } from "@/components/ConversionCTA";
import { AnimatedPageWrapper } from "@/components/AnimatedPageWrapper";
import { AnimatedHero } from "@/components/AnimatedHero";
import { AnimatedFeatureCard } from "@/components/AnimatedFeatureCard";
import { AnimatedStatCard } from "@/components/AnimatedStatCard";
import { EdgeAIMarketingSection } from "@/components/EdgeAIMarketingSection";

export default function Enterprise() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });

  const features = [
    {
      icon: "🚀",
      title: "Unlimited Scale",
      description: "No limits on reconciliations, adapters, or data retention",
    },
    {
      icon: "👥",
      title: "Dedicated Support",
      description: "Priority support with SLA guarantees and dedicated account manager",
    },
    {
      icon: "🔌",
      title: "Custom Integrations",
      description: "Build custom adapters and integrations for your specific needs",
    },
    {
      icon: "📊",
      title: "Extended Log Retention",
      description: "Keep reconciliation history for up to 7 years for compliance",
    },
    {
      icon: "⚡",
      title: "Priority Feature Requests",
      description: "Influence product roadmap with priority feature requests",
    },
    {
      icon: "🔒",
      title: "Enhanced Security",
      description: "AES-256 encryption, secure API key storage, and audit trails",
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Form submitted:", formData);
    // In production, this would send to your backend
  };

  return (
    <AnimatedPageWrapper aria-label="Enterprise solutions page">
      <Navigation />

      {/* Hero Section */}
      <AnimatedHero
        badge="Enterprise Solutions"
        title={
          <>
            Enterprise-Grade
            <br />
            Reconciliation Platform
          </>
        }
        description="Custom solutions for large organizations with advanced security, compliance, and scale requirements."
      />

      {/* Hero CTA Buttons */}
      <section className="px-4 sm:px-6 lg:px-8 -mt-12 mb-12" aria-label="Call to action">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              asChild
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Link href="#demo-form" aria-label="Contact sales team">
                Contact Sales
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="px-8 py-6 text-lg border-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all transform hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Link href="/pricing" aria-label="View pricing plans">
                View Pricing
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" aria-labelledby="enterprise-features-heading">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2
              id="enterprise-features-heading"
              className="text-3xl md:text-4xl font-bold mb-6 text-slate-900 dark:text-white"
            >
              Everything You Need
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed px-4">
              Enterprise features designed for scale, security, and compliance
            </p>
          </div>
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            role="list"
            aria-label="Enterprise features"
          >
            {features.map((feature, index) => (
              <div key={index} role="listitem">
                <AnimatedFeatureCard
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  index={index}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section
        className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-slate-800/50"
        aria-labelledby="benefits-heading"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <h2
                id="benefits-heading"
                className="text-3xl md:text-4xl font-bold mb-8 text-slate-900 dark:text-white"
              >
                Why Enterprise?
              </h2>
              <div className="space-y-6" role="list" aria-label="Enterprise benefits">
                {[
                {
                  title: "99.99% Uptime SLA",
                  description:
                    "Guaranteed availability with financial penalties if we don't meet our SLA. Enterprise-grade infrastructure with redundancy and failover.",
                },
                {
                  title: "Custom Contracts & Pricing",
                  description:
                    "Flexible terms, custom pricing based on your volume, and dedicated account management. Annual contracts with volume discounts available.",
                },
                {
                  title: "24/7 Priority Support",
                  description:
                    "Dedicated support team with under 4 hour response time for critical issues. Direct line to engineering for urgent matters.",
                },
                {
                  title: "Enterprise Compliance",
                  description: "GDPR compliant with full audit trails. SOC 2 Type II certification in progress (Q2 2026). PCI-DSS Level 1 planned for Q3 2026.",
                },
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start" role="listitem">
                    <div
                      className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                      aria-hidden="true"
                    >
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                        {benefit.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Card
              id="demo-form"
              className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl transition-all duration-500 hover:shadow-2xl"
              role="region"
              aria-labelledby="demo-form-heading"
            >
              <CardHeader>
                <CardTitle
                  id="demo-form-heading"
                  className="text-2xl text-slate-900 dark:text-white"
                >
                  Request a Demo
                </CardTitle>
                <CardDescription>
                  Schedule a personalized demo with our enterprise team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5" aria-label="Demo request form">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2.5"
                    >
                      Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      aria-required="true"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2.5"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      aria-required="true"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="company"
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2.5"
                    >
                      Company
                    </label>
                    <input
                      id="company"
                      type="text"
                      required
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      aria-required="true"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2.5"
                    >
                      Message
                    </label>
                    <textarea
                      id="message"
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Tell us about your requirements..."
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all transform hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    size="lg"
                    aria-label="Submit demo request form"
                  >
                    Request Demo
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Enterprise Stats - Unique */}
      <section
        className="py-16 bg-white/50 dark:bg-slate-800/50"
        aria-labelledby="enterprise-stats-heading"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="enterprise-stats-heading"
            className="text-2xl md:text-3xl font-bold text-center mb-12 text-slate-900 dark:text-white"
          >
            Enterprise Performance
          </h2>
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            role="list"
            aria-label="Enterprise performance metrics"
          >
            {[
              { value: "99.99%", label: "Uptime SLA", description: "Guaranteed availability" },
              { value: "<4hr", label: "Support Response", description: "Critical issues" },
              { value: "24/7", label: "Support Coverage", description: "Always available" },
              { value: "GDPR", label: "Compliance", description: "GDPR compliant, SOC 2 in progress" },
            ].map((stat, index) => (
              <div key={index} role="listitem">
                <AnimatedStatCard
                  value={stat.value}
                  label={stat.label}
                  description={stat.description}
                  index={index}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" aria-labelledby="coming-soon-heading">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2
              id="coming-soon-heading"
              className="text-3xl md:text-4xl font-bold mb-6 text-slate-900 dark:text-white"
            >
              Coming Soon
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed px-4">
              Enterprise features in development
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "SSO (SAML, OIDC)",
                description: "Single sign-on integration with your identity provider",
                timeline: "Q2 2026",
              },
              {
                title: "SOC 2 Type II",
                description: "Full SOC 2 Type II certification and compliance",
                timeline: "Q2 2026",
              },
              {
                title: "PCI-DSS Level 1",
                description: "PCI-DSS Level 1 certification for payment processing",
                timeline: "Q3 2026",
              },
              {
                title: "White-Label Reports",
                description: "Fully customizable branding for reports and exports",
                timeline: "Q2 2026",
              },
              {
                title: "On-Premise Deployment",
                description: "Deploy Settler in your own infrastructure",
                timeline: "Q4 2026",
              },
              {
                title: "VPC Peering",
                description: "Private network connectivity for enhanced security",
                timeline: "Q3 2026",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              >
                <CardHeader>
                  <CardTitle className="text-lg text-slate-900 dark:text-white">
                    {feature.title}
                  </CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline" className="text-xs">
                    {feature.timeline}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900 dark:text-white">
              Enterprise-Grade Security & Compliance
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed px-4">
              Join leading companies using Settler for mission-critical reconciliation
            </p>
          </div>
          <TrustBadges />
        </div>
      </section>

      {/* Edge AI Section */}
      <EdgeAIMarketingSection variant="default" />

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <ConversionCTA
            title="Ready to Transform Your Reconciliation?"
            description="Schedule a personalized demo with our enterprise team and see how Settler can scale with your business."
            primaryAction="Request Demo"
            primaryLink="#demo-form"
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
