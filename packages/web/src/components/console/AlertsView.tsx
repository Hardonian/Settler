/**
 * Alerts View Component
 *
 * Displays intelligent alerts with explanations and threshold tracking.
 */

"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle2, Info, Bell } from "lucide-react";
import type { Alert as DomainAlert } from "@/lib/domain/types";
import { FreezeErrorAlert } from "@/components/shared/FreezeErrorAlert";
import {
  getGovernanceRecoveryHref,
  parseGovernanceFreezeError,
  type GovernanceFreezeErrorDetails,
} from "@/lib/governance/freeze-client";

interface AlertsViewProps {
  includeAcknowledged?: boolean;
}

export function AlertsView({ includeAcknowledged = false }: AlertsViewProps) {
  const [alerts, setAlerts] = useState<DomainAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<DomainAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [freezeError, setFreezeError] = useState<GovernanceFreezeErrorDetails | null>(null);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, [includeAcknowledged]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (includeAcknowledged) params.append("includeAcknowledged", "true");

      const res = await fetch(`/api/console/alerts?${params.toString()}`);

      if (!res.ok) {
        throw new Error(`Failed to fetch alerts: ${res.status}`);
      }

      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (error: unknown) {
      console.error("Failed to fetch alerts:", error);
      setError(error instanceof Error ? error.message : "Failed to load alerts");
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      setAcknowledging(alertId);
      setError(null);
      setFreezeError(null);

      const res = await fetch(`/api/console/alerts/${alertId}/acknowledge`, {
        method: "POST",
      });

      const data = await res.json().catch(() => null);

      const freezeDetails = parseGovernanceFreezeError(data, res.status);
      if (freezeDetails) {
        setFreezeError(freezeDetails);
        return;
      }

      if (!res.ok) {
        throw new Error(`Failed to acknowledge alert: ${res.status}`);
      }

      // Refresh alerts
      await fetchAlerts();
    } catch (error: unknown) {
      console.error("Failed to acknowledge alert:", error);
    } finally {
      setAcknowledging(null);
    }
  };

  const inferRunId = (alert: DomainAlert): string | null => {
    const candidates: string[] = [];

    for (const evidence of alert.explanation.evidence ?? []) {
      if (typeof evidence.value === "string") {
        candidates.push(evidence.value);
      }
    }

    const messageCandidates = [alert.message, alert.title].filter(Boolean);
    candidates.push(...messageCandidates);

    for (const candidate of candidates) {
      const runMatch = candidate.match(/\brun[_:-]([A-Za-z0-9_-]+)/i);
      if (runMatch) return runMatch[0].replace(":", "_").replace("-", "_");

      const uuidMatch = candidate.match(
        /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i
      );
      if (uuidMatch) return uuidMatch[0];
    }

    return null;
  };

  const getSeverityIcon = (severity: DomainAlert["severity"]) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case "info":
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity: DomainAlert["severity"]) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "warning":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      case "info":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading alerts...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Button onClick={fetchAlerts}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged);
  const criticalAlerts = alerts.filter((a: any) => a.severity === "critical" && !a.acknowledged);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Alerts</h2>
          <p className="text-muted-foreground">
            Intelligent alerts with explanations and threshold tracking.
          </p>
        </div>
        <Button onClick={fetchAlerts} variant="outline">
          Refresh
        </Button>
      </div>

      {freezeError && (
        <FreezeErrorAlert
          reason={freezeError.reason}
          frozenAt={freezeError.frozenAt ?? undefined}
          recoveryAction={{
            label: "Open Governance Controls",
            href: getGovernanceRecoveryHref(),
          }}
        />
      )}

      {/* Summary */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Alerts</p>
                  <p className="text-2xl font-bold">{alerts.length}</p>
                </div>
                <Bell className="w-8 h-8 text-muted-foreground/60" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unacknowledged</p>
                  <p className="text-2xl font-bold">{unacknowledgedAlerts.length}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Critical</p>
                  <p className="text-2xl font-bold text-red-600">{criticalAlerts.length}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/60" />
            <h3 className="text-lg font-semibold mb-2">No alerts</h3>
            <p className="text-muted-foreground">
              All systems are operating normally. Alerts will appear here when detected.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const runId = inferRunId(alert);
            return (
              <Card
                key={alert.id}
                className={`hover:shadow-lg transition-shadow ${
                  alert.acknowledged ? "opacity-60" : ""
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getSeverityIcon(alert.severity)}
                        <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                        {alert.acknowledged && <Badge variant="outline">Acknowledged</Badge>}
                      </div>
                      <CardTitle className="text-lg">{alert.title}</CardTitle>
                      <CardDescription className="mt-2">{alert.message}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Explanation */}
                    <div>
                      <p className="text-sm font-medium mb-2">Why This Matters</p>
                      <p className="text-sm text-muted-foreground">
                        {alert.explanation.whyItMatters}
                      </p>
                    </div>

                    {/* Threshold */}
                    {alert.threshold && (
                      <div className="p-4 bg-muted/10 rounded-lg">
                        <p className="text-sm font-medium mb-2">Threshold Exceeded</p>
                        <div className="flex items-center gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Threshold</p>
                            <p className="font-bold">{alert.threshold.value}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Actual</p>
                            <p className="font-bold text-red-600">{alert.threshold.actual}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Type</p>
                            <p className="font-bold">{alert.threshold.type}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Evidence */}
                    {alert.explanation.evidence.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Evidence</p>
                        <div className="flex flex-wrap gap-2">
                          {alert.explanation.evidence.map((evidence, idx) => (
                            <Badge key={idx} variant="outline" className="font-mono text-xs">
                              {evidence.type}: {evidence.value.substring(0, 20)}...
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Suggested Next Step */}
                    {alert.explanation.suggestedNextStep && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                          Suggested Next Step
                        </p>
                        <p className="text-sm text-blue-800 dark:text-blue-400">
                          {alert.explanation.suggestedNextStep}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAlert(alert);
                          setDetailDialogOpen(true);
                        }}
                      >
                        View Details
                      </Button>
                      {runId && (
                        <>
                          <Link
                            href={`/app/runs/${runId}`}
                            className="inline-flex items-center rounded-md border border-border/40 px-3 py-1.5 text-sm font-medium text-foreground/80 hover:bg-muted/10"
                          >
                            Open affected run
                          </Link>
                          <Link
                            href={`/app/replay?runId=${runId}`}
                            className="inline-flex items-center rounded-md border border-border/40 px-3 py-1.5 text-sm font-medium text-foreground/80 hover:bg-muted/10"
                          >
                            Replay affected run
                          </Link>
                        </>
                      )}
                      {!alert.acknowledged && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => acknowledgeAlert(alert.id)}
                          disabled={acknowledging === alert.id}
                        >
                          {acknowledging === alert.id ? (
                            "Acknowledging..."
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Acknowledge
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Created: {new Date(alert.createdAt).toLocaleString()}</span>
                      {alert.acknowledgedAt && (
                        <span>Acknowledged: {new Date(alert.acknowledgedAt).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedAlert?.title}</DialogTitle>
            <DialogDescription>{selectedAlert?.message}</DialogDescription>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Full Explanation</p>
                <p className="text-sm text-muted-foreground">{selectedAlert.explanation.summary}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Why This Matters</p>
                <p className="text-sm text-muted-foreground">
                  {selectedAlert.explanation.whyItMatters}
                </p>
              </div>
              {selectedAlert.explanation.suggestedNextStep && (
                <div>
                  <p className="text-sm font-medium mb-2">Suggested Next Step</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedAlert.explanation.suggestedNextStep}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
