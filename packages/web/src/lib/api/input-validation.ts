/**
 * API Input Validation Utilities
 *
 * Validates and sanitizes inputs for all API routes.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sanitizeString, sanitizeSearchQuery } from "@/lib/admin/security/input-validation";

/**
 * Validate request body with Zod schema
 */
export async function validateBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  try {
    const body = await request.json();
    const validated = schema.parse(body);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        response: NextResponse.json(
          {
            error: "Validation Error",
            message: "Invalid request body",
            details: error.issues.map((e) => ({
              path: e.path.map(String).join("."),
              message: e.message,
            })),
          },
          { status: 400 }
        ),
      };
    }
    return {
      success: false,
      response: NextResponse.json(
        { error: "Invalid Request", message: "Malformed request body" },
        { status: 400 }
      ),
    };
  }
}

/**
 * Validate query parameters with Zod schema
 */
export function validateQuery<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; response: NextResponse } {
  try {
    const { searchParams } = new URL(request.url);
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = sanitizeString(value);
    });
    const validated = schema.parse(params);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        response: NextResponse.json(
          {
            error: "Validation Error",
            message: "Invalid query parameters",
            details: error.issues.map((e) => ({
              path: e.path.map(String).join("."),
              message: e.message,
            })),
          },
          { status: 400 }
        ),
      };
    }
    return {
      success: false,
      response: NextResponse.json(
        { error: "Invalid Request", message: "Invalid query parameters" },
        { status: 400 }
      ),
    };
  }
}

/**
 * Sanitize search query from request
 */
export function getSearchQuery(request: NextRequest): string {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || searchParams.get("search") || "";
  return sanitizeSearchQuery(query);
}
