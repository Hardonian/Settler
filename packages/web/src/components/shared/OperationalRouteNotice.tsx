"use client";

import { usePathname } from "next/navigation";
import { AlertTriangle, Database, Landmark, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getOperationalRouteMeta } from "@/lib/routes/operational-truth";

export function OperationalRouteNotice() {
  const pathname = usePathname();
  const meta = pathname ? getOperationalRouteMeta(pathname) : null;

  if (!meta?.disclosureRequired) {
    return null;
  }

  return (
    <section
      aria-label="Operational route disclosure"
      className="mb-6 rounded-xl border border-amber-300/70 bg-amber-50/80 px-4 py-4 text-sm text-amber-950 shadow-sm dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">Operational disclosure</span>
            <Badge
              variant="outline"
              className="border-amber-500/80 text-amber-800 dark:text-amber-100"
            >
              {meta.maturity}
            </Badge>
            <Badge
              variant="outline"
              className="inline-flex items-center gap-1 border-amber-500/80 text-amber-800 dark:text-amber-100"
            >
              {meta.scopeSignal === "tenant" ? (
                <Landmark className="h-3 w-3" aria-hidden="true" />
              ) : (
                <Shield className="h-3 w-3" aria-hidden="true" />
              )}
              {meta.scopeSignal === "tenant" ? "Tenant scope" : "Global scope"}
            </Badge>
            {meta.runtimeDependency !== "none" ? (
              <Badge
                variant="outline"
                className="inline-flex items-center gap-1 border-amber-500/80 text-amber-800 dark:text-amber-100"
              >
                <Database className="h-3 w-3" aria-hidden="true" />
                {meta.runtimeDependency} dependency
              </Badge>
            ) : null}
            {meta.operationalClass === "synthetic" ? (
              <Badge
                variant="outline"
                className="border-amber-500/80 text-amber-800 dark:text-amber-100"
              >
                Synthetic surface
              </Badge>
            ) : null}
          </div>
          <p className="leading-relaxed text-amber-900/90 dark:text-amber-100/90">
            {meta.degradedBehavior}
          </p>
        </div>
      </div>
    </section>
  );
}
