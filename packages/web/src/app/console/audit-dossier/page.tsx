import { Metadata } from "next";
import { AuditDossierWorkbench } from "@/components/console/AuditDossierWorkbench";
import { ConsoleErrorBoundary } from "@/components/console/ErrorBoundary";

export const metadata: Metadata = {
  title: "Cryptographic Audit Dossier Explorer | Settler Console",
  description:
    "Explore 100% census reconciliation population evidence, Merkle state roots, and client-side verifiable zero-trust auditor dossiers.",
};

export default function AuditDossierPage() {
  return (
    <ConsoleErrorBoundary>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Cryptographic Audit Dossier Explorer
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Produce formal attestation dossiers containing full census transaction proofpacks,
            Merkle state tree roots, and zero-knowledge client-side verification scripts.
          </p>
        </div>
        <AuditDossierWorkbench />
      </div>
    </ConsoleErrorBoundary>
  );
}
