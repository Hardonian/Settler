/**
 * API Versioning Strategy
 *
 * Handles API version negotiation and routing.
 */

import { NextRequest, NextResponse } from "next/server";

export type ApiVersion = "v1" | "v2";

const CURRENT_VERSION: ApiVersion = "v1";
const SUPPORTED_VERSIONS: ApiVersion[] = ["v1"];

/**
 * Extract API version from request
 */
export function extractApiVersion(request: NextRequest): ApiVersion | null {
  // Check URL path: /api/v1/... or /api/v2/...
  const pathMatch = request.nextUrl.pathname.match(/^\/api\/(v\d+)\//);
  if (pathMatch) {
    const version = pathMatch[1] as ApiVersion;
    if (SUPPORTED_VERSIONS.includes(version)) {
      return version;
    }
  }

  // Check Accept header: application/vnd.settler.v1+json
  const acceptHeader = request.headers.get("accept");
  if (acceptHeader) {
    const versionMatch = acceptHeader.match(/application\/vnd\.settler\.(v\d+)\+json/);
    if (versionMatch) {
      const version = versionMatch[1] as ApiVersion;
      if (SUPPORTED_VERSIONS.includes(version)) {
        return version;
      }
    }
  }

  // Check X-API-Version header
  const versionHeader = request.headers.get("x-api-version");
  if (versionHeader && SUPPORTED_VERSIONS.includes(versionHeader as ApiVersion)) {
    return versionHeader as ApiVersion;
  }

  return null;
}

/**
 * Get API version from request, defaulting to current version
 */
export function getApiVersion(request: NextRequest): ApiVersion {
  return extractApiVersion(request) || CURRENT_VERSION;
}

/**
 * Create versioned error response
 */
export function createVersionedErrorResponse(
  request: NextRequest,
  error: string,
  status: number = 400
): NextResponse {
  const version = getApiVersion(request);

  return NextResponse.json(
    {
      error,
      version,
      timestamp: new Date().toISOString(),
    },
    {
      status,
      headers: {
        "X-API-Version": version,
        "Content-Type": `application/vnd.settler.${version}+json`,
      },
    }
  );
}

/**
 * Create versioned success response
 */
export function createVersionedResponse<T>(
  request: NextRequest,
  data: T,
  status: number = 200
): NextResponse {
  const version = getApiVersion(request);

  return NextResponse.json(
    {
      data,
      version,
      timestamp: new Date().toISOString(),
    },
    {
      status,
      headers: {
        "X-API-Version": version,
        "Content-Type": `application/vnd.settler.${version}+json`,
      },
    }
  );
}

/**
 * Check if version is supported
 */
export function isVersionSupported(version: string): version is ApiVersion {
  return SUPPORTED_VERSIONS.includes(version as ApiVersion);
}

/**
 * Middleware to validate API version
 */
export function validateApiVersion(request: NextRequest): NextResponse | null {
  const version = extractApiVersion(request);

  if (version && !isVersionSupported(version)) {
    return createVersionedErrorResponse(
      request,
      `Unsupported API version: ${version}. Supported versions: ${SUPPORTED_VERSIONS.join(", ")}`,
      400
    );
  }

  return null;
}
