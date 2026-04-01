/**
 * Admin Audit Trail Page
 *
 * Audit trail explorer with filters and export preview.
 */

"use client";

import { useState } from "react";
import { useAdminAudit } from "@/lib/admin/hooks/use-admin-metrics";
import { AuditItem } from "@/lib/admin/metrics/types";
import { exportAuditToCSV, exportAuditToJSON, downloadFile } from "@/lib/admin/utils/export";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Search, FileDown, History } from "lucide-react";
import { NoAuditEmptyState, NoResultsEmptyState } from "@/components/admin/empty-states";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export default function AdminAuditPage() {
  const [ruleIdFilter, setRuleIdFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [actorFilter, setActorFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const auditParams: { limit: number; ruleId?: string; source?: string; actor?: string } = {
    limit: 100,
  };
  if (ruleIdFilter) {
    auditParams.ruleId = ruleIdFilter;
  }
  if (sourceFilter) {
    auditParams.source = sourceFilter;
  }
  if (actorFilter) {
    auditParams.actor = actorFilter;
  }
  const { data: auditData, isLoading } = useAdminAudit(auditParams);

  const filteredItems =
    auditData?.items?.filter((item: AuditItem) => {
      if (
        searchQuery &&
        !item.action.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !item.auditType.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    }) || [];

  return (
    <div className="space-y-6 pb-8">
      <AdminPageHeader
        eyebrow="Compliance & Governance"
        title="Audit Trail"
        description="Complete immutable log of all system and user actions. Filter, inspect, and export evidence for compliance review."
        icon={History}
        actions={
          <div className="relative group">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <div className="absolute right-0 top-full mt-1 bg-card border border-border/60 rounded-lg shadow-lg p-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[160px]">
              <button
                onClick={() => {
                  if (filteredItems.length > 0) {
                    const csv = exportAuditToCSV(filteredItems);
                    downloadFile(csv, `audit-${new Date().toISOString().split("T")[0]}.csv`);
                  }
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted/30 rounded flex items-center gap-2"
              >
                <FileDown className="w-4 h-4" />
                Export as CSV
              </button>
              <button
                onClick={() => {
                  if (filteredItems.length > 0) {
                    exportAuditToJSON(filteredItems);
                  }
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted/30 rounded flex items-center gap-2"
              >
                <FileDown className="w-4 h-4" />
                Export as JSON
              </button>
            </div>
          </div>
        }
      />
      <div className="px-6 sm:px-8 space-y-6">

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Input
              placeholder="Rule ID"
              value={ruleIdFilter}
              onChange={(e) => setRuleIdFilter(e.target.value)}
            />
            <Input
              placeholder="Source"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            />
            <Input
              placeholder="Actor ID"
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Audit List */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Entries ({filteredItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading audit trail...
            </div>
          ) : filteredItems.length === 0 ? (
            searchQuery || ruleIdFilter || sourceFilter || actorFilter ? (
              <NoResultsEmptyState searchQuery={searchQuery} />
            ) : (
              <NoAuditEmptyState />
            )
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item: AuditItem) => (
                <AuditRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

function AuditRow({ item }: { item: AuditItem }) {
  return (
    <div className="p-4 border border-border/40 rounded-lg hover:bg-muted/10 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">{item.auditType}</Badge>
            <span className="font-medium text-foreground">{item.action}</span>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            {item.entityType && (
              <div>
                <span className="font-medium">Entity:</span> {item.entityType}
                {item.entityId && (
                  <span className="ml-2 font-mono text-xs">{item.entityId.slice(0, 8)}</span>
                )}
              </div>
            )}
            {item.userId && (
              <div>
                <span className="font-medium">Actor:</span>{" "}
                <span className="font-mono text-xs">{item.userId.slice(0, 8)}</span>
              </div>
            )}
            <div>
              <span className="font-medium">Time:</span> {new Date(item.createdAt).toLocaleString()}
            </div>
            {item.ipAddress && (
              <div>
                <span className="font-medium">IP:</span> {item.ipAddress}
              </div>
            )}
          </div>
          {item.changes && Object.keys(item.changes).length > 0 && (
            <details className="mt-2">
              <summary className="text-sm text-muted-foreground cursor-pointer">
                View Changes
              </summary>
              <pre className="mt-2 text-xs bg-muted/40 p-3 rounded overflow-auto">
                {JSON.stringify(item.changes, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
