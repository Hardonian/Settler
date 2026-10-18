import type { Metadata } from "next";
import Link from "next/link";
import { AuditDossierWorkbench } from "@/components/console/AuditDossierWorkbench";
import { ConsoleErrorBoundary } from "@/components/console/ErrorBoundary";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { Button } from "@/components/ui/button";
import { ShieldCheck, History } from "lucide-react";

export const metadata: Metadata = {
  title: "Cryptographic Audit Dossier Explorer | Settler Console",
  description:
    "Explore 100% census reconciliation population evidence, Merkle state roots, and client-side verifiable zero-trust auditor dossiers.",
};

export default function AuditDossierPage() {
  return (
    <ConsoleErrorBoundary>
      <div className="space-y-6">
        <ConsolePageHeader
          title="Cryptographic Audit Dossier Explorer"
          description="Produce formal attestation dossiers containing full census transaction proofpacks, Merkle state tree roots, and zero-knowledge client-side verification scripts."
          breadcrumbs={[
            { label: "Console", href: "/console" },
            { label: "Evidence + audit", href: "/console/audits" },
            { label: "Audit Dossier" },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
                <Link href="/console/time-travel">
                  <History className="w-3.5 h-3.5 text-cyan-400" />
                  Time-Travel
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
                <Link href="/verify">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Offline Verifier
                </Link>
              </Button>
            </div>
          }
        />
        <AuditDossierWorkbench />
      </div>
    </ConsoleErrorBoundary>
  );
}
