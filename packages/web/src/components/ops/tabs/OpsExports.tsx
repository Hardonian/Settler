/**
 * Ops Exports Tab
 * 
 * CSV exports with audit logs
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export function OpsExports() {
  const handleExport = async (type: string) => {
    try {
      const response = await fetch(`/api/ops/export?type=${type}`);
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exports</CardTitle>
        <CardDescription>Export data with audit logs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Available Exports</h3>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => handleExport('customers')} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Customers
            </Button>
            <Button onClick={() => handleExport('usage')} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Usage
            </Button>
            <Button onClick={() => handleExport('errors')} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Errors
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          All exports include audit logs with timestamps and user information.
        </p>
      </CardContent>
    </Card>
  );
}
