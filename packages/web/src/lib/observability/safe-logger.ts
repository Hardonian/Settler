/**
 * Safe Logger Wrapper
 *
 * CRITICAL: All logging must go through this module.
 * - Never use console.* directly
 * - Always includes trace_id, user_id, tenant_id when available
 * - Gracefully handles logging failures (never throws)
 * - No deprecated warnings
 */

import { logger } from "./logger";
import { getTraceId } from "./trace";

/**
 * Safe log wrapper that never throws
 */
async function safeLog(
  level: "info" | "warn" | "error" | "debug",
  message: string,
  meta?: Record<string, unknown>
): Promise<void> {
  try {
    const traceId = await getTraceId();
    const enrichedMeta = {
      ...meta,
      trace_id: traceId,
      timestamp: new Date().toISOString(),
    };

    switch (level) {
      case "info":
        await logger.info(message, enrichedMeta);
        break;
      case "warn":
        await logger.warn(message, enrichedMeta);
        break;
      case "error":
        await logger.error(message, enrichedMeta);
        break;
      case "debug":
        await logger.debug(message, enrichedMeta);
        break;
    }
  } catch {
    // Logging failure should never crash the app
    // Silently fail - logging is non-critical
  }
}

/**
 * Safe logger that replaces console.* calls
 * Never throws, always succeeds (or fails silently)
 */
export const safeLogger = {
  info: (message: string, meta?: Record<string, unknown>) => safeLog("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => safeLog("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => safeLog("error", message, meta),
  debug: (message: string, meta?: Record<string, unknown>) => safeLog("debug", message, meta),
};
