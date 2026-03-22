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

import { redactStructuredLogValue } from "./log-redaction";

type LogLevel = "info" | "warn" | "error";

function writeEdgeLog(
  level: LogLevel,
  message: string,
  context: Record<string, unknown> = {}
): void {
  const sanitizedContext = redactStructuredLogValue(context) as Record<string, unknown>;
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
      // console.log is available on all runtimes including Edge
      console.log(payload);
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
