"use client";

import { useState, useEffect } from "react";
import { ArrowUp, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface IntegrationVersion {
  current: string;
  latest: string;
  changelog: string[];
  breakingChanges: string[];
  requiresMigration: boolean;
}

interface IntegrationUpgradeFlowProps {
  integrationId: string;
  currentVersion: string;
}

export function IntegrationUpgradeFlow({
  integrationId,
  currentVersion,
}: IntegrationUpgradeFlowProps) {
  const [version, setVersion] = useState<IntegrationVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    void fetchVersionInfo();
  }, [integrationId, currentVersion]);

  const fetchVersionInfo = async () => {
    try {
      const response = await fetch(
        `/api/integrations/${integrationId}/versions?current=${currentVersion}`
      );
      if (response.ok) {
        const data = await response.json();
        setVersion(data);
      }
    } catch (error: unknown) {
      console.error("Failed to fetch version info:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const response = await fetch(`/api/integrations/${integrationId}/upgrade`, {
        method: "POST",
      });

      if (response.ok) {
        alert("Integration upgraded successfully!");
        await fetchVersionInfo();
      } else {
        const error = await response.json();
        alert(`Upgrade failed: ${error.error}`);
      }
    } catch (error: unknown) {
      console.error("Failed to upgrade:", error);
      alert("Failed to upgrade integration");
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!version || version.current === version.latest) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">
              Your integration is up to date (v{currentVersion})
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 dark:border-blue-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Integration Update Available</CardTitle>
            <CardDescription>
              Upgrade from v{version.current} to v{version.latest}
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/30">
            Update Available
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {version.breakingChanges.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Breaking Changes:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                {version.breakingChanges.map((change, index) => (
                  <li key={index}>{change}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {version.requiresMigration && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This upgrade requires a data migration. Your integration will be temporarily
              unavailable during the upgrade process.
            </AlertDescription>
          </Alert>
        )}

        <div>
          <h4 className="font-semibold text-slate-900 dark:text-white mb-2">What&apos;s New:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-400">
            {version.changelog.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>

        <Button
          onClick={handleUpgrade}
          disabled={upgrading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {upgrading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Upgrading...
            </>
          ) : (
            <>
              <ArrowUp className="w-4 h-4 mr-2" />
              Upgrade to v{version.latest}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
