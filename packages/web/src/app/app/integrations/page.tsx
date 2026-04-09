import IntegrationList from "@/components/stitch-import/IntegrationList";
import Link from "next/link";
import { Plug, BookOpen } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";

export default function IntegrationsPage() {
  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        eyebrow="Operator Intelligence"
        title="Integrations"
        description="Manage active connectors and upstream data source integrations. Each integration feeds into the reconciliation pipeline and must be verified before use in production runs."
        icon={Plug}
        variant="hero"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/docs/integrations">
                <BookOpen className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                Docs
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/docs/integrations">Add Integration</Link>
            </Button>
          </div>
        }
      />
      <div className="panel p-6">
        <IntegrationList />
      </div>
    </div>
  );
}
