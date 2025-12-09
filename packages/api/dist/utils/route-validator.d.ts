/**
 * Route Validator
 * Validates that all routes are properly wired and accessible
 */
import { Express } from 'express';
export interface RouteInfo {
    method: string;
    path: string;
    middleware: string[];
    handler: string;
}
export interface RouteValidationResult {
    route: RouteInfo;
    status: 'ok' | 'warning' | 'error';
    message: string;
}
/**
 * Extract route information from Express app
 * Note: This is a simplified version. Full route introspection requires more complex logic.
 */
export declare function validateRoutes(_app: Express): RouteValidationResult[];
/**
 * Check for potentially dead routes (routes that are never called)
 * This is a static analysis helper - actual validation should be done via tests
 */
export declare function checkDeadRoutes(): {
    potentiallyDead: string[];
    recommendations: string[];
};
//# sourceMappingURL=route-validator.d.ts.map