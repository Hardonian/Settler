import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { AnimatedPageWrapper } from '@/components/AnimatedPageWrapper';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { EnhancedTrustBadges } from '@/components/EnhancedTrustBadges';
import { Shield, Lock, FileKey, Server, Eye, RefreshCcw, Database, AlertTriangle, Users, Globe } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security',
  description: 'Settler Security - Enterprise-grade security, compliance, and data protection.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function SecurityPage() {
  return (
    <AnimatedPageWrapper aria-label="Security page">
      <Navigation />
      
      {/* Breadcrumbs */}
      <section className="px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs items={[{ label: 'Security' }]} />
        </div>
      </section>

      {/* Hero */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900 dark:text-white">
            Security & Data Handling
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">
            How we protect your financial data, enforce tenant isolation, handle failures, and meet compliance requirements. Written for engineers and operators.
          </p>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">
              Security Certifications & Compliance
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Enterprise-grade security certifications and compliance standards
            </p>
          </div>
          <EnhancedTrustBadges />
        </div>
      </section>

      {/* Compliance Posture */}
      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">SOC 2 Type II (Planned Q3 2026)</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                Our infrastructure and processes are designed in alignment with SOC 2 Trust Service Criteria. 
                SOC 2 Type II certification is planned for Q3 2026. We maintain continuous monitoring of our security controls.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <FileKey className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">ISO 27001 Aligned (Planned)</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                We follow ISO 27001 standards for information security management, ensuring systemic 
                risk management and robust security controls. ISO 27001 certification is planned for future implementation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center text-slate-900 dark:text-white">
            Data Protection & Privacy
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6">
              <Lock className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Encryption at Rest & Transit</h3>
              <p className="text-slate-600 dark:text-slate-400">
                AES-256 encryption at rest (Supabase managed). TLS 1.3 in transit (enforced by Vercel edge). 
                Key management via Supabase KMS with automatic rotation. No application-level encryption keys stored in code or environment variables.
              </p>
            </div>
            <div className="p-6">
              <Server className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Data Retention & Deletion</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Data retained indefinitely unless account deleted. Account deletion: 30-day grace period (soft delete), then hard deletion from production and backups. 
                Cryptographic erasure verification available for Enterprise (proof that data cannot be recovered).
              </p>
            </div>
            <div className="p-6">
              <Eye className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Audit Logging</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Immutable audit logs for all sensitive actions (data access, exports, deletions, configuration changes). 
                Stored in separate table with RLS. Exportable via API (<code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">GET /api/v1/audit-logs</code>). 
                SIEM integration available for Enterprise (webhook or API polling).
              </p>
            </div>
            <div className="p-6">
              <RefreshCcw className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Disaster Recovery</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Daily automated backups (Supabase managed). Point-in-time recovery (PITR) available. 
                RPO: 24 hours. RTO: 4 hours (target). Backup restoration tested quarterly. 
                Multi-region replication available for Enterprise.
              </p>
            </div>
            <div className="p-6">
              <Shield className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Infrastructure Security</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Serverless architecture (Vercel + Supabase). No persistent servers to harden. 
                Dependency scanning in CI/CD (npm audit, Dependabot). 
                Automated security headers (CSP, HSTS, X-Frame-Options) via middleware.
              </p>
            </div>
            <div className="p-6">
              <FileKey className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Access Control</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Authentication via Supabase Auth (email/password, OAuth). 
                API keys for programmatic access (scoped to tenant). 
                Row-Level Security (RLS) enforces tenant isolation at database level. 
                SAML SSO and MFA available for Enterprise.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Data Handling */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center text-slate-900 dark:text-white">
            Data Handling & Privacy
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700">
              <Database className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Data Processing & Isolation</h3>
              <ul className="space-y-3 text-slate-600 dark:text-slate-300">
                <li>• <strong>Tenant Isolation:</strong> Row-Level Security (RLS) policies enforce tenant boundaries at the database level. Every query is filtered by <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">tenant_id</code>. Cross-tenant access is architecturally impossible.</li>
                <li>• <strong>Data Purpose:</strong> Customer data is processed only for reconciliation services. No secondary use. No AI model training without explicit consent.</li>
                <li>• <strong>Data Residency:</strong> US by default. EU data residency available for Enterprise customers (separate Supabase project in EU region).</li>
                <li>• <strong>Encryption:</strong> AES-256 at rest (Supabase managed), TLS 1.3 in transit. Keys managed by Supabase KMS with automatic rotation.</li>
                <li>• <strong>Backup & Retention:</strong> Daily backups retained for 30 days. Point-in-time recovery available. Hard deletion after 30-day grace period.</li>
              </ul>
            </div>
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700">
              <Users className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Data Access, Export & Deletion</h3>
              <ul className="space-y-3 text-slate-600 dark:text-slate-300">
                <li>• <strong>Data Export:</strong> Full account data export via <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">GET /api/v1/tenant/data-export</code>. JSON or CSV format. GDPR/CCPA compliant. Includes all reconciliations, jobs, exceptions, and audit logs.</li>
                <li>• <strong>Data Deletion:</strong> Account deletion triggers 30-day grace period (soft delete). After 30 days, hard deletion removes all data from production and backups. Cryptographic erasure verification available for Enterprise.</li>
                <li>• <strong>Audit Logging:</strong> All data access, exports, and deletions logged with timestamp, user ID, IP address, and action type. Immutable logs stored separately from application data.</li>
                <li>• <strong>Self-Service:</strong> Export and deletion available in console (<code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">/dashboard/user</code>). No manual intervention required.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Sub-processors */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center text-slate-900 dark:text-white">
            Sub-processors
          </h2>
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700">
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Settler engages third-party sub-processors to provide our services. All sub-processors undergo security 
              and privacy diligence before engagement. We maintain Data Processing Agreements (DPAs) with all sub-processors 
              that handle customer data.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <h4 className="font-semibold mb-2 text-slate-900 dark:text-white">Infrastructure</h4>
                <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                  <li>• Amazon Web Services (AWS) - Cloud hosting</li>
                  <li>• Vercel - Frontend hosting & edge functions</li>
                  <li>• Supabase - Database & authentication</li>
                  <li>• Upstash - Redis & Kafka (serverless)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-slate-900 dark:text-white">Services</h4>
                <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                  <li>• Stripe - Payment processing</li>
                  <li>• Resend - Transactional emails</li>
                  <li>• OpenAI - LLM processing (opt-in features)</li>
                </ul>
              </div>
            </div>
            <a 
              href="/legal/subprocessors"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              View complete sub-processor list →
            </a>
          </div>
        </div>
      </section>

      {/* Incident Response */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center text-slate-900 dark:text-white">
            Incident Response
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700">
              <AlertTriangle className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Incident Response Process</h3>
              <ol className="space-y-3 text-slate-600 dark:text-slate-300 list-decimal list-inside">
                <li><strong>Detection:</strong> Automated monitoring (Sentry, Supabase alerts, Vercel logs) + manual reports. Initial assessment within 1 hour.</li>
                <li><strong>Containment:</strong> Immediate isolation of affected systems. API rate limiting, IP blocking, or tenant-level suspension if needed.</li>
                <li><strong>Investigation:</strong> Root cause analysis using audit logs, error traces, and system metrics. Impact assessment (affected tenants, data types, time window).</li>
                <li><strong>Notification:</strong> Customer notification within 72 hours for incidents affecting customer data (GDPR requirement). Status page updates for all incidents.</li>
                <li><strong>Remediation:</strong> Fix deployed, systems verified, monitoring enhanced. Post-incident review documented. Process improvements implemented.</li>
              </ol>
            </div>
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700">
              <Globe className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Communication & Reporting</h3>
              <ul className="space-y-3 text-slate-600 dark:text-slate-300">
                <li>• <strong>Security Reports:</strong> <a href="mailto:security@settler.dev" className="text-blue-600 dark:text-blue-400 hover:underline">security@settler.dev</a>. PGP key available on request.</li>
                <li>• <strong>Status Page:</strong> <a href="/status" className="text-blue-600 dark:text-blue-400 hover:underline">settler.dev/status</a>. Real-time system status, incident updates, scheduled maintenance.</li>
                <li>• <strong>Enterprise Notifications:</strong> Direct email to account contacts for incidents affecting customer data. Incident reports with technical details available upon request.</li>
                <li>• <strong>Disclosure Policy:</strong> Responsible disclosure for security vulnerabilities. Public disclosure after remediation (typically 90 days).</li>
                <li>• <strong>Security.txt:</strong> <a href="/.well-known/security.txt" className="text-blue-600 dark:text-blue-400 hover:underline">/.well-known/security.txt</a> for security researchers.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-12 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
            Responsible Disclosure
          </h2>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            We take the security of our systems seriously and value the community's help in identifying vulnerabilities. 
            If you believe you've found a security issue, please report it to us responsibly.
          </p>
          <div className="flex justify-center gap-4">
            <a 
              href="mailto:security@settler.dev"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Email security@settler.dev
            </a>
            <a 
              href="/.well-known/security.txt"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-blue-600 dark:text-blue-400 font-medium hover:underline"
            >
              View security.txt
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </AnimatedPageWrapper>
  );
}
