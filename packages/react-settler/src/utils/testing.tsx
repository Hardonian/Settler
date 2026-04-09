/**
 * Testing Utilities
 * Helpers for testing reconciliation components
 */

import React from "react";
import {
  ReconciliationTransaction,
  ReconciliationSettlement,
  ReconciliationException,
  ReconciliationConfig,
} from "@settler/protocol";

/**
 * Create mock transaction
 */
export function createMockTransaction(
  overrides?: Partial<ReconciliationTransaction>
): ReconciliationTransaction {
  return {
    id: `tx_${Math.random().toString(36).substr(2, 9)}`,
    provider: "stripe",
    providerTransactionId: `ch_${Math.random().toString(36).substr(2, 9)}`,
    amount: { value: 100.0, currency: "USD" },
    currency: "USD",
    date: new Date().toISOString(),
    status: "succeeded",
    ...overrides,
  };
}

/**
 * Create mock settlement
 */
export function createMockSettlement(
  overrides?: Partial<ReconciliationSettlement>
): ReconciliationSettlement {
  return {
    id: `st_${Math.random().toString(36).substr(2, 9)}`,
    provider: "stripe",
    providerSettlementId: `set_${Math.random().toString(36).substr(2, 9)}`,
    amount: { value: 100.0, currency: "USD" },
    currency: "USD",
    settlementDate: new Date().toISOString(),
    status: "completed",
    ...overrides,
  };
}

/**
 * Create mock exception
 */
export function createMockException(
  overrides?: Partial<ReconciliationException>
): ReconciliationException {
  return {
    id: `exc_${Math.random().toString(36).substr(2, 9)}`,
    category: "amount_mismatch",
    severity: "high",
    description: "Transaction amount does not match settlement",
    resolutionStatus: "open",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create array of mock transactions
 */
export function createMockTransactions(count: number): ReconciliationTransaction[] {
  return Array.from({ length: count }, (_, i) =>
    createMockTransaction({
      id: `tx_${i}`,
      amount: { value: (i + 1) * 10, currency: "USD" },
    })
  );
}

/**
 * Test wrapper component
 */
export interface TestWrapperProps {
  children: React.ReactNode;
  mode?: "ui" | "config";
  config?: Partial<ReconciliationConfig>;
}

export function TestWrapper({ children, mode = "ui", config = {} }: TestWrapperProps) {
  const { CompilationProvider } = require("../context");
  return (
    <CompilationProvider mode={mode} config={config}>
      {children}
    </CompilationProvider>
  );
}

/**
 * Wait for async updates
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock telemetry provider
 */
export function createMockTelemetryProvider() {
  const events: any[] = [];
  const errors: any[] = [];

  return {
    track: (event: any) => {
      events.push(event);
    },
    trackError: (error: any) => {
      errors.push(error);
    },
    trackPerformance: () => {},
    flush: async () => {},
    setUser: () => {},
    setContext: () => {},
    getEvents: () => events,
    getErrors: () => errors,
    clear: () => {
      events.length = 0;
      errors.length = 0;
    },
  };
}
