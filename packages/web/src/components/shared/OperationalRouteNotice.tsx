"use client";

import { usePathname } from "next/navigation";
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
      className="mb-4 rounded-lg border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">Operational disclosure</span>
        <Badge variant="outline" className="border-amber-500 text-amber-800">
          {meta.maturity}
        </Badge>
        <Badge variant="outline" className="border-amber-500 text-amber-800">
          {meta.scopeSignal === "tenant" ? "Tenant scope" : "Global scope"}
        </Badge>
        {meta.operationalClass === "synthetic" ? (
          <Badge variant="outline" className="border-amber-500 text-amber-800">
            Synthetic surface
          </Badge>
        ) : null}
      </div>
      <p className="mt-2 leading-relaxed">{meta.degradedBehavior}</p>
    </section>
  );
}
