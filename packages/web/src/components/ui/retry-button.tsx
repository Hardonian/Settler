/**
 * Retry Button Component
 *
 * Provides standardized retry functionality with loading states.
 */

"use client";

import { useState } from "react";
import { Button } from "./button";
import { RefreshCw } from "lucide-react";

export interface RetryButtonProps {
  onRetry: () => Promise<void> | void;
  label?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function RetryButton({
  onRetry,
  label = "Try again",
  variant = "outline",
  size = "default",
  className = "",
}: RetryButtonProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRetry = async () => {
    setIsRetrying(true);
    setError(null);

    try {
      await onRetry();
    } catch (error) {
      setError(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <Button
        onClick={handleRetry}
        disabled={isRetrying}
        variant={variant}
        size={size}
        className="min-w-[120px]"
      >
        {isRetrying ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Retrying...
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            {label}
          </>
        )}
      </Button>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
