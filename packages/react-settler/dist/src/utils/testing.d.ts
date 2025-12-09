/**
 * Testing Utilities
 * Helpers for testing reconciliation components
 */
import React from 'react';
import { ReconciliationTransaction, ReconciliationSettlement, ReconciliationException, ReconciliationConfig } from '@settler/protocol';
/**
 * Create mock transaction
 */
export declare function createMockTransaction(overrides?: Partial<ReconciliationTransaction>): ReconciliationTransaction;
/**
 * Create mock settlement
 */
export declare function createMockSettlement(overrides?: Partial<ReconciliationSettlement>): ReconciliationSettlement;
/**
 * Create mock exception
 */
export declare function createMockException(overrides?: Partial<ReconciliationException>): ReconciliationException;
/**
 * Create array of mock transactions
 */
export declare function createMockTransactions(count: number): ReconciliationTransaction[];
/**
 * Test wrapper component
 */
export interface TestWrapperProps {
    children: React.ReactNode;
    mode?: 'ui' | 'config';
    config?: Partial<ReconciliationConfig>;
}
export declare function TestWrapper({ children, mode, config }: TestWrapperProps): import("react/jsx-runtime").JSX.Element;
/**
 * Wait for async updates
 */
export declare function waitFor(ms: number): Promise<void>;
/**
 * Mock telemetry provider
 */
export declare function createMockTelemetryProvider(): {
    track: (event: any) => void;
    trackError: (error: any) => void;
    trackPerformance: () => void;
    flush: () => Promise<void>;
    setUser: () => void;
    setContext: () => void;
    getEvents: () => any[];
    getErrors: () => any[];
    clear: () => void;
};
//# sourceMappingURL=testing.d.ts.map