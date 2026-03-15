/**
 * Escape user-controlled input for safe usage in RegExp patterns.
 */
export function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
