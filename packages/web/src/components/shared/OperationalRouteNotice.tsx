"use client";

import { usePathname } from "next/navigation";
import { AlertTriangle, Database, Landmark, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getOperationalRouteMeta } from "@/lib/routes/operational-truth";

export function OperationalRouteNotice() {
  const pathname = usePathname();
  const meta = pathname ? getOperationalRouteMeta(pathname) : null;

  if (!meta?.disclosureRequired) {
    return null;
  }

  return (
    <Alert
      variant="warning"
      aria-label="Operational route disclosure"
      className="mb-6 rounded-xl border-amber-300/70 bg-amber-50/80 shadow-sm dark:border-amber-800 dark:bg-amber-950/40"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <AlertTitle className="mb-0">Operational disclosure</AlertTitle>
          <Badge variant="outline" className="border-amber-500/80 text-current">
            {meta.maturity}
          </Badge>
          <Badge
            variant="outline"
            className="inline-flex items-center gap-1 border-amber-500/80 text-current"
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
              className="inline-flex items-center gap-1 border-amber-500/80 text-current"
            >
              <Database className="h-3 w-3" aria-hidden="true" />
              {meta.runtimeDependency} dependency
            </Badge>
          ) : null}
          {meta.operationalClass === "synthetic" ? (
            <Badge variant="outline" className="border-amber-500/80 text-current">
              Synthetic surface
            </Badge>
          ) : null}
        </div>
        <AlertDescription className="leading-relaxed">{meta.degradedBehavior}</AlertDescription>
      </div>
    </Alert>
  );
}
