"use strict";
/**
 * API Contract Versioning
 *
 * Ensures stable API contracts that create breaking change risk for competitors.
 * Versioned APIs create switching friction when competitors try to clone Settler.
 *
 * PHASE: Workflow Lock-In Reinforcement
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiContractVersioningMiddleware = apiContractVersioningMiddleware;
exports.getAPIVersion = getAPIVersion;
exports.deprecateAPIVersion = deprecateAPIVersion;
exports.addBreakingChange = addBreakingChange;
exports.getAllAPIVersions = getAllAPIVersions;
const logger_1 = require("../utils/logger");
const API_VERSIONS = {
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
function apiContractVersioningMiddleware(req, res, next) {
    try {
        // Extract version from path or header
        const pathVersion = extractVersionFromPath(req.path);
        const headerVersion = req.headers["api-version"];
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
        req.apiVersion = requestedVersion;
        req.apiVersionInfo = version;
        // Log API version usage for breaking change analysis
        (0, logger_1.logInfo)("API version used", {
            version: requestedVersion,
            path: req.path,
            method: req.method,
            tenantId: req.tenantId,
        });
        next();
    }
    catch (error) {
        (0, logger_1.logError)("API versioning middleware failed", error);
        // Fail open - allow request if versioning check fails
        next();
    }
}
/**
 * Extract version from path
 */
function extractVersionFromPath(path) {
    const match = path.match(/^\/api\/(v\d+)\//);
    return match && match[1] ? match[1] : null;
}
/**
 * Get API version info
 */
function getAPIVersion(version) {
    return API_VERSIONS[version] || null;
}
/**
 * Mark API version as deprecated
 */
function deprecateAPIVersion(version, sunsetAt) {
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
function addBreakingChange(version, change) {
    const apiVersion = API_VERSIONS[version];
    if (apiVersion) {
        apiVersion.breakingChanges.push(change);
    }
}
/**
 * Get all API versions
 */
function getAllAPIVersions() {
    return { ...API_VERSIONS };
}
//# sourceMappingURL=api-contract-versioning.js.map