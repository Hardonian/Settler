/**
 * Export Utilities
 * 
 * Functions for exporting data to CSV/JSON formats.
 * Used for exceptions, runs, and audit trail exports.
 */

import { ExceptionItem, ReconciliationRun, AuditItem } from '../metrics/types';

/**
 * Convert data to CSV format
 */
export function toCSV<T extends Record<string, unknown>>(
  data: T[],
  headers: Array<{ key: keyof T; label: string }>
): string {
  if (data.length === 0) {
    return headers.map(h => h.label).join(',');
  }

  const rows = [
    // Header row
    headers.map(h => h.label).join(','),
    // Data rows
    ...data.map(item =>
      headers
        .map(h => {
          const value = item[h.key];
          // Handle null/undefined
          if (value === null || value === undefined) return '';
          // Handle dates
          if (value instanceof Date) return value.toISOString();
          // Handle objects (stringify)
          if (typeof value === 'object') return JSON.stringify(value);
          // Escape commas and quotes
          const str = String(value);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    ),
  ];

  return rows.join('\n');
}

/**
 * Export exceptions to CSV
 */
export function exportExceptionsToCSV(exceptions: ExceptionItem[]): string {
  const headers: Array<{ key: keyof ExceptionItem; label: string }> = [
    { key: 'id', label: 'ID' },
    { key: 'source', label: 'Source' },
    { key: 'severity', label: 'Severity' },
    { key: 'status', label: 'Status' },
    { key: 'reason', label: 'Reason' },
    { key: 'createdAt', label: 'Created At' },
    { key: 'updatedAt', label: 'Updated At' },
    { key: 'ruleId', label: 'Rule ID' },
    { key: 'slaTimer', label: 'SLA Timer (ms)' },
  ];

  return toCSV(exceptions, headers);
}

/**
 * Export runs to CSV
 */
export function exportRunsToCSV(runs: ReconciliationRun[]): string {
  const headers: Array<{ key: keyof ReconciliationRun; label: string }> = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status' },
    { key: 'startedAt', label: 'Started At' },
    { key: 'completedAt', label: 'Completed At' },
    { key: 'matchedCount', label: 'Matched Count' },
    { key: 'unmatchedSourceCount', label: 'Unmatched Source' },
    { key: 'unmatchedTargetCount', label: 'Unmatched Target' },
    { key: 'confidenceAvg', label: 'Confidence Avg' },
  ];

  return toCSV(runs, headers);
}

/**
 * Export audit trail to CSV
 */
export function exportAuditToCSV(audit: AuditItem[]): string {
  const headers: Array<{ key: keyof AuditItem; label: string }> = [
    { key: 'id', label: 'ID' },
    { key: 'auditType', label: 'Type' },
    { key: 'action', label: 'Action' },
    { key: 'entityType', label: 'Entity Type' },
    { key: 'entityId', label: 'Entity ID' },
    { key: 'userId', label: 'User ID' },
    { key: 'createdAt', label: 'Created At' },
    { key: 'ipAddress', label: 'IP Address' },
  ];

  return toCSV(audit, headers);
}

/**
 * Download file
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/csv'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export to JSON
 */
export function exportToJSON<T>(data: T[], filename: string) {
  const json = JSON.stringify(data, null, 2);
  downloadFile(json, filename, 'application/json');
}

/**
 * Export exceptions to JSON
 */
export function exportExceptionsToJSON(exceptions: ExceptionItem[]) {
  exportToJSON(exceptions, `exceptions-${new Date().toISOString().split('T')[0]}.json`);
}

/**
 * Export runs to JSON
 */
export function exportRunsToJSON(runs: ReconciliationRun[]) {
  exportToJSON(runs, `runs-${new Date().toISOString().split('T')[0]}.json`);
}

/**
 * Export audit to JSON
 */
export function exportAuditToJSON(audit: AuditItem[]) {
  exportToJSON(audit, `audit-${new Date().toISOString().split('T')[0]}.json`);
}
