/**
 * Edge-Compatible Logger
 *
 * Runtime-safe logging for Next.js middleware and Edge Runtime handlers.
 * Uses only Web-standard APIs (console.*) — no Node-only APIs.
 *
 * Key constraints:
 *  - No `process.stdout.write` (Node-only)
 *  - No `import "server-only"` (blocks Edge Runtime)
 *  - No async dependencies
 *  - Structured JSON output, matching server-logger shape
 */

type LogLevel = "info" | "warn" | "error";

const REDACTED = "[REDACTED]";
const SECRET_KEY_PATTERN = /(secret|token|password|key|authorization|cookie)/i;

function redactValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(redactValue);
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>(
      (acc, [key, nested]) => {
        acc[key] = SECRET_KEY_PATTERN.test(key) ? REDACTED : redactValue(nested);
        return acc;
      },
      {}
    );
  }
  return value;
}

function writeEdgeLog(
  level: LogLevel,
  message: string,
  context: Record<string, unknown> = {}
): void {
  const sanitizedContext = redactValue(context) as Record<string, unknown>;
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...sanitizedContext,
  };
  const payload = JSON.stringify(entry);
  // Use console methods only — compatible with Edge Runtime and Node.js.
  switch (level) {
    case "error":
      console.error(payload);
      break;
    case "warn":
      console.warn(payload);
      break;
    default:
      // console.info is allowed on all runtimes including Edge
      console.info(payload);
      break;
  }
}

export const edgeLogger = {
  info: (message: string, context?: Record<string, unknown>) =>
    writeEdgeLog("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) =>
    writeEdgeLog("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) =>
    writeEdgeLog("error", message, context),
};
