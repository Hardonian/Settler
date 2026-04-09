import { Badge } from "@/components/ui/badge";
import {
  ENTERPRISE_CAPABILITY_TRUTH,
  getCapabilityStateBadgeClass,
  getCapabilityStateLabel,
} from "@/lib/enterprise/capabilityTruth";

export function CapabilityTruthTable() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="text-xl font-semibold text-foreground">
        Implemented vs staged enterprise truth
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        This table is contract-first: claims stay narrow until verification evidence exists.
      </p>
      <div className="mt-6 overflow-x-auto" role="region" aria-label="Enterprise capability truth">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-3 pr-4 font-semibold">Capability</th>
              <th className="py-3 pr-4 font-semibold">State</th>
              <th className="py-3 pr-4 font-semibold">Boundary</th>
              <th className="py-3 font-semibold">Verification path</th>
            </tr>
          </thead>
          <tbody>
            {ENTERPRISE_CAPABILITY_TRUTH.map((row) => (
              <tr
                key={row.capability}
                className="border-b border-border/70 align-top last:border-0"
              >
                <td className="py-4 pr-4 font-medium text-foreground">{row.capability}</td>
                <td className="py-4 pr-4">
                  <Badge variant="outline" className={getCapabilityStateBadgeClass(row.state)}>
                    {getCapabilityStateLabel(row.state)}
                  </Badge>
                </td>
                <td className="py-4 pr-4 text-muted-foreground">{row.operatorBoundary}</td>
                <td className="py-4 text-muted-foreground">
                  <ul className="list-disc pl-5 space-y-1">
                    {row.verificationPath.map((item) => (
                      <li key={item} className="font-mono text-xs sm:text-sm">
                        {item}
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
