/**
 * ErrorState Component
 *
 * Reusable error state display component with consistent styling and accessibility.
 * Provides multiple variants and sizes for different contexts.
 */

"use client";

import { AlertCircle, RefreshCw, HelpCircle, Home, ArrowLeft } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export interface ErrorStateProps {
  /**
   * Error message to display (Error object, string, or null)
   */
  error?: Error | string | null;
  /**
   * Alternative message prop (takes precedence over error message)
   */
  message?: string;
  /**
   * Title for the error state
   */
  title?: string;
  /**
   * Callback when retry is clicked
   */
  onRetry?: () => void;
  /**
   * Show retry button
   * @default true
   */
  showRetry?: boolean;
  /**
   * Custom retry button text
   * @default 'Try Again'
   */
  retryText?: string;
  /**
   * Show contact support option
   */
  showSupport?: boolean;
  /**
   * Support link/action
   */
  supportAction?: () => void;
  /**
   * Size variant
   * @default 'default'
   */
  size?: "sm" | "default" | "lg";
  /**
   * Display variant - 'default' for full page, 'minimal' for inline, 'full' for full-screen
   * @default 'default'
   */
  variant?: "default" | "minimal" | "full";
  /**
   * Show home button
   */
  showHome?: boolean;
  /**
   * Show back button
   */
  showBack?: boolean;
  /**
   * Callback for home button
   */
  onHome?: () => void;
  /**
   * Callback for back button
   */
  onBack?: () => void;
  /**
   * Additional className
   */
  className?: string;
}

export function ErrorState({
  error,
  message,
  title = "Error loading data",
  onRetry,
  showRetry = true,
  retryText = "Try Again",
  showSupport = false,
  supportAction,
  size = "default",
  variant = "default",
  showHome = false,
  showBack = false,
  onHome,
  onBack,
  className,
}: ErrorStateProps) {
  // Extract user-friendly error message (avoid exposing internal details)
  const getErrorMessage = (): string => {
    // message prop takes precedence
    if (message) return message;

    if (!error) return "An unexpected error occurred";

    if (error instanceof Error) {
      // Don't expose stack traces or internal error details
      const msg = error.message;
      // Filter out technical details
      if (msg.includes("NetworkError") || msg.includes("Failed to fetch")) {
        return "Network error. Please check your connection and try again.";
      }
      if (msg.includes("404") || msg.includes("Not Found")) {
        return "The requested resource was not found.";
      }
      if (msg.includes("401") || msg.includes("Unauthorized")) {
        return "You are not authorized to access this resource.";
      }
      if (msg.includes("403") || msg.includes("Forbidden")) {
        return "Access forbidden.";
      }
      if (msg.includes("500") || msg.includes("Server Error")) {
        return "Server error. Please try again later.";
      }
      // Return sanitized message
      return msg.length > 200 ? "An unexpected error occurred" : msg;
    }

    if (typeof error === "string") {
      return error.length > 200 ? "An unexpected error occurred" : error;
    }

    return "An unexpected error occurred";
  };

  const errorMessage = getErrorMessage();

  // Minimal variant - inline error style
  if (variant === "minimal") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg",
          className
        )}
        role="alert"
      >
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span>{errorMessage}</span>
        {showRetry && onRetry && (
          <button
            onClick={onRetry}
            className="ml-auto text-xs underline hover:no-underline"
            aria-label={retryText}
          >
            {retryText}
          </button>
        )}
      </div>
    );
  }

  // Ensure title is a proper heading level
  const HeadingTag = size === "lg" ? "h2" : size === "sm" ? "h4" : "h3";

  const sizeClasses = {
    sm: {
      container: "py-8",
      icon: "w-10 h-10",
      title: "text-base",
      description: "text-sm",
    },
    default: {
      container: "py-12",
      icon: "w-12 h-12",
      title: "text-lg",
      description: "text-base",
    },
    lg: {
      container: "py-16",
      icon: "w-16 h-16",
      title: "text-xl",
      description: "text-lg",
    },
  };

  const fullScreenClasses = variant === "full" ? "min-h-screen" : "";
  const currentSize = sizeClasses[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-4",
        currentSize.container,
        fullScreenClasses,
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <AlertCircle
        className={cn("text-destructive mb-4", currentSize.icon, "motion-safe:animate-fade-in")}
        aria-hidden="true"
      />
      <HeadingTag
        className={cn("font-semibold text-foreground mb-2 text-center", currentSize.title)}
      >
        {title}
      </HeadingTag>
      <p
        className={cn(
          "text-muted-foreground text-center mb-6 max-w-md mx-auto",
          currentSize.description
        )}
      >
        {errorMessage}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        {showRetry && onRetry && (
          <Button
            onClick={onRetry}
            variant="default"
            size={size === "sm" ? "sm" : "default"}
            aria-label={retryText}
          >
            <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
            {retryText}
          </Button>
        )}
        {showHome && (
          <Button
            onClick={onHome || (() => (window.location.href = "/"))}
            variant="outline"
            size={size === "sm" ? "sm" : "default"}
            aria-label="Go to homepage"
          >
            <Home className="w-4 h-4 mr-2" aria-hidden="true" />
            Go Home
          </Button>
        )}
        {showBack && (
          <Button
            onClick={onBack || (() => window.history.back())}
            variant="outline"
            size={size === "sm" ? "sm" : "default"}
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
            Go Back
          </Button>
        )}
        {showSupport && supportAction && (
          <Button
            onClick={supportAction}
            variant="outline"
            size={size === "sm" ? "sm" : "default"}
            aria-label="Contact Support"
          >
            <HelpCircle className="w-4 h-4 mr-2" aria-hidden="true" />
            Contact Support
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Inline error component for form fields and small spaces
 */
export function InlineError({ message, className }: { message: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-1 text-sm text-destructive", className)} role="alert">
      <AlertCircle className="w-4 h-4" />
      <span>{message}</span>
    </div>
  );
}
