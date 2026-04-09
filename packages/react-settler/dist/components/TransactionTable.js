"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionTable = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * TransactionTable
 * Displays reconciliation transactions in a table format
 */
const react_1 = __importStar(require("react"));
const context_1 = require("../context");
const useTelemetry_1 = require("../hooks/useTelemetry");
const protocol_1 = require("@settler/protocol");
exports.TransactionTable = react_1.default.memo(function TransactionTable({ transactions, onSelect, className, showProvider = true, showStatus = true, }) {
    const context = (0, context_1.useCompilationContext)();
    const { track } = (0, useTelemetry_1.useTelemetry)("TransactionTable");
    // Memoize sanitized transactions
    const sanitizedTransactions = (0, react_1.useMemo)(() => {
        return transactions.map((tx) => ({
            ...tx,
            id: (0, protocol_1.sanitizeString)(tx.id),
            provider: (0, protocol_1.sanitizeString)(tx.provider),
            providerTransactionId: (0, protocol_1.sanitizeString)(tx.providerTransactionId),
            ...(tx.referenceId ? { referenceId: (0, protocol_1.sanitizeString)(tx.referenceId) } : {}),
        }));
    }, [transactions]);
    // In config mode, register widget
    if (context.mode === "config") {
        if (!context.config.widgets) {
            context.config.widgets = {};
        }
        context.config.widgets["transaction-table"] = {
            id: "transaction-table",
            type: "transaction-table",
            props: {
                showProvider,
                showStatus,
            },
        };
    }
    // In UI mode, render table
    if (context.mode === "ui") {
        return ((0, jsx_runtime_1.jsxs)("div", { className: className, "data-widget": "transaction-table", children: [(0, jsx_runtime_1.jsx)("div", { style: { overflowX: "auto", WebkitOverflowScrolling: "touch" }, children: (0, jsx_runtime_1.jsxs)("table", { role: "table", "aria-label": "Reconciliation transactions", style: { width: "100%", borderCollapse: "collapse" }, children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { scope: "col", style: {
                                                padding: "0.75rem",
                                                textAlign: "left",
                                                fontWeight: 600,
                                                borderBottom: "2px solid #e5e7eb",
                                                backgroundColor: "#f9fafb",
                                            }, children: "ID" }), showProvider && ((0, jsx_runtime_1.jsx)("th", { scope: "col", style: {
                                                padding: "0.75rem",
                                                textAlign: "left",
                                                fontWeight: 600,
                                                borderBottom: "2px solid #e5e7eb",
                                                backgroundColor: "#f9fafb",
                                            }, children: "Provider" })), (0, jsx_runtime_1.jsx)("th", { scope: "col", style: {
                                                padding: "0.75rem",
                                                textAlign: "left",
                                                fontWeight: 600,
                                                borderBottom: "2px solid #e5e7eb",
                                                backgroundColor: "#f9fafb",
                                            }, children: "Amount" }), (0, jsx_runtime_1.jsx)("th", { scope: "col", style: {
                                                padding: "0.75rem",
                                                textAlign: "left",
                                                fontWeight: 600,
                                                borderBottom: "2px solid #e5e7eb",
                                                backgroundColor: "#f9fafb",
                                            }, children: "Currency" }), (0, jsx_runtime_1.jsx)("th", { scope: "col", style: {
                                                padding: "0.75rem",
                                                textAlign: "left",
                                                fontWeight: 600,
                                                borderBottom: "2px solid #e5e7eb",
                                                backgroundColor: "#f9fafb",
                                            }, children: "Date" }), showStatus && ((0, jsx_runtime_1.jsx)("th", { scope: "col", style: {
                                                padding: "0.75rem",
                                                textAlign: "left",
                                                fontWeight: 600,
                                                borderBottom: "2px solid #e5e7eb",
                                                backgroundColor: "#f9fafb",
                                            }, children: "Status" }))] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: sanitizedTransactions.map((tx, index) => ((0, jsx_runtime_1.jsxs)("tr", { onClick: () => {
                                        track("transaction.selected", { transactionId: tx.id });
                                        onSelect?.(tx);
                                    }, onKeyDown: (e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            track("transaction.selected", { transactionId: tx.id });
                                            onSelect?.(tx);
                                        }
                                    }, role: onSelect ? "button" : "row", tabIndex: onSelect ? 0 : -1, "aria-label": `Transaction ${tx.id}, ${tx.amount.value} ${tx.amount.currency}`, style: {
                                        cursor: onSelect ? "pointer" : "default",
                                        backgroundColor: index % 2 === 0 ? "white" : "#f9fafb",
                                        borderBottom: "1px solid #e5e7eb",
                                        transition: "background-color 0.15s ease",
                                    }, onMouseEnter: (e) => {
                                        if (onSelect) {
                                            e.currentTarget.style.backgroundColor = "#f3f4f6";
                                        }
                                    }, onMouseLeave: (e) => {
                                        e.currentTarget.style.backgroundColor = index % 2 === 0 ? "white" : "#f9fafb";
                                    }, onFocus: (e) => {
                                        if (onSelect) {
                                            e.currentTarget.style.outline = "2px solid #3b82f6";
                                            e.currentTarget.style.outlineOffset = "-2px";
                                        }
                                    }, onBlur: (e) => {
                                        e.currentTarget.style.outline = "none";
                                    }, children: [(0, jsx_runtime_1.jsx)("td", { style: { padding: "0.75rem" }, children: tx.id }), showProvider && (0, jsx_runtime_1.jsx)("td", { style: { padding: "0.75rem" }, children: tx.provider }), (0, jsx_runtime_1.jsx)("td", { style: { padding: "0.75rem" }, children: tx.amount.value.toFixed(2) }), (0, jsx_runtime_1.jsx)("td", { style: { padding: "0.75rem" }, children: tx.currency }), (0, jsx_runtime_1.jsx)("td", { style: { padding: "0.75rem" }, children: (0, jsx_runtime_1.jsx)("time", { dateTime: tx.date, children: new Date(tx.date).toLocaleDateString() }) }), showStatus && ((0, jsx_runtime_1.jsx)("td", { style: { padding: "0.75rem" }, children: (0, jsx_runtime_1.jsx)("span", { role: "status", "aria-label": `Status: ${tx.status}`, children: tx.status }) }))] }, tx.id))) })] }) }), sanitizedTransactions.length === 0 && ((0, jsx_runtime_1.jsx)("div", { role: "status", "aria-live": "polite", style: {
                        padding: "3rem 1rem",
                        textAlign: "center",
                        color: "#6b7280",
                    }, children: "No transactions found" }))] }));
    }
    // Config mode: return null (widget registered above)
    return null;
});
//# sourceMappingURL=TransactionTable.js.map