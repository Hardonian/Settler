'use client';

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { TrustBadges } from "@/components/TrustBadges";
import { ConversionCTA } from "@/components/ConversionCTA";
import { AnimatedPageWrapper } from "@/components/AnimatedPageWrapper";
import { AnimatedHero } from "@/components/AnimatedHero";
import { AnimatedFeatureCard } from "@/components/AnimatedFeatureCard";
import { AnimatedStatCard } from "@/components/AnimatedStatCard";

export default function Enterprise() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  });

  const features = [
    {
      icon: '🔒',
      title: 'Enterprise Security',
      description: 'SOC 2 Type II, SSO, SAML, RBAC, and custom security policies',
    },
    {
      icon: '🚀',
      title: 'Unlimited Scale',
      description: 'No limits on reconciliations, adapters, or data retention',
    },
    {
      icon: '👥',
      title: 'Dedicated Support',
      description: '24/7 support with SLA guarantees and dedicated account manager',
    },
    {
      icon: '🏢',
      title: 'On-Premise Option',
      description: 'Deploy Settler in your own infrastructure for maximum control',
    },
    {
      icon: '🎨',
      title: 'White-Label',
      description: 'Fully customizable branding and UI to match your brand',
    },
    {
      icon: '🔌',
      title: 'Custom Integrations',
      description: 'Build custom adapters and integrations for your specific needs',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
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
      <section className="px-4 sm:px-6 lg:px-8 -mt-12 mb-8" aria-label="Call to action">
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
      <section
        className="py-20 px-4 sm:px-6 lg:px-8"
        aria-labelledby="enterprise-features-heading"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2
              id="enterprise-features-heading"
              className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white"
            >
              Everything You Need
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2
                id="benefits-heading"
                className="text-3xl md:text-4xl font-bold mb-6 text-slate-900 dark:text-white"
              >
                Why Enterprise?
              </h2>
              <div className="space-y-6" role="list" aria-label="Enterprise benefits">
                {[
                  {
                    title: '99.99% Uptime SLA',
                    description:
                      "Guaranteed availability with financial penalties if we don't meet our SLA.",
                  },
                  {
                    title: 'Custom Contracts',
                    description:
                      'Flexible terms, custom pricing, and dedicated account management.',
                  },
                  {
                    title: 'Priority Support',
                    description:
                      '24/7 support with under 4 hour response time for critical issues.',
                  },
                  {
                    title: 'Compliance Ready',
                    description:
                      'SOC 2 Type II, GDPR, PCI-DSS, HIPAA-ready with audit trails.',
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
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                        {benefit.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-300">{benefit.description}</p>
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
                <CardTitle id="demo-form-heading" className="text-2xl text-slate-900 dark:text-white">
                  Request a Demo
                </CardTitle>
                <CardDescription>
                  Schedule a personalized demo with our enterprise team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4" aria-label="Demo request form">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
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
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
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
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
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
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
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
              { value: '99.99%', label: 'Uptime SLA', description: 'Guaranteed availability' },
              { value: '<4hr', label: 'Support Response', description: 'Critical issues' },
              { value: '24/7', label: 'Support Coverage', description: 'Always available' },
              { value: '100%', label: 'Compliance', description: 'SOC 2, GDPR, PCI-DSS' },
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

      {/* Trust Indicators */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
              Enterprise-Grade Security & Compliance
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Join leading companies using Settler for mission-critical reconciliation
            </p>
          </div>
          <TrustBadges />
        </div>
      </section>

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
