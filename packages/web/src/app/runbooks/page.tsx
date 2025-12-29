'use client';

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AnimatedPageWrapper } from "@/components/AnimatedPageWrapper";
import { AnimatedHero } from "@/components/AnimatedHero";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ConsoleGate } from "@/components/ConsoleGate";
import Link from "next/link";
import { 
  AlertTriangle, 
  CheckCircle, 
  Database,
  Server,
  Activity,
  Shield,
  Terminal,
  Code2
} from "lucide-react";

export default function Runbooks() {
  const [selectedRunbook, setSelectedRunbook] = useState<string | null>(null);

  const runbooks = [
    {
      id: 'debug-500',
      title: 'Debugging 500 Errors',
      description: 'Systematic approach to diagnosing and resolving server errors with comprehensive logging and monitoring.',
      severity: 'critical',
      icon: AlertTriangle,
      steps: [
        'Check application logs for error stack traces',
        'Verify environment variables are set correctly',
        'Check database connection status',
        'Review recent deployments or configuration changes',
        'Test API endpoints individually',
        'Check for rate limiting or quota issues',
      ],
      tags: ['Errors', 'Debugging', 'Server'],
      consolePath: '/console/ops',
    },
    {
      id: 'env-check',
      title: 'Environment Variable Validation',
      description: 'Verify all required environment variables are configured correctly across all environments.',
      severity: 'high',
      icon: CheckCircle,
      steps: [
        'List all required environment variables',
        'Check each variable is set and non-empty',
        'Verify variable formats (URLs, keys, etc.)',
        'Test environment-specific configurations',
        'Document any missing variables',
      ],
      tags: ['Configuration', 'Environment', 'Setup'],
      consolePath: '/console/ops',
    },
    {
      id: 'database-health',
      title: 'Database Health Check',
      description: 'Verify database connectivity, performance metrics, and identify potential bottlenecks.',
      severity: 'high',
      icon: Database,
      steps: [
        'Test database connection',
        'Check connection pool status',
        'Review slow query logs',
        'Verify database migrations are applied',
        'Check disk space and memory usage',
        'Review replication lag (if applicable)',
      ],
      tags: ['Database', 'Health', 'Monitoring'],
      consolePath: '/console/ops',
    },
    {
      id: 'deployment-check',
      title: 'Deployment Verification',
      description: 'Verify successful deployment and establish rollback procedures for production releases.',
      severity: 'medium',
      icon: Server,
      steps: [
        'Verify deployment completed successfully',
        'Check health endpoints',
        'Test critical user flows',
        'Monitor error rates',
        'Verify feature flags are correct',
        'Document any issues for rollback',
      ],
      tags: ['Deployment', 'Verification', 'CI/CD'],
      consolePath: '/console/ops',
    },
    {
      id: 'api-health',
      title: 'API Health Monitoring',
      description: 'Monitor API endpoints and detect issues early with comprehensive performance tracking.',
      severity: 'medium',
      icon: Activity,
      steps: [
        'Check API response times',
        'Monitor error rates by endpoint',
        'Review rate limiting status',
        'Check external service dependencies',
        'Verify API key authentication',
        'Review usage quotas',
      ],
      tags: ['API', 'Monitoring', 'Health'],
      consolePath: '/console/analytics',
    },
    {
      id: 'security-audit',
      title: 'Security Audit Checklist',
      description: 'Regular security checks and best practices to maintain compliance and protect your infrastructure.',
      severity: 'critical',
      icon: Shield,
      steps: [
        'Review access logs for suspicious activity',
        'Verify API keys are rotated regularly',
        'Check for exposed secrets in code',
        'Review authentication and authorization',
        'Verify SSL/TLS certificates',
        'Check for dependency vulnerabilities',
      ],
      tags: ['Security', 'Audit', 'Compliance'],
      consolePath: '/console/ops',
    },
  ];

  const selectedRunbookData = runbooks.find(rb => rb.id === selectedRunbook);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  return (
    <AnimatedPageWrapper aria-label="Operational runbooks">
      <Navigation />

      {/* Breadcrumbs */}
      <section className="px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs items={[{ label: 'Runbooks' }]} />
        </div>
      </section>

      {/* Hero Section */}
      <AnimatedHero
        badge="Operational Guides"
        title="Runbooks & Operations"
        description="Step-by-step guides for common operational tasks, debugging procedures, and system maintenance."
      />

      {/* Runbooks Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {runbooks.map((runbook) => {
              const Icon = runbook.icon;
              return (
                <Card
                  key={runbook.id}
                  className="group h-full cursor-pointer bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 transition-all duration-300 hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-600 hover:-translate-y-1"
                  onClick={() => setSelectedRunbook(runbook.id)}
                >
                  <div className="flex flex-col h-full p-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 p-3 mb-5 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={`${getSeverityColor(runbook.severity)} font-semibold uppercase tracking-wide text-xs px-2.5 py-1`}>
                        {runbook.severity}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white leading-tight">
                      {runbook.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-5 flex-grow text-sm leading-relaxed min-h-[3rem]">
                      {runbook.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {runbook.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs font-medium px-2.5 py-1 border-slate-300 dark:border-slate-700">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium mt-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRunbook(runbook.id);
                      }}
                    >
                      View Steps →
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Selected Runbook Detail Modal */}
      {selectedRunbookData && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedRunbook(null)}
        >
          <Card
            className="max-w-3xl w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getSeverityColor(selectedRunbookData.severity)}>
                      {selectedRunbookData.severity}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl text-slate-900 dark:text-white mb-2">
                    {selectedRunbookData.title}
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-300">
                    {selectedRunbookData.description}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRunbook(null)}
                  className="ml-4"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Terminal className="w-5 h-5" />
                  Execution Steps
                </h4>
                <ol className="list-decimal list-inside space-y-3 text-slate-700 dark:text-slate-300 pl-2">
                  {selectedRunbookData.steps.map((step, idx) => (
                    <li key={idx} className="text-sm leading-relaxed">{step}</li>
                  ))}
                </ol>
              </div>
              <ConsoleGate consolePath={selectedRunbookData.consolePath || '/console/ops'}>
                <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <Button
                    asChild
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                  >
                    <Link href={selectedRunbookData.consolePath || '/console/ops'}>
                      <Code2 className="w-4 h-4 mr-2" />
                      Open in Console
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="border-slate-300 dark:border-slate-700"
                    asChild
                  >
                    <Link href="/docs">View Docs</Link>
                  </Button>
                </div>
              </ConsoleGate>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">
            Need Help With Operations?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
            Access the Developer Console for advanced monitoring, management tools, and real-time operational insights.
          </p>
          <ConsoleGate consolePath="/console/ops">
            <div className="flex gap-3 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
              >
                <Link href="/console/ops">
                  <Terminal className="w-5 h-5 mr-2" />
                  Open Console
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-slate-300 dark:border-slate-700"
                asChild
              >
                <Link href="/support">Get Support</Link>
              </Button>
            </div>
          </ConsoleGate>
        </div>
      </section>

      <Footer />
    </AnimatedPageWrapper>
  );
}
