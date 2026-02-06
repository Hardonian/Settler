"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeHtml = sanitizeHtml;
exports.sanitizeReportData = sanitizeReportData;
// Simple XSS sanitization for report data
function sanitizeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;")
        .replace(/\//g, "&#x2F;");
}
/**
 * Recursively sanitize report data to prevent XSS attacks
 *
 * @param data - Data to sanitize (string, array, object, or primitive)
 * @returns Sanitized data with HTML entities escaped
 */
function sanitizeReportData(data) {
    if (typeof data === "string") {
        return sanitizeHtml(data);
    }
    if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i += 1) {
            data[i] = sanitizeReportData(data[i]);
        }
        return data;
    }
    if (data && typeof data === "object") {
        const target = data;
        for (const [key, value] of Object.entries(target)) {
            target[key] = sanitizeReportData(value);
        }
        return target;
    }
    return data;
}
//# sourceMappingURL=xss-sanitize.js.map