/**
 * Safe JSON parsing for user-controlled input (no throw → caller handles degraded UX).
 */
export function tryParseJson(
  value: string
): { ok: true; data: unknown } | { ok: false; error: string } {
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: true, data: undefined };
  }
  try {
    return { ok: true, data: JSON.parse(trimmed) };
  } catch (e) {
    const message = e instanceof SyntaxError ? e.message : "Invalid JSON";
    return { ok: false, error: message };
  }
}
