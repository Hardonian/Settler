/** Enhanced Error Handler */
import { NextResponse } from "next/server";
import { sanitizePII } from "@/lib/privacy/pii-filter";

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
  stack?: string;
}

export function createErrorResponse(
  error: unknown,
  defaultMessage: string = "An error occurred",
  defaultStatusCode: number = 500
): NextResponse {
  let apiError: ApiError;

  if (error instanceof Error) {
    let statusCode = defaultStatusCode;

    if (error.message.includes("not found") || error.message.includes("does not exist")) {
      statusCode = 404;
    } else if (error.message.includes("unauthorized") || error.message.includes("authentication")) {
      statusCode = 401;
    } else if (error.message.includes("forbidden") || error.message.includes("permission")) {
      statusCode = 403;
    } else if (error.message.includes("validation") || error.message.includes("invalid")) {
      statusCode = 400;
    } else if (error.message.includes("rate limit")) {
      statusCode = 429;
    }

    // Strip stack in production, sanitize any PII in message
    const safeMessage =
      process.env.NODE_ENV !== "development"
        ? sanitizePII(error.message).toString()
        : error.message || defaultMessage;

    apiError = {
      code: error.name || "INTERNAL_ERROR",
      message: safeMessage,
      statusCode,
      ...(process.env.NODE_ENV === "development" && error.stack ? { stack: error.stack } : {}),
    };
  } else if (typeof error === "object" && error !== null) {
    const errorObj = error as Record<string, unknown>;
    const safeMessage =
      process.env.NODE_ENV !== "development"
        ? sanitizePII(String(errorObj.message || defaultMessage)).toString()
        : String(errorObj.message || defaultMessage);

    apiError = {
      code: String(errorObj.code || "UNKNOWN_ERROR"),
      message: safeMessage,
      statusCode: Number(errorObj.statusCode || defaultStatusCode),
      details: sanitizePII(errorObj.details as Record<string, unknown>).toString(),
    };
  } else {
    apiError = {
      code: "UNKNOWN_ERROR",
      message: defaultMessage,
      statusCode: defaultStatusCode,
    };
  }

  return NextResponse.json(apiError, { status: apiError.statusCode });
}
