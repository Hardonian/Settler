/**
 * Error Display Component
 *
 * User-friendly error display with retry functionality
 */

"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getErrorMessage, isRetryableError } from "@/lib/ux/error-messages";

export interface ErrorDisplayProps {
  error: unknown;
  onRetry?: () => void | Promise<void>;
  title?: string;
  className?: string;
}

export function ErrorDisplay({ error, onRetry, title, className }: ErrorDisplayProps) {
  const message = getErrorMessage(error);
  const retryable = isRetryableError(error);

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title || "Something went wrong"}</AlertTitle>
      <AlertDescription className="mt-2">
        <p>{message}</p>
        {retryable && onRetry && (
          <Button variant="outline" size="sm" onClick={() => void onRetry()} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
