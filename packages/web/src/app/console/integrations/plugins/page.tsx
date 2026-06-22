import { Suspense } from "react";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Server, Settings, UploadCloud } from "lucide-react";

export default function WasmPluginsPage() {
  return (
    <div className="space-y-6">
      <ConsolePageHeader
        title="WebAssembly Smart Plugins"
        description="Extend the Settler matching engine with custom, high-performance logic executed securely in the Rust Kernel sandbox."
      />
      <Suspense fallback={<div>Loading plugins...</div>}>
        <PluginsDashboard />
      </Suspense>
    </div>
  );
}

function PluginsDashboard() {
  const plugins = [
    {
      id: "plugin_1",
      name: "Stripe Metadata Extractor",
      version: "1.2.0",
      status: "active",
      language: "Rust",
      executions: 145023,
    },
    {
      id: "plugin_2",
      name: "Legacy Bank Normalizer",
      version: "0.9.1",
      status: "inactive",
      language: "Go",
      executions: 0,
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mt-6">
      <div className="flex justify-end">
        <Button className="flex items-center gap-2">
          <UploadCloud className="h-4 w-4" />
          Deploy New .wasm Plugin
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            Installed Execution Plugins
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Plugin Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Source Language</th>
                  <th className="px-4 py-3">Total Executions</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {plugins.map((plugin) => (
                  <tr key={plugin.id} className="border-t hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium">
                      {plugin.name}
                      <span className="ml-2 text-xs text-muted-foreground">v{plugin.version}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={plugin.status === "active" ? "default" : "secondary"}>
                        {plugin.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{plugin.language} &gt; WASM</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {plugin.executions.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
