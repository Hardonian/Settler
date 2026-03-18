import { AuditEvent, AuditLogEntry } from '@settler/protocol';
/**
 * Set audit log handler
 */
export declare function setAuditLogHandler(handler: (entry: AuditLogEntry) => void): void;
/**
 * useSecurity Hook
 */
export declare function useSecurity(): {
    securityContext: any;
    auditLog: (event: AuditEvent, action: string, result: "success" | "failure" | "warning", metadata?: Record<string, unknown>) => void;
    hasPermission: (permission: string) => boolean;
    hasRole: (role: string) => boolean;
};
//# sourceMappingURL=useSecurity.d.ts.map