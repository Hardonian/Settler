import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getConsoleRouteMeta } from "@/lib/console/route-maturity";

export function RouteOperationalNotice({ route }: { route: string }) {
  const meta = getConsoleRouteMeta(route);
  if (!meta || !meta.explicitDisclosureRequired) return null;

  return (
    <Card className="border-amber-200/70 bg-amber-50/70 dark:border-amber-800 dark:bg-amber-950/30">
      <CardContent className="flex items-start gap-3 p-4">
        <AlertTriangle
          className="mt-0.5 h-4 w-4 text-amber-700 dark:text-amber-300"
          aria-hidden="true"
        />
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
              Operational disclosure
            </p>
            <Badge
              variant="outline"
              className="border-amber-300 text-amber-900 dark:text-amber-100"
            >
              {meta.maturity}
            </Badge>
            <Badge
              variant="outline"
              className="border-amber-300 text-amber-900 dark:text-amber-100"
            >
              {meta.dataMode}
            </Badge>
          </div>
          <p className="text-sm text-amber-900/90 dark:text-amber-100/90">
            {meta.degradedBehavior}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
