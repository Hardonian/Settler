/**
 * API Versioning Middleware
 * Handles version routing and deprecation headers
 */

import { Request, Response, NextFunction } from "express";

export interface VersionedRequest extends Request {
  apiVersion?: string;
}

/**
 * Extract API version from URL or header
 */
export function versionMiddleware(req: VersionedRequest, res: Response, next: NextFunction): void {
  // Extract version from URL path (/api/v1/...)
  const pathMatch = req.path.match(/^\/api\/v(\d+)/);
  if (pathMatch) {
    req.apiVersion = `v${pathMatch[1]}`;
  } else {
    // Check version header
    const versionHeader = req.get("Settler-Version") || req.get("API-Version");
    if (versionHeader) {
      req.apiVersion = versionHeader.startsWith("v") ? versionHeader : `v${versionHeader}`;
    } else {
      // Default to v1
      req.apiVersion = "v1";
    }
  }

  // Set version in response headers
  res.setHeader("Settler-Version", req.apiVersion);
  res.setHeader("API-Version", req.apiVersion);

  // Add deprecation headers if needed
  if (req.apiVersion === "v1") {
    // v1 is current, no deprecation yet
    // When v2 is ready, add:
    // res.setHeader('Deprecation', 'true');
    // res.setHeader('Sunset', '2026-12-31T00:00:00Z');
    // res.setHeader('Link', '</docs/migrations/v1-to-v2>; rel="deprecation"');
  }

  next();
}

/**
 * Add deprecation headers for deprecated endpoints
 */
export function deprecateEndpoint(sunsetDate: string, migrationGuideUrl?: string) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    res.setHeader("Deprecation", "true");
    res.setHeader("Sunset", sunsetDate);

    if (migrationGuideUrl) {
      res.setHeader("Link", `<${migrationGuideUrl}>; rel="deprecation"`);
    }

    next();
  };
}
