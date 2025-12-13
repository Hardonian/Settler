/**
 * API Versioning Utilities
 * 
 * Provides utilities for API versioning and deprecation handling.
 */

export type ApiVersion = 'v1' | 'v2';

export interface VersionInfo {
  version: ApiVersion;
  status: 'active' | 'deprecated' | 'sunset';
  deprecationDate?: string;
  sunsetDate?: string;
  migrationGuide?: string;
}

/**
 * API version registry
 */
export const API_VERSIONS: Record<ApiVersion, VersionInfo> = {
  v1: {
    version: 'v1',
    status: 'active',
  },
  v2: {
    version: 'v2',
    status: 'active',
  },
};

/**
 * Get version info from request path
 */
export function getVersionFromPath(path: string): ApiVersion | null {
  const match = path.match(/^\/api\/(v\d+)\//);
  if (match) {
    const version = match[1] as ApiVersion;
    return API_VERSIONS[version] ? version : null;
  }
  return null;
}

/**
 * Check if version is deprecated
 */
export function isVersionDeprecated(version: ApiVersion): boolean {
  const info = API_VERSIONS[version];
  return info.status === 'deprecated' || info.status === 'sunset';
}

/**
 * Add version headers to response
 */
export function addVersionHeaders(
  version: ApiVersion | null,
  response: Response
): Response {
  if (version) {
    const info = API_VERSIONS[version];
    response.headers.set('API-Version', version);
    response.headers.set('API-Status', info.status);

    if (info.status === 'deprecated' && info.deprecationDate) {
      response.headers.set('Sunset', info.deprecationDate);
    }

    if (info.migrationGuide) {
      response.headers.set('Link', `<${info.migrationGuide}>; rel="deprecation"`);
    }
  }

  return response;
}
