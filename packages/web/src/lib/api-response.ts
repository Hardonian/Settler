import { NextResponse } from "next/server";

export interface ErrorDetails {
  [key: string]: unknown;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: ErrorDetails;
  };
}

export function createErrorResponse(
  code: string,
  message: string,
  statusCode: number,
  details?: ErrorDetails
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details,
      },
    },
    { status: statusCode }
  );
}

export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  console.error("API Error:", error);
  const message = error instanceof Error ? error.message : "Internal Server Error";

  if (message.includes("Entity too large")) {
    return createErrorResponse("PAYLOAD_TOO_LARGE", "Request payload exceeds limit", 413);
  }

  return createErrorResponse("INTERNAL_ERROR", message, 500);
}

export function createSuccessResponse<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}
