/**
 * Shared structured-log redaction for Edge and Node loggers.
 * Redacts sensitive map keys, nested objects under those keys, and common secret-shaped strings.
 */

export const REDACTED = "[REDACTED]";

const SENSITIVE_KEY_PATTERN =
  /(secret|token|password|authorization|cookie|credential|apikey|api_key|set-cookie|bearer)/i;

const MAX_DEPTH = 10;

/** Heuristic: JWT (three base64url segments). */
function looksLikeJwt(value: string): boolean {
  const parts = value.split(".");
  return (
    parts.length >= 3 &&
    parts.every((p) => p.length > 0 && /^[A-Za-z0-9_-]+$/.test(p)) &&
    value.length > 40
  );
}

function redactString(value: string): string {
  const t = value.trim();
  if (t.length === 0) return value;
  if (looksLikeJwt(t)) return REDACTED;
  if (/^rk_[A-Za-z0-9_-]+$/.test(t)) return REDACTED;
  if (/^sk_[A-Za-z0-9_-]+$/.test(t)) return REDACTED;
  if (/^gh[ps]_[A-Za-z0-9]+$/.test(t)) return REDACTED;
  if (/^xox[baprs]-[A-Za-z0-9-]+$/.test(t)) return REDACTED;
  if (/^-----BEGIN [A-Z ]+PRIVATE KEY-----/.test(t)) return REDACTED;
  return value;
}

/**
 * Deep-redact values intended for JSON log context objects.
 */
export function redactStructuredLogValue(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) {
    return REDACTED;
  }
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === "string") {
    return redactString(value);
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactStructuredLogValue(item, depth + 1));
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>(
      (acc, [key, nested]) => {
        acc[key] = SENSITIVE_KEY_PATTERN.test(key)
          ? REDACTED
          : redactStructuredLogValue(nested, depth + 1);
        return acc;
      },
      {}
    );
  }
  return value;
}
