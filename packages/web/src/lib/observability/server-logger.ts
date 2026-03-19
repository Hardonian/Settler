import "server-only";

type LogLevel = "info" | "warn" | "error";

const REDACTED = "[REDACTED]";
const SECRET_KEY_PATTERN = /(secret|token|password|key|authorization|cookie)/i;

function redactValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(redactValue);
  }

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

function writeLog(level: LogLevel, message: string, context: Record<string, unknown> = {}): void {
  const sanitizedContext = redactValue(context) as Record<string, unknown>;
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

  process.stdout.write(`${payload}\n`);
}

export const serverLogger = {
  info: (message: string, context?: Record<string, unknown>) => writeLog("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => writeLog("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) =>
    writeLog("error", message, context),
};
