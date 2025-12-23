/**
 * SLA Dashboard Component
 * Shows SLA metrics, violations, and agreements
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertTriangle, CheckCircle2, Plus } from 'lucide-react';
import { format } from 'date-fns';

interface SLAViolation {
  id: string;
  slaAgreementId: string;
  metricType: string;
  measuredValue: number;
  targetValue: number;
  violationDate: string;
  severity: string;
  acknowledged: boolean;
  resolved: boolean;
}

export function SLADashboard() {
  const [violations, setViolations] = useState<SLAViolation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAgreement, setNewAgreement] = useState({
    slaType: '',
    targetValue: '',
    measurementPeriod: 'monthly',
  });

  useEffect(() => {
    fetchViolations();
    // In a real implementation, fetch agreements too
  }, []);

  const fetchViolations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/sla/violations?resolved=false');
      if (!res.ok) throw new Error('Failed to fetch violations');
      const data = await res.json();
      setViolations(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load violations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgreement = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/v1/sla/agreements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slaType: newAgreement.slaType,
          targetValue: parseFloat(newAgreement.targetValue),
          measurementPeriod: newAgreement.measurementPeriod,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to create agreement');
      }

      setShowCreateForm(false);
      setNewAgreement({ slaType: '', targetValue: '', measurementPeriod: 'monthly' });
      await fetchViolations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agreement');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeViolation = async (violationId: string) => {
    try {
      const res = await fetch(`/api/v1/sla/violations/${violationId}/acknowledge`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to acknowledge');
      await fetchViolations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to acknowledge violation');
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-600',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      warning: 'bg-blue-500',
    };

    return <Badge className={colors[severity] || 'bg-gray-500'}>{severity.toUpperCase()}</Badge>;
  };

  const calculateCompliance = (measured: number, target: number, metricType: string) => {
    // For uptime: measured should be >= target
    // For latency: measured should be <= target
    if (metricType.includes('latency') || metricType === 'error_rate') {
      return Math.min(100, (target / measured) * 100);
    }
    return Math.min(100, (measured / target) * 100);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>SLA Dashboard</CardTitle>
              <CardDescription>Monitor SLA compliance and violations</CardDescription>
            </div>
            <Button onClick={() => setShowCreateForm(!showCreateForm)}>
              <Plus className="h-4 w-4 mr-2" />
              New Agreement
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create SLA Agreement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>SLA Type</Label>
                  <Select
                    value={newAgreement.slaType}
                    onValueChange={(value) => setNewAgreement({ ...newAgreement, slaType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select SLA type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uptime">Uptime (99.9%)</SelectItem>
                      <SelectItem value="latency_p95">Latency P95 (&lt;2000ms)</SelectItem>
                      <SelectItem value="latency_p99">Latency P99 (&lt;5000ms)</SelectItem>
                      <SelectItem value="error_rate">Error Rate (&lt;0.01%)</SelectItem>
                      <SelectItem value="support_response">Support Response (&lt;4 hours)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Target Value</Label>
                  <Input
                    type="number"
                    value={newAgreement.targetValue}
                    onChange={(e) => setNewAgreement({ ...newAgreement, targetValue: e.target.value })}
                    placeholder="Enter target value"
                  />
                </div>

                <div>
                  <Label>Measurement Period</Label>
                  <Select
                    value={newAgreement.measurementPeriod}
                    onValueChange={(value) => setNewAgreement({ ...newAgreement, measurementPeriod: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCreateAgreement} disabled={loading}>
                    Create Agreement
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {violations.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Active Violations</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead>Measured</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Compliance</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {violations.map((violation) => {
                    const compliance = calculateCompliance(
                      violation.measuredValue,
                      violation.targetValue,
                      violation.metricType
                    );
                    return (
                      <TableRow key={violation.id}>
                        <TableCell className="font-medium">{violation.metricType}</TableCell>
                        <TableCell>{violation.measuredValue.toFixed(2)}</TableCell>
                        <TableCell>{violation.targetValue.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={compliance} className="w-20" />
                            <span className="text-sm">{compliance.toFixed(1)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{getSeverityBadge(violation.severity)}</TableCell>
                        <TableCell>{format(new Date(violation.violationDate), 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                          {violation.acknowledged ? (
                            <Badge variant="outline">Acknowledged</Badge>
                          ) : (
                            <Badge variant="destructive">Unacknowledged</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {!violation.acknowledged && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAcknowledgeViolation(violation.id)}
                            >
                              Acknowledge
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {violations.length === 0 && !loading && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>No active SLA violations</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
