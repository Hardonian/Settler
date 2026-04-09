/**
 * Console-Specific Error Handling
 *
 * Standardized error handling for console routes with:
 * - User-friendly error messages
 * - Consistent error formatting
 * - Error recovery strategies
 * - Logging and monitoring
 */

import { NextResponse } from "next/server";
import { ErrorCodes } from "@/lib/server-error-handler";
import { getCorrelationId, addCorrelationHeaders } from "@/lib/monitoring/correlation";

export interface ConsoleError {
  code: string;
  message: string;
  userMessage: string;
  recoverable: boolean;
  action?: {
    label: string;
    url: string;
  };
}

/**
 * Map error to user-friendly console error
 */
export function mapToConsoleError(error: unknown): ConsoleError {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";

  // Authentication errors
  if (errorMessage.includes("Unauthorized") || errorMessage.includes("authentication")) {
    return {
      code: ErrorCodes.UNAUTHORIZED,
      message: errorMessage,
      userMessage: "Please sign in to access this feature.",
      recoverable: true,
      action: {
        label: "Sign In",
        url: "/signup",
      },
    };
  }

  // Permission errors
  if (errorMessage.includes("Forbidden") || errorMessage.includes("permission")) {
    return {
      code: ErrorCodes.FORBIDDEN,
      message: errorMessage,
      userMessage: "You don't have permission to perform this action.",
      recoverable: false,
    };
  }

  // Validation errors
  if (errorMessage.includes("validation") || errorMessage.includes("Invalid")) {
    return {
      code: ErrorCodes.VALIDATION_ERROR,
      message: errorMessage,
      userMessage: "Please check your input and try again.",
      recoverable: true,
    };
  }

  // Database errors
  if (
    errorMessage.includes("database") ||
    errorMessage.includes("prisma") ||
    errorMessage.includes("connection")
  ) {
    return {
      code: ErrorCodes.DATABASE_ERROR,
      message: errorMessage,
      userMessage: "We're experiencing database issues. Please try again in a moment.",
      recoverable: true,
      action: {
        label: "Retry",
        url: "#",
      },
    };
  }

  // Rate limit errors
  if (errorMessage.includes("rate limit") || errorMessage.includes("too many")) {
    return {
      code: ErrorCodes.RATE_LIMIT_EXCEEDED,
      message: errorMessage,
      userMessage: "You've made too many requests. Please wait a moment and try again.",
      recoverable: true,
    };
  }

  // Network errors
  if (
    errorMessage.includes("network") ||
    errorMessage.includes("fetch") ||
    errorMessage.includes("timeout")
  ) {
    return {
      code: ErrorCodes.NETWORK_ERROR,
      message: errorMessage,
      userMessage: "Network error. Please check your connection and try again.",
      recoverable: true,
      action: {
        label: "Retry",
        url: "#",
      },
    };
  }

  // Default error
  return {
    code: ErrorCodes.INTERNAL_ERROR,
    message: errorMessage,
    userMessage:
      "Something went wrong. Please try again or contact support if the problem persists.",
    recoverable: true,
    action: {
      label: "Contact Support",
      url: "/console/support",
    },
  };
}

/**
 * Create console error response
 */
export async function createConsoleErrorResponse(
  error: unknown,
  statusCode = 500
): Promise<NextResponse> {
  const consoleError = mapToConsoleError(error);
  const correlationId = await getCorrelationId();

  // Log error with context
  console.error("[Console Error]", {
    code: consoleError.code,
    message: consoleError.message,
    userMessage: consoleError.userMessage,
    correlationId,
    recoverable: consoleError.recoverable,
  });

  // Return user-friendly error response
  const response = NextResponse.json(
    {
      error: consoleError.userMessage,
      code: consoleError.code,
      recoverable: consoleError.recoverable,
      action: consoleError.action,
    },
    { status: statusCode }
  );

  return addCorrelationHeaders(response, correlationId);
}

/**
 * Handle console route errors safely
 */
export function withConsoleErrorHandler<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      return await createConsoleErrorResponse(error);
    }
  }) as T;
}
