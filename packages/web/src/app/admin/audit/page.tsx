/**
 * Admin Audit Trail Page
 * 
 * Audit trail explorer with filters and export preview.
 */

'use client';

import { useState } from 'react';
import { useAdminAudit } from '@/lib/admin/hooks/use-admin-metrics';
import { AuditItem } from '@/lib/admin/metrics/types';
import { exportAuditToCSV, exportAuditToJSON, downloadFile } from '@/lib/admin/utils/export';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Search, FileDown } from 'lucide-react';
import { NoAuditEmptyState, NoResultsEmptyState } from '@/components/admin/empty-states';

export default function AdminAuditPage() {
  const [ruleIdFilter, setRuleIdFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: auditData, isLoading } = useAdminAudit({
    ruleId: ruleIdFilter || undefined,
    source: sourceFilter || undefined,
    actor: actorFilter || undefined,
    limit: 100,
  });

  const filteredItems = auditData?.items?.filter((item: AuditItem) => {
    if (searchQuery && !item.action.toLowerCase().includes(searchQuery.toLowerCase()) && !item.auditType.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  }) || [];

  return (
    <div className="p-8 space-y-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Audit Trail</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Complete audit log explorer and export
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg p-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => {
                  if (filteredItems.length > 0) {
                    const csv = exportAuditToCSV(filteredItems);
                    downloadFile(csv, `audit-${new Date().toISOString().split('T')[0]}.csv`);
                  }
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 rounded flex items-center gap-2"
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
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 rounded flex items-center gap-2"
              >
                <FileDown className="w-4 h-4" />
                Export as JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
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
          <CardTitle>
            Audit Entries ({filteredItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
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
              {filteredItems.map((item) => (
                <AuditRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AuditRow({ item }: { item: AuditItem }) {
  return (
    <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">{item.auditType}</Badge>
            <span className="font-medium text-slate-900 dark:text-white">
              {item.action}
            </span>
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400 space-y-1">
            {item.entityType && (
              <div>
                <span className="font-medium">Entity:</span> {item.entityType}
                {item.entityId && <span className="ml-2 font-mono text-xs">{item.entityId.slice(0, 8)}</span>}
              </div>
            )}
            {item.userId && (
              <div>
                <span className="font-medium">Actor:</span> <span className="font-mono text-xs">{item.userId.slice(0, 8)}</span>
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
              <summary className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                View Changes
              </summary>
              <pre className="mt-2 text-xs bg-slate-100 dark:bg-slate-800 p-3 rounded overflow-auto">
                {JSON.stringify(item.changes, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
