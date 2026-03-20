import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Server, Info } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Edge Nodes - Settler",
  description: "Manage and monitor your edge node deployments",
};

export default function EdgeNodesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Edge Nodes</h1>
          <p className="text-muted-foreground">Manage and monitor your edge node deployments</p>
        </div>
        <Button asChild>
          <Link href="/edge-ai/nodes/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Edge Node
          </Link>
        </Button>
      </div>

      {/* Empty state — no nodes registered yet */}
      <Card className="border-border/40 dark:border-border">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Server className="w-14 h-14 text-muted-foreground/60 mb-4" />
          <CardTitle className="text-xl mb-2 text-foreground">
            No Edge Nodes Registered
          </CardTitle>
          <CardDescription className="max-w-sm mb-6">
            Edge node management is available once nodes are deployed and connected. Deploy your
            first node to start monitoring edge reconciliation jobs.
          </CardDescription>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Info className="w-4 h-4 shrink-0" />
            <span>Node metrics will appear here after the first heartbeat is received.</span>
          </div>
          <Button asChild>
            <Link href="/edge-ai/nodes/new">Deploy Edge Node</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
