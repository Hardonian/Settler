/**
 * Server Action Response Types
 * 
 * CTO Mode: Code Standards
 * - All Server Actions must return this format
 * - Never throw raw errors to the client
 */

export type ActionResult<T = unknown> = 
  | { success: true; message?: string; data: T }
  | { success: false; message: string; error?: string; data?: T };

/**
 * Helper to create success result
 */
export function success<T>(data: T, message?: string): ActionResult<T> {
  if (message) {
    return { success: true, data, message };
  }
  return { success: true, data };
}

/**
 * Helper to create error result
 */
export function error(message: string, error?: string, data?: unknown): ActionResult {
  const result: ActionResult = { success: false, message };
  if (error) {
    result.error = error;
  }
  if (data !== undefined) {
    result.data = data;
  }
  return result;
}

/**
 * Wrap async function with error handling
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  errorMessage = 'An error occurred'
): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return success(data);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return error(errorMessage, errorMsg) as ActionResult<T>;
  }
}
