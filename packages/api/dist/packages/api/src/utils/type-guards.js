"use strict";
/**
 * Type assertion utilities for safe type guards and validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertDefined = assertDefined;
exports.isDefined = isDefined;
exports.getString = getString;
exports.getRouteParam = getRouteParam;
exports.safeErrorHandler = safeErrorHandler;
/**
 * Safely asserts that a value is not undefined
 */
function assertDefined(value, errorMessage) {
    if (value === undefined) {
        throw new Error(errorMessage || `Expected value to be defined, but received undefined`);
    }
}
/**
 * Type guard to check if a value is defined
 */
function isDefined(value) {
    return value !== undefined;
}
/**
 * Safely extract string from optional string value
 */
function getString(value) {
    if (value === undefined) {
        throw new Error("Expected string but received undefined");
    }
    return value;
}
/**
 * Type guard for Next.js route parameters
 */
function getRouteParam(param, paramName) {
    if (param === undefined) {
        throw new Error(`Route parameter "${paramName}" is required but not provided`);
    }
    return param;
}
/**
 * Safe error handler that ensures error variable is defined
 */
function safeErrorHandler(errorHandler) {
    return (error) => {
        if (error instanceof Error) {
            errorHandler(error);
        }
        else {
            errorHandler(new Error(String(error)));
        }
    };
}
//# sourceMappingURL=type-guards.js.map