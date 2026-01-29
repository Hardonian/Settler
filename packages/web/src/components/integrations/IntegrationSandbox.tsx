"use client";

import { useState } from "react";
import { Beaker, Play, Square, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface IntegrationSandboxProps {
  integrationId: string;
  onTestComplete?: (success: boolean, result: Record<string, unknown>) => void;
}

export function IntegrationSandbox({ integrationId, onTestComplete }: IntegrationSandboxProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    data?: Record<string, unknown>;
  } | null>(null);

  const handleTest = async () => {
    setIsRunning(true);
    setTestResult(null);

    try {
      // Simulate API test
      const response = await fetch(`/api/integrations/${integrationId}/test`, {
        method: "POST",
      });

      const result = await response.json();

      if (response.ok) {
        setTestResult({
          success: true,
          message: "Integration test passed successfully",
          data: result,
        });
        onTestComplete?.(true, result);
      } else {
        setTestResult({
          success: false,
          message: result.error || "Integration test failed",
          data: result,
        });
        onTestComplete?.(false, result);
      }
    } catch (error: unknown) {
      const errorRecord: Record<string, unknown> = {
        error: error instanceof Error ? error.message : String(error),
        type: 'exception',
      };
      setTestResult({
        success: false,
        message: "Failed to test integration",
      });
      onTestComplete?.(false, errorRecord);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Beaker className="w-5 h-5 text-blue-600" />
              Sandbox Mode
            </CardTitle>
            <CardDescription>
              Test this integration safely without affecting production data
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/30">
            Safe Mode
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Sandbox mode allows you to test integration connections and configurations without
            modifying real data. All operations are isolated and can be safely reverted.
          </AlertDescription>
        </Alert>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleTest}
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isRunning ? (
              <>
                <Square className="w-4 h-4 mr-2 animate-pulse" />
                Testing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run Test
              </>
            )}
          </Button>
        </div>

        {testResult && (
          <div
            className={`p-4 rounded-lg border ${
              testResult.success
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
            }`}
          >
            <div className="flex items-start gap-3">
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p
                  className={`font-medium ${
                    testResult.success
                      ? "text-green-900 dark:text-green-300"
                      : "text-red-900 dark:text-red-300"
                  }`}
                >
                  {testResult.message}
                </p>
                {testResult.data && (
                  <pre className="mt-2 text-xs bg-white dark:bg-slate-800 p-2 rounded overflow-auto">
                    {JSON.stringify(testResult.data, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
