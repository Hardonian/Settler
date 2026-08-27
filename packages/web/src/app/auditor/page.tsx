"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileSearch, ShieldCheck } from "lucide-react";

export default function AuditorPage() {
  const [samples, setSamples] = useState<any[]>([]);
  const [controls, setControls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [samplesRes, controlsRes] = await Promise.all([
          fetch("/api/auditor/samples?limit=5"),
          fetch("/api/auditor/controls"),
        ]);
        const samplesJson = await samplesRes.json();
        const controlsJson = await controlsRes.json();

        setSamples(samplesJson.data?.samples || []);
        setControls(controlsJson.data?.controls || []);
      } catch (e) {
        console.error("Failed to load auditor data", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSearch className="w-5 h-5 text-primary" />
              Statistically Significant Samples
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading samples...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sample ID</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Proof Pack</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {samples.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.id}</TableCell>
                      <TableCell>${s.sourceAmount}</TableCell>
                      <TableCell>${s.targetAmount}</TableCell>
                      <TableCell>
                        <Badge variant={s.status === "matched" ? "default" : "destructive"}>
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-primary cursor-pointer hover:underline">
                        {s.proofPackId}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              SOX & SOC2 Controls Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading controls...</p>
            ) : (
              <div className="space-y-4">
                {controls.map((c) => (
                  <div
                    key={c.id}
                    className="flex justify-between items-center p-3 border border-border/60 rounded-lg"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{c.id}</span>
                        <span className="font-medium text-sm">{c.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Last Tested: {new Date(c.lastTested).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      {c.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
