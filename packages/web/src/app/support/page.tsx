'use client';

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ConversionCTA } from "@/components/ConversionCTA";
import { AnimatedPageWrapper } from "@/components/AnimatedPageWrapper";
import { AnimatedHero } from "@/components/AnimatedHero";
import { FAQSchema } from "@/components/StructuredData";
import Link from "next/link";

export default function Support() {
  const [searchQuery, setSearchQuery] = useState('');

  const supportOptions = [
    {
      icon: '📚',
      title: 'Documentation',
      description: 'Comprehensive guides, API reference, and tutorials',
      link: '/docs',
      linkText: 'Browse Docs',
      tier: 'All Plans',
    },
    {
      icon: '📖',
      title: 'Cookbooks & Examples',
      description: 'Pre-built workflows and code examples for common use cases',
      link: '/cookbooks',
      linkText: 'View Cookbooks',
      tier: 'All Plans',
    },
    {
      icon: '💬',
      title: 'Community Support',
      description: 'Get help from our community on Discord and GitHub',
      link: 'https://discord.gg/settler',
      linkText: 'Join Discord',
      external: true,
      tier: 'All Plans',
    },
    {
      icon: '🎮',
      title: 'Interactive Playground',
      description: 'Test the API and see examples in action',
      link: '/playground',
      linkText: 'Try Playground',
      tier: 'All Plans',
    },
    {
      icon: '📧',
      title: 'Email Support',
      description: 'Get help via email (response within 24 hours)',
      link: 'mailto:support@settler.dev',
      linkText: 'Email Us',
      external: true,
      tier: 'Commercial+',
    },
    {
      icon: '🚀',
      title: 'Priority Support',
      description: '24/7 support with SLA guarantees and dedicated account manager',
      link: '/enterprise',
      linkText: 'Learn More',
      tier: 'Enterprise',
    },
  ];

  const supportTiers = [
    {
      tier: 'OSS / Free',
      features: [
        'Documentation & Guides',
        'Community Support (Discord, GitHub)',
        'Cookbooks & Examples',
        'Interactive Playground',
      ],
      responseTime: 'Community response',
    },
    {
      tier: 'Commercial',
      features: [
        'Everything in OSS',
        'Email Support (24 hour response)',
        'Technical Integration Help',
        'Bug Reports & Feature Requests',
      ],
      responseTime: '24 hours',
    },
    {
      tier: 'Enterprise',
      features: [
        'Everything in Commercial',
        '24/7 Priority Support',
        'Dedicated Account Manager',
        'SLA Guarantees (<4hr response)',
        'Phone Support',
        'Custom Integration Support',
      ],
      responseTime: '<4 hours (P1)',
    },
  ];

  const escalationLevels = [
    {
      level: 'Level 1',
      name: 'Support Bot / Self-Service',
      includes: ['Documentation', 'Community', 'Knowledge Base', 'Automated Responses'],
    },
    {
      level: 'Level 2',
      name: 'Support Engineer',
      includes: ['Email Support', 'Technical Questions', 'Integration Help'],
    },
    {
      level: 'Level 3',
      name: 'Senior Support Engineer',
      includes: ['Complex Issues', 'Performance Problems', 'Advanced Integration'],
    },
    {
      level: 'Level 4',
      name: 'Engineering Team',
      includes: ['Bugs', 'Feature Requests', 'Infrastructure Issues'],
    },
    {
      level: 'Level 5',
      name: 'Leadership',
      includes: ['Critical Incidents', 'Security Issues', 'Customer Escalations'],
    },
  ];

  const severityLevels = [
    {
      severity: 'P0: Critical',
      description: 'System down, data breach, complete service outage',
      responseTime: '15 minutes',
      resolutionTime: '4 hours',
    },
    {
      severity: 'P1: High',
      description: 'Major feature broken, high error rate, multiple customers affected',
      responseTime: '1 hour',
      resolutionTime: '24 hours',
    },
    {
      severity: 'P2: Medium',
      description: 'Minor feature broken, moderate error rate, single customer affected',
      responseTime: '4 hours',
      resolutionTime: '72 hours',
    },
    {
      severity: 'P3: Low',
      description: 'Documentation issues, UI improvements, feature requests',
      responseTime: '24 hours',
      resolutionTime: '7 days',
    },
  ];

  const faqs = [
    {
      question: 'How do I get started with Settler?',
      answer: 'Get started in under 5 minutes! Install the SDK with `npm install @settler/sdk`, get your API key from the dashboard, and create your first reconciliation job. Check out our quickstart guide in the documentation or try the interactive playground to see it in action.',
    },
    {
      question: 'What platforms does Settler support?',
      answer: 'Settler supports 50+ platforms including Stripe, Shopify, QuickBooks, PayPal, Square, Amazon Pay, and many more. We have pre-built adapters for the most popular platforms, and you can easily build custom adapters for any platform with our adapter SDK.',
    },
    {
      question: 'Is there a free tier?',
      answer: 'Yes! Our OSS (Open Source) tier is free forever with 1,000 reconciliations per month, access to 2 adapters, and 7-day log retention. Perfect for getting started and small projects. Check out our pricing page for full details on all tiers.',
    },
    {
      question: 'How accurate is the reconciliation?',
      answer: 'Settler achieves 99.7% accuracy with our advanced matching algorithms, confidence scoring, and fuzzy matching capabilities. We use multiple matching strategies including exact matching, fuzzy matching, and date range matching to ensure high accuracy even with imperfect data.',
    },
    {
      question: 'Can I use Settler on-premise?',
      answer: 'Yes! Enterprise plans include on-premise deployment options for maximum security and compliance. We provide Docker containers and deployment guides. Contact our sales team at enterprise@settler.dev to discuss your requirements.',
    },
    {
      question: 'What security certifications do you have?',
      answer: 'We\'re SOC 2 Type II certified, GDPR compliant, and PCI-DSS ready. All data is encrypted at rest and in transit using AES-256-GCM. Enterprise customers get additional security features including SSO, RBAC, and dedicated security reviews.',
    },
    {
      question: 'How do I handle unmatched records?',
      answer: 'Settler provides a comprehensive exception queue where you can review unmatched records, see confidence scores, and manually resolve discrepancies. You can also configure automatic retry rules and webhook notifications for unmatched records.',
    },
    {
      question: 'What happens if my reconciliation job fails?',
      answer: 'Settler automatically retries failed jobs with exponential backoff. You\'ll receive webhook notifications for failures, and all errors are logged with detailed information. Check the job logs via the API or dashboard to diagnose issues.',
    },
    {
      question: 'Can I reconcile multiple currencies?',
      answer: 'Yes! Settler supports multi-currency reconciliation with automatic currency conversion using real-time exchange rates. You can configure currency matching rules and tolerance levels for each currency pair.',
    },
    {
      question: 'How do webhooks work?',
      answer: 'Settler sends webhooks for key events like reconciliation completion, job failures, and unmatched records. Webhooks are signed with HMAC for security verification. Failed webhook deliveries are automatically retried up to 5 times with exponential backoff.',
    },
    {
      question: 'What is the API rate limit?',
      answer: 'Rate limits vary by plan. OSS tier: 100 requests/minute. Commercial: 1,000 requests/minute. Enterprise: Custom limits. All responses include rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset) so you can implement proper backoff strategies.',
    },
    {
      question: 'How do I build a custom adapter?',
      answer: 'Custom adapters are built using our adapter SDK. Each adapter implements a simple interface to fetch and normalize data from your platform. Check out our adapter documentation and examples in the cookbooks section.',
    },
    {
      question: 'What data retention policies do you have?',
      answer: 'Data retention varies by plan: OSS (7 days), Commercial (30 days), Enterprise (custom, up to 7 years). You can export all data via the API at any time. Enterprise customers can configure custom retention policies.',
    },
    {
      question: 'How do I integrate Settler with my existing systems?',
      answer: 'Settler is API-first and integrates easily with any system. Use our REST API, TypeScript/JavaScript SDK, or CLI. We provide webhooks for real-time updates and detailed documentation with integration recipes for common patterns.',
    },
    {
      question: 'What kind of support do you offer?',
      answer: 'OSS tier: Community support via Discord and GitHub. Commercial: Email support with 24-hour response time. Enterprise: 24/7 priority support with SLA guarantees, dedicated account manager, and phone support. See the support tiers section above for details.',
    },
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatedPageWrapper aria-label="Support and help center">
      <FAQSchema faqs={faqs} />
      <Navigation />

      {/* Hero Section */}
      <AnimatedHero
        badge="We're Here to Help"
        title="Support & Help Center"
        description="Find answers, get help, and connect with our team"
      />

      {/* Support Options */}
      <section
        className="py-20 px-4 sm:px-6 lg:px-8"
        aria-labelledby="support-options-heading"
      >
        <div className="max-w-7xl mx-auto">
          <h2 id="support-options-heading" className="text-3xl md:text-4xl font-bold text-center mb-4 text-slate-900 dark:text-white">
            Support Channels
          </h2>
          <p className="text-center text-slate-600 dark:text-slate-300 mb-12 max-w-2xl mx-auto">
            Choose the support channel that works best for you
          </p>
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
            role="list"
            aria-label="Available support channels"
          >
            {supportOptions.map((option, index) => (
              <Card
                key={index}
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
                role="listitem"
              >
                <CardHeader>
                  <div className="text-4xl mb-2">{option.icon}</div>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-slate-900 dark:text-white">
                      {option.title}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {option.tier}
                    </Badge>
                  </div>
                  <CardDescription className="text-slate-600 dark:text-slate-300">
                    {option.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {option.external ? (
                    <Button
                      asChild
                      variant="outline"
                      className="w-full border-slate-300 dark:border-slate-700"
                    >
                      <a
                        href={option.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${option.linkText} (opens in new tab)`}
                      >
                        {option.linkText} →
                      </a>
                    </Button>
                  ) : (
                    <Button
                      asChild
                      variant="outline"
                      className="w-full border-slate-300 dark:border-slate-700"
                    >
                      <Link href={option.link}>
                        {option.linkText} →
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Support Tiers */}
      <section
        className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-slate-800/50"
        aria-labelledby="support-tiers-heading"
      >
        <div className="max-w-7xl mx-auto">
          <h2 id="support-tiers-heading" className="text-3xl md:text-4xl font-bold text-center mb-4 text-slate-900 dark:text-white">
            Support Tiers
          </h2>
          <p className="text-center text-slate-600 dark:text-slate-300 mb-12 max-w-2xl mx-auto">
            Different support levels for different needs
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {supportTiers.map((tier, index) => (
              <Card
                key={index}
                className={`bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-all duration-200 hover:shadow-lg ${
                  tier.tier === 'Enterprise' ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <CardHeader>
                  <CardTitle className="text-xl text-slate-900 dark:text-white mb-2">
                    {tier.tier}
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-300">
                    Response Time: {tier.responseTime}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-sm text-slate-600 dark:text-slate-300">
                        <span className="mr-2 text-green-500">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Escalation Matrix */}
      <section
        className="py-20 px-4 sm:px-6 lg:px-8"
        aria-labelledby="escalation-heading"
      >
        <div className="max-w-7xl mx-auto">
          <h2 id="escalation-heading" className="text-3xl md:text-4xl font-bold text-center mb-4 text-slate-900 dark:text-white">
            Support Escalation
          </h2>
          <p className="text-center text-slate-600 dark:text-slate-300 mb-12 max-w-2xl mx-auto">
            How we handle and escalate support requests
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {escalationLevels.map((level, index) => (
              <Card
                key={index}
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              >
                <CardHeader>
                  <Badge variant="outline" className="w-fit mb-2">
                    {level.level}
                  </Badge>
                  <CardTitle className="text-lg text-slate-900 dark:text-white">
                    {level.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                    {level.includes.map((item, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-2">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Severity Levels */}
      <section
        className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-slate-800/50"
        aria-labelledby="severity-heading"
      >
        <div className="max-w-4xl mx-auto">
          <h2 id="severity-heading" className="text-3xl md:text-4xl font-bold text-center mb-4 text-slate-900 dark:text-white">
            Issue Severity & Response Times
          </h2>
          <p className="text-center text-slate-600 dark:text-slate-300 mb-12">
            We prioritize issues based on severity to ensure critical problems are resolved quickly
          </p>
          <div className="space-y-4">
            {severityLevels.map((severity, index) => (
              <Card
                key={index}
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-slate-900 dark:text-white">
                      {severity.severity}
                    </CardTitle>
                    <div className="flex gap-4 text-sm">
                      <Badge variant="outline">
                        Response: {severity.responseTime}
                      </Badge>
                      <Badge variant="outline">
                        Resolution: {severity.resolutionTime}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className="text-slate-600 dark:text-slate-300">
                    {severity.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-slate-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Search our knowledge base for quick answers
            </p>
          </div>

          {/* Search */}
          <div className="mb-8">
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Search frequently asked questions"
            />
          </div>

          {/* FAQ List */}
          <div className="space-y-4" role="list" aria-label="Frequently asked questions">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, index) => (
                <Card
                  key={index}
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-all duration-300 hover:shadow-lg"
                  role="listitem"
                >
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-900 dark:text-white">
                      {faq.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 dark:text-slate-300">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardContent className="py-8 text-center">
                  <p className="text-slate-600 dark:text-slate-300">
                    No FAQs found matching "{searchQuery}". Try a different search term.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <ConversionCTA
            title="Still Need Help?"
            description="Our support team is ready to assist you. Get in touch via email or schedule a call with our sales team."
            primaryAction="Email Support"
            primaryLink="mailto:support@settler.dev"
            secondaryAction="Contact Sales"
            secondaryLink="/enterprise"
            variant="gradient"
          />
        </div>
      </section>

      <Footer />
    </AnimatedPageWrapper>
  );
}
