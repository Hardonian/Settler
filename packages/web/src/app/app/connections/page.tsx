"use client";

import ConnectionsTable from "@/components/stitch-import/ConnectionsTable";
import ConnectionDrawer from "@/components/stitch-import/ConnectionDrawer";
import Link from "next/link";
import { Network } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";

export default function ConnectionsPage() {
  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        eyebrow="Operator Intelligence"
        title="Connections"
        description="Manage data source connections and monitor integration health. Active connections provide live transaction data for reconciliation runs."
        icon={Network}
        variant="hero"
        actions={
          <Button size="sm" asChild>
            <Link href="/app/integrations">
              Add Connection
            </Link>
          </Button>
        }
      />
      <div className="panel p-4">
        <ConnectionsTable />
      </div>
      <ConnectionDrawer />
    </div>
  );
}
