/**
 * useSecurity Hook
 * Security context and audit logging
 * 
 * ⚠️ Commercial Feature: Advanced security features require Settler Commercial subscription
 */
import { FEATURE_FLAGS, hasFeature } from '../utils/licensing';

import { useCallback } from 'react';
import {
  AuditEvent,
  AuditLogEntry
} from '@settler/protocol';
import { useCompilationContext } from '../context';

let auditLogHandler: ((entry: AuditLogEntry) => void) | null = null;

/**
 * Set audit log handler
 */
export function setAuditLogHandler(handler: (entry: AuditLogEntry) => void): void {
  auditLogHandler = handler;
}

/**
 * useSecurity Hook
 */
export function useSecurity() {
  const context = useCompilationContext();
  const securityContext = context.securityContext;

  const auditLog = useCallback((event: AuditEvent, action: string, result: 'success' | 'failure' | 'warning', metadata?: Record<string, unknown>) => {
    // Audit logging is a commercial feature
    if (!hasFeature(FEATURE_FLAGS.AUDIT_LOGGING)) {
      console.warn('Audit logging requires Settler Commercial subscription');
      return;
    }
    
    if (!auditLogHandler) {
      return;
    }

    const entry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      event,
      ...(securityContext?.userId ? { userId: securityContext.userId } : {}),
      ...(securityContext?.sessionId ? { sessionId: securityContext.sessionId } : {}),
      ...(securityContext?.ipAddress ? { ipAddress: securityContext.ipAddress } : {}),
      ...(securityContext?.userAgent ? { userAgent: securityContext.userAgent } : {}),
      action,
      result,
      ...(metadata ? { metadata } : {})
    };

    auditLogHandler(entry);
  }, [securityContext]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!securityContext?.permissions) {
      return false;
    }
    return securityContext.permissions.includes(permission);
  }, [securityContext]);

  const hasRole = useCallback((role: string): boolean => {
    if (!securityContext?.roles) {
      return false;
    }
    return securityContext.roles.includes(role);
  }, [securityContext]);

  return {
    securityContext,
    auditLog,
    hasPermission,
    hasRole
  };
}
