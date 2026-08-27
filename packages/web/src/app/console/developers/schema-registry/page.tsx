"use client";

import { useState } from "react";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileJson, Database, Code2 } from "lucide-react";

export default function SchemaRegistryPage() {
  const [schemas] = useState([
    {
      id: "schema_1",
      name: "Stripe_Payouts_v2",
      format: "JSON",
      version: "2.1.0",
      status: "active",
      fields: 14,
      lastUpdated: new Date().toISOString(),
    },
    {
      id: "schema_2",
      name: "Chase_BAI2_Daily",
      format: "CSV",
      version: "1.0.5",
      status: "active",
      fields: 8,
      lastUpdated: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: "schema_3",
      name: "Shopify_Orders_Legacy",
      format: "JSON",
      version: "1.0.0",
      status: "deprecated",
      fields: 22,
      lastUpdated: new Date(Date.now() - 86400000 * 45).toISOString(),
    },
  ]);

  return (
    <div className="space-y-6">
      <ConsolePageHeader
        title="Data Schema Registry"
        description="Manage inbound data schemas, field mappings, and canonical transformations."
      />

      <div className="grid md:grid-cols-3 gap-6">
        {schemas.map((s) => (
          <Card key={s.id} className="relative overflow-hidden group">
            <div
              className={`absolute top-0 left-0 w-1 h-full ${s.status === "active" ? "bg-green-500" : "bg-amber-500"}`}
            />
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-mono truncate max-w-[200px]">{s.name}</CardTitle>
                <Badge
                  variant={s.status === "active" ? "default" : "secondary"}
                  className="text-[10px]"
                >
                  {s.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                v{s.version} • {s.format}
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Database className="w-4 h-4" />
                  {s.fields} fields
                </div>
                <div className="flex items-center gap-1">
                  <Code2 className="w-4 h-4" />
                  Mapped
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground flex justify-between items-center">
                <span>Updated {new Date(s.lastUpdated).toLocaleDateString()}</span>
                <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  Edit Mapping &rarr;
                </span>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="border-dashed border-2 flex items-center justify-center bg-muted/5 cursor-pointer hover:bg-muted/10 transition-colors min-h-[160px]">
          <div className="text-center">
            <FileJson className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <span className="text-sm font-medium">Register New Schema</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
