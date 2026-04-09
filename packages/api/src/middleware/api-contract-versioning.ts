/**
 * API Contract Versioning
 *
 * Ensures stable API contracts that create breaking change risk for competitors.
 * Versioned APIs create switching friction when competitors try to clone Settler.
 *
 * PHASE: Workflow Lock-In Reinforcement
 */

import { Request, Response, NextFunction } from "express";
import { logError, logInfo } from "../utils/logger";

export interface APIVersion {
  version: string; // e.g., "v1", "v2"
  deprecated: boolean;
  deprecatedAt?: Date;
  sunsetAt?: Date; // When version will be removed
  breakingChanges: string[]; // List of breaking changes
}

const API_VERSIONS: Record<string, APIVersion> = {
  v1: {
    version: "v1",
    deprecated: false,
    breakingChanges: [],
  },
  v2: {
    version: "v2",
    deprecated: false,
    breakingChanges: [],
  },
};

/**
 * API Contract Versioning Middleware
 *
 * Enforces API versioning and tracks usage for breaking change analysis
 */
export function apiContractVersioningMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Extract version from path or header
    const pathVersion = extractVersionFromPath(req.path);
    const headerVersion = req.headers["api-version"] as string | undefined;

    const requestedVersion = pathVersion || headerVersion || "v1";

    // Check if version exists
    const version = API_VERSIONS[requestedVersion];
    if (!version) {
      res.status(400).json({
        error: "Invalid API version",
        requestedVersion,
        availableVersions: Object.keys(API_VERSIONS),
      });
      return;
    }

    // Check if version is deprecated
    if (version.deprecated) {
      res.setHeader("X-API-Deprecated", "true");
      if (version.deprecatedAt) {
        res.setHeader("X-API-Deprecated-At", version.deprecatedAt.toISOString());
      }
      if (version.sunsetAt) {
        res.setHeader("X-API-Sunset-At", version.sunsetAt.toISOString());
      }
    }

    // Check if version is sunset
    if (version.sunsetAt && new Date() > version.sunsetAt) {
      res.status(410).json({
        error: "API version has been sunset",
        version: requestedVersion,
        sunsetAt: version.sunsetAt.toISOString(),
        migrationGuide: `/docs/api/migration/${requestedVersion}`,
      });
      return;
    }

    // Store version in request
    (req as any).apiVersion = requestedVersion;
    (req as any).apiVersionInfo = version;

    // Log API version usage for breaking change analysis
    logInfo("API version used", {
      version: requestedVersion,
      path: req.path,
      method: req.method,
      tenantId: (req as any).tenantId,
    });

    next();
  } catch (error) {
    logError("API versioning middleware failed", error);
    // Fail open - allow request if versioning check fails
    next();
  }
}

/**
 * Extract version from path
 */
function extractVersionFromPath(path: string): string | null {
  const match = path.match(/^\/api\/(v\d+)\//);
  return match && match[1] ? match[1] : null;
}

/**
 * Get API version info
 */
export function getAPIVersion(version: string): APIVersion | null {
  return API_VERSIONS[version] || null;
}

/**
 * Mark API version as deprecated
 */
export function deprecateAPIVersion(version: string, sunsetAt?: Date): void {
  const apiVersion = API_VERSIONS[version];
  if (apiVersion) {
    apiVersion.deprecated = true;
    apiVersion.deprecatedAt = new Date();
    if (sunsetAt) {
      apiVersion.sunsetAt = sunsetAt;
    }
  }
}

/**
 * Add breaking change to version
 */
export function addBreakingChange(version: string, change: string): void {
  const apiVersion = API_VERSIONS[version];
  if (apiVersion) {
    apiVersion.breakingChanges.push(change);
  }
}

/**
 * Get all API versions
 */
export function getAllAPIVersions(): Record<string, APIVersion> {
  return { ...API_VERSIONS };
}
