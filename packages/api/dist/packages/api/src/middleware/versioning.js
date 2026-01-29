"use strict";
/**
 * API Versioning Middleware
 * Handles version routing and deprecation headers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.versionMiddleware = versionMiddleware;
exports.deprecateEndpoint = deprecateEndpoint;
/**
 * Extract API version from URL or header
 */
function versionMiddleware(req, res, next) {
    // Extract version from URL path (/api/v1/...)
    const pathMatch = req.path.match(/^\/api\/v(\d+)/);
    if (pathMatch) {
        req.apiVersion = `v${pathMatch[1]}`;
    }
    else {
        // Check version header
        const versionHeader = req.get('Settler-Version') || req.get('API-Version');
        if (versionHeader) {
            req.apiVersion = versionHeader.startsWith('v') ? versionHeader : `v${versionHeader}`;
        }
        else {
            // Default to v1
            req.apiVersion = 'v1';
        }
    }
    // Set version in response headers
    res.setHeader('Settler-Version', req.apiVersion);
    res.setHeader('API-Version', req.apiVersion);
    // Add deprecation headers if needed
    if (req.apiVersion === 'v1') {
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
function deprecateEndpoint(sunsetDate, migrationGuideUrl) {
    return (_req, res, next) => {
        res.setHeader('Deprecation', 'true');
        res.setHeader('Sunset', sunsetDate);
        if (migrationGuideUrl) {
            res.setHeader('Link', `<${migrationGuideUrl}>; rel="deprecation"`);
        }
        next();
    };
}
//# sourceMappingURL=versioning.js.map