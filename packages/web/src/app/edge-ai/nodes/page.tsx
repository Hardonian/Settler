import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Server, Activity, AlertCircle } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Edge Nodes - Settler",
  description: "Manage and monitor your edge node deployments",
};

// Mock data - in production, fetch from API
const mockNodes = [
  {
    id: "node-1",
    name: "Retail Store #1",
    status: "active",
    deviceType: "edge_gateway",
    lastHeartbeat: "2024-01-15T10:30:00Z",
    jobsProcessed: 1250,
    location: "San Francisco, CA",
  },
  {
    id: "node-2",
    name: "Warehouse Node",
    status: "active",
    deviceType: "server",
    lastHeartbeat: "2024-01-15T10:29:45Z",
    jobsProcessed: 3420,
    location: "Austin, TX",
  },
  {
    id: "node-3",
    name: "Mobile POS Terminal",
    status: "degraded",
    deviceType: "mobile",
    lastHeartbeat: "2024-01-15T10:25:00Z",
    jobsProcessed: 890,
    location: "New York, NY",
  },
];

export default function EdgeNodesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Edge Nodes</h1>
          <p className="text-gray-600">Manage and monitor your edge node deployments</p>
        </div>
        <Button asChild>
          <Link href="/edge-ai/nodes/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Edge Node
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Nodes</CardDescription>
            <CardTitle className="text-3xl">{mockNodes.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Nodes</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {mockNodes.filter((n) => n.status === "active").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Jobs Processed</CardDescription>
            <CardTitle className="text-3xl">
              {mockNodes.reduce((sum, n) => sum + n.jobsProcessed, 0).toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Uptime</CardDescription>
            <CardTitle className="text-3xl">99.8%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Nodes List */}
      <div className="grid gap-4">
        {mockNodes.map((node) => (
          <Card key={node.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="w-5 h-5" />
                    {node.name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {node.location} • {node.deviceType}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {node.status === "active" ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <Activity className="w-4 h-4" />
                      Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-yellow-600">
                      <AlertCircle className="w-4 h-4" />
                      Degraded
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Last Heartbeat:</span>
                  <p className="font-medium">{new Date(node.lastHeartbeat).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Jobs Processed:</span>
                  <p className="font-medium">{node.jobsProcessed.toLocaleString()}</p>
                </div>
                <div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/edge-ai/nodes/${node.id}`}>View Details</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {mockNodes.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Server className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <CardTitle className="mb-2">No Edge Nodes</CardTitle>
            <CardDescription className="mb-4">
              Get started by deploying your first edge node
            </CardDescription>
            <Button asChild>
              <Link href="/edge-ai/nodes/new">Deploy Edge Node</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
