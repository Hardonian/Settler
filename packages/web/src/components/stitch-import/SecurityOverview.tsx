"use client";

import React from "react";
import { ShieldCheck, BadgeCheck, Clock, Lock, ChevronDown, AlertTriangle } from "lucide-react";
import { DemoBanner } from "@/components/app/DemoBanner";

const pillars = [
  {
    icon: ShieldCheck,
    title: "Tenant Isolation",
    description:
      "Strict logical and physical separation ensures your data remains yours alone. Each tenant operates in an isolated execution context with no cross-contamination.",
    color: "text-primary bg-primary/10",
  },
  {
    icon: BadgeCheck,
    title: "Auditability",
    description:
      "Immutable logs provide complete transparency into every action taken. Every reconciliation run produces a verifiable evidence bundle.",
    color: "text-success bg-success/10",
  },
  {
    icon: Clock,
    title: "Traceability",
    description:
      "Full data lineage tracking shows how data flows and changes across every run. Deterministic fingerprints allow exact output verification.",
    color: "text-secondary bg-secondary/10",
  },
];

const certifications = ["SOC 2 alignment (audit pending)", "GDPR support", "HIPAA-mapped controls"];

const technicalDetails = [
  {
    icon: Lock,
    title: "Encryption at Rest & Transit",
    body: "All data is encrypted using AES-256 standards. TLS 1.3 is enforced for data in transit.",
  },
  {
    icon: BadgeCheck,
    title: "Access Control & SSO",
    body: "Role-based access control (RBAC) is implemented. SSO/SAML/OIDC is environment and IdP dependent and must be validated before production rollout.",
  },
  {
    icon: AlertTriangle,
    title: "Incident Response",
    body: "24/7 security monitoring with automated response protocols to contain threats and notify stakeholders.",
  },
];

const SecurityOverview: React.FC = () => {
  return (
    <div className="space-y-6">
      <DemoBanner label="Certification claims and security posture below reflect design intent. Verify active certifications through your compliance team." />

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Security-First Architecture</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Defense-in-depth strategy ensuring confidentiality, integrity, and availability across all
          reconciliation workloads.
        </p>
      </div>

      {/* Compliance badges */}
      <div className="flex flex-wrap gap-2">
        {certifications.map((cert) => (
          <span
            key={cert}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-muted/10 px-3 py-1 text-xs font-semibold text-foreground/80"
          >
            <BadgeCheck className="h-3.5 w-3.5 text-green-600" aria-hidden="true" />
            {cert}
          </span>
        ))}
      </div>

      {/* Security pillars */}
      <div className="grid gap-4 md:grid-cols-3">
        {pillars.map(({ icon: Icon, title, description, color }) => (
          <div key={title} className="panel p-4 transition-shadow hover:shadow-md">
            <div className={`mb-3 inline-flex rounded-lg p-2.5 ${color}`}>
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-bold text-foreground">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
          </div>
        ))}
      </div>

      {/* Technical details */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Technical Details
        </h3>
        <div className="space-y-2">
          {technicalDetails.map(({ icon: Icon, title, body }) => (
            <details
              key={title}
              className="group rounded-xl border border-border/40 bg-card open:bg-muted/10 transition-colors"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Icon
                    className="h-5 w-5 text-muted-foreground/60 transition-colors group-open:text-primary"
                    aria-hidden="true"
                  />
                  <span className="text-sm font-semibold text-foreground">{title}</span>
                </div>
                <ChevronDown
                  className="h-5 w-5 text-muted-foreground/60 transition-transform duration-200 group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <div className="px-4 pb-4 pt-0 pl-12 text-sm leading-relaxed text-muted-foreground">
                {body}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SecurityOverview;
