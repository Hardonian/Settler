"use client";

import React from "react";
import {
  ArrowLeft,
  HelpCircle,
  ShieldCheck,
  Download,
  Share,
  Lock,
  ChevronDown,
  BadgeCheck,
  AlertTriangle,
  Clock,
} from "lucide-react";

const SecurityOverview: React.FC = () => {
  return (
    <div className="bg-background-light dark:bg-background-dark font-display antialiased text-slate-900 dark:text-slate-100 selection:bg-primary/30">
      <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden max-w-md mx-auto bg-white dark:bg-slate-900 shadow-2xl">
        {/* Top App Bar */}
        <div className="sticky top-0 z-50 flex items-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 pb-2 justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="text-slate-900 dark:text-slate-100 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </div>
          <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight flex-1 text-center">
            Trust &amp; Security
          </h2>
          <div className="flex w-10 items-center justify-end">
            <HelpCircle className="h-6 w-6 text-primary cursor-pointer" />
          </div>
        </div>
        {/* Hero Section */}
        <div className="flex flex-col gap-6 px-5 py-8">
          <div
            className="w-full bg-center bg-no-repeat aspect-[4/3] bg-cover rounded-2xl shadow-sm relative overflow-hidden group"
            style={{
              backgroundImage:
                'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDbdT-IQZQIYruC7vOl65HWhDnf6Sf27Co_U6HB0cDNqneFnhWlclWwGzjoxcxzSRkulf_0HguO4Lsc__3zKOXemvvidg9dn9WVwFRqhVJTbRYIhks2pAcMHnTFm9KEuQxGqjVJWpyURPXoLFo-J23FEHuW2sTpPOkbfmqR489PkI205crQGLQS1_giVan_qjkFSkDIa2rrJmWOlgdQuj296GiG6ykBXt4lhnRAQ_Gwdwv54mcCldbWhb09lG10UGv5GX2KaaKsoJab")',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/10 mb-2">
                <ShieldCheck className="h-3 w-3" />
                <span className="text-xs font-semibold">ISO 27001 Certified</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4 text-left">
            <h1 className="text-slate-900 dark:text-slate-50 text-3xl font-black leading-tight tracking-tight">
              Security First Architecture
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-base font-normal leading-relaxed">
              Our platform is built on a foundation of trust, transparency, and rigorous security
              standards to protect your most critical data assets.
            </p>
            <div className="flex gap-3 mt-2">
              <button className="flex-1 flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary hover:bg-primary/90 transition-colors text-white text-base font-bold leading-normal tracking-wide shadow-lg shadow-primary/20">
                <span className="truncate">Whitepaper</span>
                <Download className="h-5 w-5 ml-2" />
              </button>
              <button className="flex items-center justify-center rounded-lg size-12 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <Share className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
        {/* Section Divider */}
        <div className="h-2 bg-slate-50 dark:bg-slate-950/50 border-y border-slate-100 dark:border-slate-800/50"></div>
        {/* Core Security Pillars */}
        <div className="flex flex-col px-5 py-8 gap-6">
          <div className="flex flex-col gap-2">
            <h3 className="text-slate-900 dark:text-slate-100 text-xl font-bold leading-tight tracking-tight">
              Enterprise Protection
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Defense-in-depth strategy ensuring confidentiality, integrity, and availability.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            {/* Card 1: Isolation */}
            <div className="flex gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/50 shadow-sm hover:shadow-md transition-shadow">
              <div className="size-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-slate-900 dark:text-slate-100 text-base font-bold">
                  Tenant Isolation
                </h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  Strict logical and physical separation ensures your data remains yours alone.
                </p>
              </div>
            </div>
            {/* Card 2: Auditability */}
            <div className="flex gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/50 shadow-sm hover:shadow-md transition-shadow">
              <div className="size-12 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400">
                <BadgeCheck className="h-6 w-6" />
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-slate-900 dark:text-slate-100 text-base font-bold">
                  Auditability
                </h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  Immutable logs provide complete transparency into every action taken.
                </p>
              </div>
            </div>
            {/* Card 3: Traceability */}
            <div className="flex gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/50 shadow-sm hover:shadow-md transition-shadow">
              <div className="size-12 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0 text-purple-600 dark:text-purple-400">
                <Clock className="h-6 w-6" />
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-slate-900 dark:text-slate-100 text-base font-bold">
                  Traceability
                </h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  Full data lineage tracking allows you to see how data flows and changes.
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Section Divider */}
        <div className="h-2 bg-slate-50 dark:bg-slate-950/50 border-y border-slate-100 dark:border-slate-800/50"></div>
        {/* Detailed Features Accordion */}
        <div className="flex flex-col p-5 gap-4">
          <h3 className="text-slate-900 dark:text-slate-100 text-xl font-bold leading-tight tracking-tight mb-2">
            Technical Details
          </h3>
          <details className="group rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 open:bg-slate-50 dark:open:bg-slate-800/50 transition-colors">
            <summary className="flex cursor-pointer items-center justify-between p-4 list-none">
              <div className="flex items-center gap-3">
                <Lock className="h-6 w-6 text-slate-400 dark:text-slate-500 group-open:text-primary transition-colors" />
                <span className="text-slate-900 dark:text-slate-100 text-sm font-semibold">
                  Encryption at Rest &amp; Transit
                </span>
              </div>
              <ChevronDown className="h-6 w-6 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="px-4 pb-4 pt-0 text-slate-600 dark:text-slate-400 text-sm leading-relaxed pl-[3.25rem]">
              All data is encrypted using AES-256 standards. We use TLS 1.3 for data in transit to
              ensure maximum security during transfer.
            </div>
          </details>
          <details className="group rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 open:bg-slate-50 dark:open:bg-slate-800/50 transition-colors">
            <summary className="flex cursor-pointer items-center justify-between p-4 list-none">
              <div className="flex items-center gap-3">
                <BadgeCheck className="h-6 w-6 text-slate-400 dark:text-slate-500 group-open:text-primary transition-colors" />
                <span className="text-slate-900 dark:text-slate-100 text-sm font-semibold">
                  Access Control &amp; SSO
                </span>
              </div>
              <ChevronDown className="h-6 w-6 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="px-4 pb-4 pt-0 text-slate-600 dark:text-slate-400 text-sm leading-relaxed pl-[3.25rem]">
              Role-based access control (RBAC) allows granular permissions. We support SAML 2.0 and
              OIDC for seamless Single Sign-On integration.
            </div>
          </details>
          <details className="group rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 open:bg-slate-50 dark:open:bg-slate-800/50 transition-colors">
            <summary className="flex cursor-pointer items-center justify-between p-4 list-none">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-slate-400 dark:text-slate-500 group-open:text-primary transition-colors" />
                <span className="text-slate-900 dark:text-slate-100 text-sm font-semibold">
                  Incident Response
                </span>
              </div>
              <ChevronDown className="h-6 w-6 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="px-4 pb-4 pt-0 text-slate-600 dark:text-slate-400 text-sm leading-relaxed pl-[3.25rem]">
              Our 24/7 dedicated security team monitors for anomalies. We have automated response
              protocols to contain threats instantly.
            </div>
          </details>
          <details className="group rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 open:bg-slate-50 dark:open:bg-slate-800/50 transition-colors">
            <summary className="flex cursor-pointer items-center justify-between p-4 list-none">
              <div className="flex items-center gap-3">
                <BadgeCheck className="h-6 w-6 text-slate-400 dark:text-slate-500 group-open:text-primary transition-colors" />
                <span className="text-slate-900 dark:text-slate-100 text-sm font-semibold">
                  Compliance Certifications
                </span>
              </div>
              <ChevronDown className="h-6 w-6 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="px-4 pb-4 pt-0 pl-[3.25rem]">
              <div className="flex flex-wrap gap-2 mt-1">
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300">
                  SOC 2 Type II
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300">
                  GDPR
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300">
                  HIPAA
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300">
                  ISO 27001
                </span>
              </div>
            </div>
          </details>
        </div>
        {/* Compliance Logos (Visual Trust) */}
        <div className="px-5 pb-8 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4 text-center">
            Standards we meet
          </h4>
          <div className="grid grid-cols-3 gap-4 opacity-70 grayscale">
            {/* Using simple SVGs for logos representation */}
            <div className="flex items-center justify-center p-3 rounded bg-slate-50 dark:bg-slate-800">
              <div className="h-6 w-full bg-slate-300 dark:bg-slate-600 rounded"></div>
            </div>
            <div className="flex items-center justify-center p-3 rounded bg-slate-50 dark:bg-slate-800">
              <div className="h-6 w-full bg-slate-300 dark:bg-slate-600 rounded"></div>
            </div>
            <div className="flex items-center justify-center p-3 rounded bg-slate-50 dark:bg-slate-800">
              <div className="h-6 w-full bg-slate-300 dark:bg-slate-600 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityOverview;
