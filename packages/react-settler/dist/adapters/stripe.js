"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeApp = StripeApp;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Stripe App Integration
 * React.Settler components for Stripe Connect apps
 *
 * ⚠️ Commercial Feature: Requires Settler Commercial subscription
 */
const licensing_1 = require("../utils/licensing");
const ReconciliationDashboard_1 = require("../components/ReconciliationDashboard");
const TransactionTable_1 = require("../components/TransactionTable");
const ExceptionTable_1 = require("../components/ExceptionTable");
const MetricCard_1 = require("../components/MetricCard");
const ExportButton_1 = require("../components/ExportButton");
const UpgradePrompt_1 = require("../components/UpgradePrompt");
/**
 * Stripe Connect App Wrapper
 * Optimized for Stripe dashboard integration
 */
function StripeApp({ accountId, transactions = [], exceptions = [], onExport, }) {
    const { hasAccess } = (0, licensing_1.useFeatureGate)(licensing_1.FEATURE_FLAGS.STRIPE_INTEGRATION);
    if (!hasAccess) {
        return ((0, jsx_runtime_1.jsx)(UpgradePrompt_1.UpgradePrompt, { feature: licensing_1.FEATURE_FLAGS.STRIPE_INTEGRATION, featureName: "Stripe Integration" }));
    }
    return ((0, jsx_runtime_1.jsx)("div", { style: {
            padding: "1.5rem",
            backgroundColor: "#fafafa",
            minHeight: "100vh",
        }, "data-stripe-app": true, "data-account-id": accountId, children: (0, jsx_runtime_1.jsxs)(ReconciliationDashboard_1.ReconciliationDashboard, { children: [(0, jsx_runtime_1.jsxs)("div", { style: { marginBottom: "2rem" }, children: [(0, jsx_runtime_1.jsxs)("div", { style: {
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "1rem",
                            }, children: [(0, jsx_runtime_1.jsx)("h1", { style: { fontSize: "1.75rem", fontWeight: 600 }, children: "Reconciliation Dashboard" }), transactions.length > 0 && ((0, jsx_runtime_1.jsx)(ExportButton_1.ExportButton, { data: transactions, format: "csv", onExport: onExport }))] }), (0, jsx_runtime_1.jsxs)("p", { style: { color: "#6b7280", fontSize: "0.875rem" }, children: ["Stripe Account: ", accountId] })] }), (0, jsx_runtime_1.jsxs)("div", { style: {
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "1rem",
                        marginBottom: "2rem",
                    }, children: [(0, jsx_runtime_1.jsx)(MetricCard_1.MetricCard, { title: "Total Revenue", value: `$${transactions.reduce((sum, tx) => sum + tx.amount.value, 0).toFixed(2)}`, subtitle: "This period" }), (0, jsx_runtime_1.jsx)(MetricCard_1.MetricCard, { title: "Transactions", value: transactions.length, subtitle: "Processed" }), (0, jsx_runtime_1.jsx)(MetricCard_1.MetricCard, { title: "Match Rate", value: `${Math.round(((transactions.length - exceptions.length) / Math.max(transactions.length, 1)) * 100)}%`, subtitle: "Successfully matched", trend: "up" }), (0, jsx_runtime_1.jsx)(MetricCard_1.MetricCard, { title: "Exceptions", value: exceptions.length, subtitle: "Requiring review", trend: exceptions.length > 0 ? "down" : "neutral" })] }), transactions.length > 0 && ((0, jsx_runtime_1.jsx)("div", { style: { marginBottom: "2rem" }, children: (0, jsx_runtime_1.jsx)(TransactionTable_1.TransactionTable, { transactions: transactions }) })), exceptions.length > 0 && ((0, jsx_runtime_1.jsx)("div", { children: (0, jsx_runtime_1.jsx)(ExceptionTable_1.ExceptionTable, { exceptions: exceptions }) }))] }) }));
}
//# sourceMappingURL=stripe.js.map