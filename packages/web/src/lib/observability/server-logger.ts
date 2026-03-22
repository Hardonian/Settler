import "server-only";

import { redactStructuredLogValue } from "./log-redaction";

type LogLevel = "info" | "warn" | "error";

function writeLog(level: LogLevel, message: string, context: Record<string, unknown> = {}): void {
  const sanitizedContext = redactStructuredLogValue(context) as Record<string, unknown>;
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...sanitizedContext,
  };

  const payload = JSON.stringify(entry);
  if (level === "error") {
    console.error(payload);
    return;
  }

  if (level === "warn") {
    console.warn(payload);
    return;
  }

  // console.log preserves structured JSON and is available on all runtimes.
  // process.stdout.write is Node-only and is not safe here.
  console.log(payload);
}

export const serverLogger = {
  info: (message: string, context?: Record<string, unknown>) => writeLog("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => writeLog("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) =>
    writeLog("error", message, context),
};
