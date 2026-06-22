import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import { query } from "../db";
import IPCIDR from "ip-cidr";

export interface IPAllowlistError extends Error {
  code: string;
  statusCode: number;
  ipAddress: string;
}

/**
 * Enterprise IP Allowlist Middleware
 * Satisfies SOC 2 CC6.1 Logical Access
 *
 * Verifies that the incoming request's IP address falls within the configured
 * CIDR blocks for the requested tenant. Rejects unauthorized networks.
 */
export async function enforceIpAllowlist(req: AuthRequest, res: Response, next: NextFunction) {
  // Pass through if there is no tenant scope (e.g. public routes)
  if (!req.tenantId) {
    return next();
  }

  // Get client IP address
  const clientIp =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.ip || req.socket.remoteAddress;

  // If IP can't be determined safely, reject to fail-closed
  if (!clientIp) {
    return res.status(403).json({
      error: "UNRESOLVABLE_CLIENT_IP",
      message: "Could not resolve client IP address for network security evaluation.",
      traceId: req.traceId,
    });
  }

  try {
    // In a real system, this would be heavily cached in Redis.
    // We query the IP allowlist config for the current tenant.
    const result = await query<{ cidr_block: string }>(
      `SELECT cidr_block FROM tenant_ip_allowlist WHERE tenant_id = $1`,
      [req.tenantId]
    );

    // If no allowlist is configured, default to open (or strictly closed depending on enterprise posture)
    // For Settler, we assume no configuration means unrestricted access, but if ANY row exists, it's restricted.
    if (result.length === 0) {
      return next();
    }

    // Check if the client IP falls into ANY of the configured CIDR blocks
    let isAllowed = false;
    for (const row of result) {
      const cidr = new IPCIDR(row.cidr_block);
      if (cidr.contains(clientIp)) {
        isAllowed = true;
        break;
      }
    }

    if (!isAllowed) {
      const error: IPAllowlistError = new Error(
        `Network Access Denied: The IP address ${clientIp} is not authorized for this tenant workspace.`
      ) as IPAllowlistError;
      error.code = "NETWORK_ACCESS_DENIED";
      error.statusCode = 403;
      error.ipAddress = clientIp;

      return res.status(403).json({
        error: "NETWORK_ACCESS_DENIED",
        message: error.message,
        ipAddress: clientIp,
        traceId: req.traceId,
      });
    }

    next();
  } catch (err) {
    console.error(`[IP Allowlist Error] Tenant: ${req.tenantId}`, err);
    // Fail-closed on database or CIDR parsing errors
    return res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
      message: "Failed to evaluate network security policies.",
      traceId: req.traceId,
    });
  }
}
