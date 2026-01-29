/**
 * Type-safe parameter extraction helpers for API routes
 */

/**
 * Safely extract a string parameter from URL search params
 */
export function getStringParam(
  searchParams: URLSearchParams,
  key: string,
  defaultValue: string = ""
): string {
  const param = searchParams.get(key);
  return param ?? defaultValue;
}

/**
 * Safely extract and parse a numeric parameter
 */
export function getIntParam(
  searchParams: URLSearchParams,
  key: string,
  defaultValue: number = 0,
  min?: number,
  max?: number
): number {
  const param = searchParams.get(key);
  if (param === null || param === undefined) {
    return defaultValue;
  }

  const parsed = parseInt(param, 10);
  if (isNaN(parsed)) {
    return defaultValue;
  }

  if (min !== undefined && parsed < min) {
    return defaultValue;
  }

  if (max !== undefined && parsed > max) {
    return defaultValue;
  }

  return parsed;
}

/**
 * Type guard for auth objects
 */
export function isValidAuth(
  auth: any
): auth is { tenantId?: string | null; userId?: string | null } {
  return (
    auth &&
    typeof auth === "object" &&
    (auth.tenantId === undefined || typeof auth.tenantId === "string") &&
    (auth.userId === undefined || typeof auth.userId === "string")
  );
}
