"use client";

import { AlertTriangle, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { checkIntegrationDependencies } from "@/lib/integration-dependencies";
import Link from "next/link";

interface IntegrationDependencyWarningProps {
  currentIntegrations: string[];
  newIntegration: string;
  onDismiss?: () => void;
}

export function IntegrationDependencyWarning({
  currentIntegrations,
  newIntegration,
  onDismiss: _onDismiss,
}: IntegrationDependencyWarningProps) {
  const check = checkIntegrationDependencies(currentIntegrations, newIntegration);

  if (check.errors.length === 0 && check.warnings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {check.errors.length > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Cannot Add Integration</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {check.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
            {check.missingRequirements.length > 0 && (
              <div className="mt-4">
                <p className="font-medium mb-2">Required integrations:</p>
                <div className="flex flex-wrap gap-2">
                  {check.missingRequirements.map((req) => (
                    <Button key={req} asChild size="sm" variant="outline">
                      <Link href={`/dashboard/integrations?add=${req}`}>
                        Connect {req}
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {check.warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Recommendations</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {check.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
