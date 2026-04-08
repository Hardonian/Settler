"use client";

import RoleMatrix from "@/components/RoleMatrix";
import PolicyViewer from "@/components/stitch-import/PolicyViewer";
import FreezeToggle from "@/components/FreezeToggle";
import { PageHeader } from "@/components/app/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, History } from "lucide-react";

export default function GovernancePage() {
  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        eyebrow="Governance & Compliance"
        title="Governance"
        description="Manage policy versions, role boundaries, and operational freeze controls for this workspace."
        icon={ShieldCheck}
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
        <div className="rounded-2xl border border-border/40 bg-card/50 p-6 sm:p-8">
          <PolicyViewer initialPolicies={[]} />
        </div>
      </div>

      {/* Recent Mutations Timeline */}
      <Card className="panel shadow-sm">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <History className="w-4 h-4 text-primary" aria-hidden="true" />
            Recent Mutations
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-3 text-xs text-amber-900">
            Live governance mutation history is not yet wired to canonical audit streams on this
            legacy route. Use <span className="font-semibold">/console/audits</span> for verified,
            tenant-scoped events.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
