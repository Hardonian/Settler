import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { AnimatedPageWrapper } from '@/components/AnimatedPageWrapper';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Shield, Clock, Database, GitBranch, CheckCircle, AlertCircle } from 'lucide-react';
import { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Trust & Reliability',
  description: 'Settler Trust - Uptime, backups, change management, and operational reliability.',
  robots: {
    index: true,
    follow: true,
  },
};

async function getRealityData() {
  // CRITICAL: Never throw - always return null on failure
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    // Use timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      const response = await fetch(`${baseUrl}/api/public/reality`, {
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return await response.json();
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      // If fetch fails (network error, timeout, etc.), return null
      console.warn('[Trust] Failed to fetch reality data (non-fatal):', 
        fetchError instanceof Error ? fetchError.message : 'Unknown error'
      );
    }
  } catch (error) {
    // Catch any other errors
    console.warn('[Trust] Error in getRealityData (non-fatal):', 
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
  return null;
}

export default async function TrustPage() {
  const realityData = await getRealityData();
  return (
    <AnimatedPageWrapper aria-label="Trust page">
      <Navigation />
      
      {/* Breadcrumbs */}
      <section className="px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs items={[{ label: 'Trust' }]} />
        </div>
      </section>

      {/* Hero */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900 dark:text-white">
            Trust & Reliability
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">
            Operational excellence, reliability, and transparency in how we operate Settler.
          </p>
        </div>
      </section>

      {/* Uptime Policy */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Uptime Policy</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Service Level Objectives</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600 dark:text-slate-300">API Availability</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {realityData?.uptime_proxy ? `${realityData.uptime_proxy.toFixed(1)}%` : '99.9%'}
                      </span>
                      {realityData?.status === 'assumed' && (
                        <Badge variant="outline" className="text-xs">ASSUMED</Badge>
                      )}
                      {realityData?.status === 'proven' && (
                        <Badge className="bg-green-500 text-xs">PROVEN</Badge>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: realityData?.uptime_proxy ? `${realityData.uptime_proxy}%` : '99.9%' }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600 dark:text-slate-300">Console Availability</span>
                    <span className="font-semibold text-slate-900 dark:text-white">99.5%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '99.5%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600 dark:text-slate-300">Data Processing</span>
                    <span className="font-semibold text-slate-900 dark:text-white">99.95%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '99.95%' }}></div>
                  </div>
                </div>
                {realityData?.hard_500_count !== undefined && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-600 dark:text-slate-300">Hard 500 Errors</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {realityData.hard_500_count}
                        </span>
                        {realityData.hard_500_count === 0 ? (
                          <Badge className="bg-green-500 text-xs">ZERO</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">VIOLATION</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Monitoring & Status</h3>
              <ul className="space-y-3 text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>24/7 automated monitoring of all services</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Real-time status page: <a href="/status" className="text-blue-600 dark:text-blue-400 hover:underline">settler.dev/status</a></span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Automated incident detection and alerting</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Public incident history and post-mortems</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Enterprise customers receive SLA guarantees</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">Uptime Calculation</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Uptime is calculated monthly, excluding scheduled maintenance windows (announced 48 hours in advance) 
                  and force majeure events. Planned maintenance typically occurs during low-traffic hours and is kept under 4 hours per month.
                </p>
                {realityData?.last_incident && (
                  <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">
                    <strong>Last Incident:</strong> {new Date(realityData.last_incident.timestamp).toLocaleDateString()} - {realityData.last_incident.event}
                  </p>
                )}
                {realityData?.status === 'assumed' && (
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-2">
                    <strong>Note:</strong> Some metrics are currently ASSUMED and will be updated as we collect more data.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Backups */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Backups & Recovery</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Backup Strategy</h3>
              <ul className="space-y-3 text-slate-600 dark:text-slate-300">
                <li>• Automated daily full backups</li>
                <li>• Continuous point-in-time recovery (PITR)</li>
                <li>• Multi-region backup replication</li>
                <li>• Encrypted backups with separate keys</li>
                <li>• 30-day retention (extendable for enterprise)</li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Recovery Objectives</h3>
              <ul className="space-y-3 text-slate-600 dark:text-slate-300">
                <li><strong>RPO:</strong> 5 minutes (Recovery Point Objective)</li>
                <li><strong>RTO:</strong> 1 hour (Recovery Time Objective)</li>
                <li>• Tested quarterly with documented results</li>
                <li>• Automated backup verification</li>
                <li>• Cross-region disaster recovery plan</li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Data Durability</h3>
              <ul className="space-y-3 text-slate-600 dark:text-slate-300">
                <li>• 99.999999999% (11 nines) durability</li>
                <li>• Immutable backup storage</li>
                <li>• Versioned backups prevent corruption</li>
                <li>• Customer-initiated backup exports available</li>
                <li>• Compliance-ready backup audit logs</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Change Management */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <GitBranch className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Change Management</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Deployment Process</h3>
              <ol className="space-y-3 text-slate-600 dark:text-slate-300 list-decimal list-inside">
                <li>All changes go through code review and automated testing</li>
                <li>Staged deployments: dev → staging → production</li>
                <li>Canary deployments for high-risk changes</li>
                <li>Automated rollback on error detection</li>
                <li>Feature flags for gradual rollout</li>
                <li>Post-deployment monitoring and validation</li>
              </ol>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Change Communication</h3>
              <ul className="space-y-3 text-slate-600 dark:text-slate-300">
                <li>• Changelog published at <a href="/changelog" className="text-blue-600 dark:text-blue-400 hover:underline">settler.dev/changelog</a></li>
                <li>• Breaking changes announced 30 days in advance</li>
                <li>• Email notifications for critical changes</li>
                <li>• API versioning maintains backward compatibility</li>
                <li>• Deprecation notices with migration guides</li>
                <li>• Enterprise customers receive direct communication</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Change Types & Windows</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-2 text-slate-900 dark:text-white">Routine Updates</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Non-breaking changes deployed during business hours with automated testing. No customer notification required.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-slate-900 dark:text-white">Scheduled Maintenance</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Infrastructure updates announced 48 hours in advance. Typically scheduled during low-traffic windows.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-slate-900 dark:text-white">Emergency Changes</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Security patches and critical fixes deployed immediately with post-deployment notification and documentation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Operational Transparency */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <Shield className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Operational Transparency</h2>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700">
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              We believe in transparency about how we operate Settler. Enterprise customers can request:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Monthly uptime reports</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Incident post-mortems</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Security audit summaries</span>
                </li>
              </ul>
              <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Change management logs</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Backup verification reports</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Custom SLA reporting</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-500">
                To request operational reports or discuss custom SLA requirements, contact{' '}
                <a href="mailto:enterprise@settler.dev" className="text-blue-600 dark:text-blue-400 hover:underline">
                  enterprise@settler.dev
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </AnimatedPageWrapper>
  );
}
