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
import Link from "next/link";
import { 
  AlertTriangle, 
  CheckCircle, 
  Database,
  Server,
  Activity,
  Shield
} from "lucide-react";

export default function Runbooks() {
  const [selectedRunbook, setSelectedRunbook] = useState<string | null>(null);

  const runbooks = [
    {
      id: 'debug-500',
      title: 'Debugging 500 Errors',
      description: 'Systematic approach to diagnosing and resolving server errors.',
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
      tags: ['errors', 'debugging', 'server'],
    },
    {
      id: 'env-check',
      title: 'Environment Variable Validation',
      description: 'Verify all required environment variables are configured.',
      severity: 'high',
      icon: CheckCircle,
      steps: [
        'List all required environment variables',
        'Check each variable is set and non-empty',
        'Verify variable formats (URLs, keys, etc.)',
        'Test environment-specific configurations',
        'Document any missing variables',
      ],
      tags: ['configuration', 'environment', 'setup'],
    },
    {
      id: 'database-health',
      title: 'Database Health Check',
      description: 'Verify database connectivity and performance.',
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
      tags: ['database', 'health', 'monitoring'],
    },
    {
      id: 'deployment-check',
      title: 'Deployment Verification',
      description: 'Verify successful deployment and rollback procedures.',
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
      tags: ['deployment', 'verification', 'ci-cd'],
    },
    {
      id: 'api-health',
      title: 'API Health Monitoring',
      description: 'Monitor API endpoints and detect issues early.',
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
      tags: ['api', 'monitoring', 'health'],
    },
    {
      id: 'security-audit',
      title: 'Security Audit Checklist',
      description: 'Regular security checks and best practices.',
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
      tags: ['security', 'audit', 'compliance'],
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
                  className="h-full cursor-pointer bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-all duration-200 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700"
                  onClick={() => setSelectedRunbook(runbook.id)}
                >
                  <div className="flex flex-col h-full">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 mb-4 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getSeverityColor(runbook.severity)}>
                        {runbook.severity}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">
                      {runbook.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-4 flex-grow text-sm leading-relaxed">
                      {runbook.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {runbook.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
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
                <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Steps</h4>
                <ol className="list-decimal list-inside space-y-3 text-slate-600 dark:text-slate-400">
                  {selectedRunbookData.steps.map((step, idx) => (
                    <li key={idx} className="text-sm">{step}</li>
                  ))}
                </ol>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button
                  asChild
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100"
                >
                  <Link href="/console">Open Console</Link>
                </Button>
                <Button
                  variant="outline"
                  className="border-slate-300 dark:border-slate-700"
                  asChild
                >
                  <Link href="/docs">View Docs</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-semibold mb-3 text-slate-900 dark:text-white">
            Need help with operations?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Access the Developer Console for advanced monitoring and management tools.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              <Link href="/console">Open Console</Link>
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
        </div>
      </section>

      <Footer />
    </AnimatedPageWrapper>
  );
}
