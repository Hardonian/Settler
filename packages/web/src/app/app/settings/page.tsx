import Link from "next/link";
import RoleMatrix from "@/components/RoleMatrix";
import FreezeToggle from "@/components/FreezeToggle";
import { PageHeader } from "@/components/app/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, FileSearch, Search, ArrowRight } from "lucide-react";

const auditLinks = [
  {
    href: "/console/audits",
    label: "Audit Surfaces",
    description: "Inspect all tenant-scoped audit events",
    icon: FileSearch,
  },
  {
    href: "/app/evidence",
    label: "Evidence Query Surface",
    description: "Query cryptographic proof artifacts",
    icon: Search,
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        eyebrow="Governance"
        title="Tenant Isolation Controls"
        description="Configure runtime controls and role boundaries used to preserve multi-tenant safety. Changes here affect all active reconciliation workflows for this workspace."
        icon={Settings}
        variant="hero"
      />

      {/* Controls */}
      <div className="space-y-4">
        <div className="panel p-6">
          <FreezeToggle />
        </div>
        <div className="panel p-6">
          <RoleMatrix />
        </div>
      </div>

      {/* Audit reference card */}
      <Card className="border-border/60 shadow-none bg-muted/10">
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Tenant isolation verification artifacts are tracked under{" "}
            <code className="code-inline">security/evidence</code>. Route-level controls are visible
            in the audit surfaces.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {auditLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center justify-between rounded-lg border border-border/60 bg-card p-3.5 hover:border-primary/30 hover:bg-primary/5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/60 group-hover:bg-primary/10 transition-colors">
                    <link.icon
                      className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                      {link.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">{link.description}</p>
                  </div>
                </div>
                <ArrowRight
                  className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
