"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAuditLogHandler = setAuditLogHandler;
exports.useSecurity = useSecurity;
/**
 * useSecurity Hook
 * Security context and audit logging
 *
 * ⚠️ Commercial Feature: Advanced security features require Settler Commercial subscription
 */
const licensing_1 = require("../utils/licensing");
const react_1 = require("react");
const context_1 = require("../context");
let auditLogHandler = null;
/**
 * Set audit log handler
 */
function setAuditLogHandler(handler) {
    auditLogHandler = handler;
}
/**
 * useSecurity Hook
 */
function useSecurity() {
    const context = (0, context_1.useCompilationContext)();
    const securityContext = context.securityContext;
    const auditLog = (0, react_1.useCallback)((event, action, result, metadata) => {
        // Audit logging is a commercial feature
        if (!(0, licensing_1.hasFeature)(licensing_1.FEATURE_FLAGS.AUDIT_LOGGING)) {
            console.warn("Audit logging requires Settler Commercial subscription");
            return;
        }
        if (!auditLogHandler) {
            return;
        }
        const entry = {
            id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            event,
            ...(securityContext?.userId ? { userId: securityContext.userId } : {}),
            ...(securityContext?.sessionId ? { sessionId: securityContext.sessionId } : {}),
            ...(securityContext?.ipAddress ? { ipAddress: securityContext.ipAddress } : {}),
            ...(securityContext?.userAgent ? { userAgent: securityContext.userAgent } : {}),
            action,
            result,
            ...(metadata ? { metadata } : {}),
        };
        auditLogHandler(entry);
    }, [securityContext]);
    const hasPermission = (0, react_1.useCallback)((permission) => {
        if (!securityContext?.permissions) {
            return false;
        }
        return securityContext.permissions.includes(permission);
    }, [securityContext]);
    const hasRole = (0, react_1.useCallback)((role) => {
        if (!securityContext?.roles) {
            return false;
        }
        return securityContext.roles.includes(role);
    }, [securityContext]);
    return {
        securityContext,
        auditLog,
        hasPermission,
        hasRole,
    };
}
//# sourceMappingURL=useSecurity.js.map