"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Handshake, Upload, AlertCircle } from "lucide-react";

export default function VendorPortalPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/v1/vendor-disputes");
        const json = await res.json();
        setData(json.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Handshake className="w-8 h-8 text-primary" /> Partner Dispute Resolution
        </h1>
        <p className="text-muted-foreground">
          Welcome back, {data?.vendorName || "Partner"}. Review open disputes and submit evidence
          directly.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            Open Invoice Disputes
          </CardTitle>
          <CardDescription>
            Upload proof of delivery or compliance documents to resolve these holds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading disputes...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dispute ID</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Amount Held</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Evidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.disputes.map((d: any) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {d.id}
                    </TableCell>
                    <TableCell className="font-medium">{d.invoiceId}</TableCell>
                    <TableCell className="text-sm">{d.reason}</TableCell>
                    <TableCell className="font-mono">${d.amountDisputed}</TableCell>
                    <TableCell>
                      <Badge
                        variant={d.status === "requires_evidence" ? "destructive" : "secondary"}
                      >
                        {d.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {d.status === "requires_evidence" ? (
                        <Button size="sm" className="h-8">
                          <Upload className="w-4 h-4 mr-2" /> Upload
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Under Review</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
