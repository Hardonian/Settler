"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockTransaction = createMockTransaction;
exports.createMockSettlement = createMockSettlement;
exports.createMockException = createMockException;
exports.createMockTransactions = createMockTransactions;
exports.TestWrapper = TestWrapper;
exports.waitFor = waitFor;
exports.createMockTelemetryProvider = createMockTelemetryProvider;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Create mock transaction
 */
function createMockTransaction(overrides) {
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
function createMockSettlement(overrides) {
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
function createMockException(overrides) {
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
function createMockTransactions(count) {
    return Array.from({ length: count }, (_, i) => createMockTransaction({
        id: `tx_${i}`,
        amount: { value: (i + 1) * 10, currency: "USD" },
    }));
}
function TestWrapper({ children, mode = "ui", config = {} }) {
    const { CompilationProvider } = require("../context");
    return ((0, jsx_runtime_1.jsx)(CompilationProvider, { mode: mode, config: config, children: children }));
}
/**
 * Wait for async updates
 */
function waitFor(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Mock telemetry provider
 */
function createMockTelemetryProvider() {
    const events = [];
    const errors = [];
    return {
        track: (event) => {
            events.push(event);
        },
        trackError: (error) => {
            errors.push(error);
        },
        trackPerformance: () => { },
        flush: async () => { },
        setUser: () => { },
        setContext: () => { },
        getEvents: () => events,
        getErrors: () => errors,
        clear: () => {
            events.length = 0;
            errors.length = 0;
        },
    };
}
//# sourceMappingURL=testing.js.map