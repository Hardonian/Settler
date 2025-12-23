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
            Security is our foundation
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">
            Settler is built from the ground up with enterprise-grade security, 
            compliance, and data privacy as first-class citizens.
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
                All data is encrypted using AES-256 at rest and TLS 1.3 in transit. 
                We use AWS KMS for key management with regular rotation.
              </p>
            </div>
            <div className="p-6">
              <Server className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Data Retention & Deletion</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Customer data is retained according to configurable policies. 
                We support hard deletion with cryptographic erasure verification.
              </p>
            </div>
            <div className="p-6">
              <Eye className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Audit Logging</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Comprehensive immutable audit logs for all sensitive actions. 
                Available for export to your SIEM via our Enterprise API.
              </p>
            </div>
            <div className="p-6">
              <RefreshCcw className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Disaster Recovery</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Multi-region backups with point-in-time recovery. 
                Regularly tested RPO/RTO targets ensure business continuity.
              </p>
            </div>
            <div className="p-6">
              <Shield className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Infrastructure Security</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Zero-trust network architecture. Automated vulnerability scanning 
                and dependency auditing in CI/CD pipelines.
              </p>
            </div>
            <div className="p-6">
              <FileKey className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Access Control</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Strict least-privilege access policies. 
                SAML SSO and MFA enforcement available for all accounts.
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
              <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Data Processing</h3>
              <ul className="space-y-3 text-slate-600 dark:text-slate-300">
                <li>• Customer data is processed only for the purpose of providing reconciliation services</li>
                <li>• Data is stored in tenant-isolated databases with Row-Level Security (RLS)</li>
                <li>• No cross-tenant data access is possible at the database or application layer</li>
                <li>• Data residency options available (US, EU) for enterprise customers</li>
                <li>• Customer data is never used for AI model training without explicit consent</li>
              </ul>
            </div>
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700">
              <Users className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Data Access & Export</h3>
              <ul className="space-y-3 text-slate-600 dark:text-slate-300">
                <li>• Full account data export available via API (`GET /api/v1/tenant/data-export`)</li>
                <li>• GDPR/CCPA compliant data export in JSON or CSV format</li>
                <li>• Customer data deletion with 30-day grace period and scheduled hard deletion</li>
                <li>• Audit logs capture all data access and export operations</li>
                <li>• Self-service data management available in the console</li>
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
              <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Response Process</h3>
              <ol className="space-y-3 text-slate-600 dark:text-slate-300 list-decimal list-inside">
                <li>Detection and initial assessment within 1 hour</li>
                <li>Containment and mitigation actions immediately</li>
                <li>Root cause analysis and impact assessment</li>
                <li>Customer notification within 72 hours for incidents affecting customer data</li>
                <li>Post-incident review and process improvements</li>
              </ol>
            </div>
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700">
              <Globe className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Communication</h3>
              <ul className="space-y-3 text-slate-600 dark:text-slate-300">
                <li>• Security incidents reported to: <a href="mailto:security@settler.dev" className="text-blue-600 dark:text-blue-400 hover:underline">security@settler.dev</a></li>
                <li>• Status page: <a href="/status" className="text-blue-600 dark:text-blue-400 hover:underline">settler.dev/status</a></li>
                <li>• Enterprise customers receive direct notification via account contacts</li>
                <li>• Public disclosure follows responsible disclosure principles</li>
                <li>• Incident reports available upon request for enterprise customers</li>
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
