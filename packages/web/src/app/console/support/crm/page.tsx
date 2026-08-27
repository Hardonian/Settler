"use client";

import { useEffect, useState } from "react";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
import { Headset, ExternalLink, Link as LinkIcon, RefreshCcw } from "lucide-react";

export default function SupportCRMPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/v1/support/tickets");
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
    <div className="space-y-6">
      <ConsolePageHeader
        title="Customer Support Intake (CX)"
        description="Connect CRM tickets directly to ledger exceptions to slash resolution times."
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Headset className="w-5 h-5 text-primary" />
            Active Support Tickets
          </CardTitle>
          <div className="flex gap-3">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {data?.platform || "Zendesk"} Connected
            </Badge>
            <Button variant="outline" size="sm" className="h-8">
              <RefreshCcw className="w-4 h-4 mr-2" /> Sync CRM
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading tickets...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dispute Amount</TableHead>
                  <TableHead>Linked Exception</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.tickets.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs font-semibold">{t.id}</TableCell>
                    <TableCell>{t.customerName}</TableCell>
                    <TableCell className="text-sm">{t.subject}</TableCell>
                    <TableCell>
                      <Badge variant={t.priority === "high" ? "destructive" : "secondary"}>
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell>${t.amountInDispute}</TableCell>
                    <TableCell>
                      {t.linkedExceptionId ? (
                        <div className="flex items-center gap-1 text-primary cursor-pointer text-xs font-mono">
                          <LinkIcon className="w-3 h-3" /> {t.linkedExceptionId}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Unlinked</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8">
                        View <ExternalLink className="w-3 h-3 ml-2" />
                      </Button>
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
