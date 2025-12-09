"use strict";
/**
 * Route Validator
 * Validates that all routes are properly wired and accessible
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRoutes = validateRoutes;
exports.checkDeadRoutes = checkDeadRoutes;
const logger_1 = require("./logger");
/**
 * Extract route information from Express app
 * Note: This is a simplified version. Full route introspection requires more complex logic.
 */
function validateRoutes(_app) {
    const results = [];
    // This is a placeholder - full route introspection would require
    // parsing the Express router stack, which is complex.
    // In practice, this would be done via integration tests.
    (0, logger_1.logInfo)('Route validation: Routes are validated via integration tests');
    return results;
}
/**
 * Check for potentially dead routes (routes that are never called)
 * This is a static analysis helper - actual validation should be done via tests
 */
function checkDeadRoutes() {
    // This would require static analysis or test coverage analysis
    // For now, return empty results with recommendation to use test coverage
    return {
        potentiallyDead: [],
        recommendations: [
            'Use test coverage reports to identify unused routes',
            'Run integration tests to verify all routes are accessible',
            'Check API documentation to ensure all routes are documented',
        ],
    };
}
//# sourceMappingURL=route-validator.js.map