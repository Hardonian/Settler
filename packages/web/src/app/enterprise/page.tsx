import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Shield, Lock, Server, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { SpotlightCard } from '@/components/ui/SpotlightCard';

export default function EnterprisePage() {
  const enterpriseFeatures = [
    {
      title: "Tenant Isolation",
      description: "Dedicated infrastructure or logically isolated tenants with strict data residency controls.",
      icon: Shield,
    },
    {
      title: "Policy Controls",
      description: "Granular RBAC and policy-based gating for all reconciliation and state changes.",
      icon: Lock,
    },
    {
      title: "Self-Hosted Options",
      description: "Deploy in your own VPC or on-premise for full control over your financial data.",
      icon: Server,
    },
    {
      title: "Custom Integrations",
      description: "Native adapters developed for your specific core banking or ERP systems.",
      icon: Users,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white leading-tight mb-6">
                Institutional-Grade <span className="text-blue-600">Reconciliation</span>
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 leading-relaxed">
                Deploy Settler with tenant isolation, policy controls, and deterministic reconciliation APIs designed for high-volume production finance operations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-14 text-lg">
                  Request a Demo
                </Button>
                <Button size="lg" variant="outline" className="px-8 h-14 text-lg bg-white/50 dark:bg-slate-800/50">
                  Talk to Sales
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full" />
              <div className="relative bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700">
                <Image
                  src="/assets/diagrams/system-architecture.svg"
                  alt="Settler Enterprise Architecture"
                  width={600}
                  height={400}
                  className="w-full h-auto rounded-lg"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white dark:bg-slate-950 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Enterprise Capabilities</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">Security, compliance, and scale built-in.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {enterpriseFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <SpotlightCard key={index} className="p-8 border-slate-200 dark:border-slate-800">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-6">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </SpotlightCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* Compliance Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">Built for Compliance</h2>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-70 hover:opacity-100 transition-opacity">
            <div className="flex flex-col items-center gap-2">
              <Image src="/assets/icons/soc2-badge.svg" alt="SOC 2 Type II" width={80} height={80} />
              <span className="text-sm font-semibold">SOC 2 TYPE II</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Image src="/assets/icons/gdpr-badge.svg" alt="GDPR" width={80} height={80} />
              <span className="text-sm font-semibold">GDPR Compliant</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Image src="/assets/icons/encryption-badge.svg" alt="Encryption" width={80} height={80} />
              <span className="text-sm font-semibold">AES-256 Encrypted</span>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-8 italic">Trust but verify.</h2>
          <p className="text-xl text-blue-100 mb-12 leading-relaxed">
            Every dollar matched, every variance explained. Scaling your finance operations hasn't been this deterministic before.
          </p>
          <Button size="lg" variant="secondary" className="px-10 h-16 text-xl font-bold" asChild>
            <Link href="/contact">Schedule an Enterprise Briefing</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

