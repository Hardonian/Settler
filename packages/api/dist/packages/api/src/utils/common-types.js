"use strict";
/**
 * Common Type Utilities
 * Provides reusable type utilities for the codebase
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNotNull = isNotNull;
exports.isString = isString;
exports.isNumber = isNumber;
exports.isPlainObject = isPlainObject;
exports.safeJsonParse = safeJsonParse;
/**
 * Type guard for checking if value is not null/undefined
 */
function isNotNull(value) {
    return value !== null && value !== undefined;
}
/**
 * Type guard for checking if value is a string
 */
function isString(value) {
    return typeof value === 'string';
}
/**
 * Type guard for checking if value is a number
 */
function isNumber(value) {
    return typeof value === 'number' && !isNaN(value);
}
/**
 * Type guard for checking if value is a plain object
 */
function isPlainObject(value) {
    return (typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        Object.prototype.toString.call(value) === '[object Object]');
}
/**
 * Safe JSON parse with type guard
 */
function safeJsonParse(json) {
    try {
        const parsed = JSON.parse(json);
        return { success: true, data: parsed };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }
}
//# sourceMappingURL=common-types.js.map