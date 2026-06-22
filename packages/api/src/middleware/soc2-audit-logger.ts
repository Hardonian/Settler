import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";

/**
 * SOC 2 Audit Logger Middleware
 * Satisfies SOC 2 CC7.2 System Monitoring
 *
 * Intercepts all state-changing HTTP methods (POST, PUT, PATCH, DELETE)
 * and logs them immutably to the system audit trail (STDOUT for SIEM ingestion).
 */
export function soc2AuditLogger() {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Only intercept state-changing requests
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      return next();
    }

    // Capture the request timestamp
    const requestTime = new Date().toISOString();

    // We hook into the 'finish' event to ensure we know the final status code of the mutation
    res.on("finish", () => {
      const clientIp =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
        req.ip ||
        req.socket.remoteAddress ||
        "UNKNOWN";

      const auditEvent = {
        _soc2_audit: true,
        timestamp: requestTime,
        traceId: req.traceId || "UNKNOWN",
        tenantId: req.tenantId || "SYSTEM",
        userId: req.user?.id || "ANONYMOUS",
        method: req.method,
        path: req.originalUrl || req.path,
        ipAddress: clientIp,
        statusCode: res.statusCode,
        action: `HTTP_${req.method}_${(req.route?.path || req.path).replace(/\//g, "_").toUpperCase()}`,
        // Note: Do not log raw req.body to avoid accidental PII exposure in logs
      };

      // In production, this output is ingested by Datadog / Splunk / SIEM directly.
      // We log it as a structured JSON object.
      console.log(JSON.stringify(auditEvent));

      // In a more robust system, we would also write this async to a 'system_audit_log' DB table.
    });

    next();
  };
}
