"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShopifyApp = ShopifyApp;
exports.useShopifyAppBridge = useShopifyAppBridge;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Shopify App Integration
 * React.Settler components optimized for Shopify app embeds
 *
 * ⚠️ Commercial Feature: Requires Settler Commercial subscription
 */
const licensing_1 = require("../utils/licensing");
const react_1 = __importDefault(require("react"));
const ReconciliationDashboard_1 = require("../components/ReconciliationDashboard");
const TransactionTable_1 = require("../components/TransactionTable");
const ExceptionTable_1 = require("../components/ExceptionTable");
const MetricCard_1 = require("../components/MetricCard");
/**
 * Shopify App Wrapper
 * Optimized for Shopify Polaris design system
 */
function ShopifyApp({ shop, transactions = [], exceptions = [], onAction }) {
    const { hasAccess, UpgradePrompt } = (0, licensing_1.useFeatureGate)(licensing_1.FEATURE_FLAGS.SHOPIFY_INTEGRATION);
    if (!hasAccess) {
        return (0, jsx_runtime_1.jsx)(UpgradePrompt, {});
    }
    return ((0, jsx_runtime_1.jsx)("div", { style: {
            padding: '1rem',
            maxWidth: '100%',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }, "data-shopify-app": true, "data-shop": shop, children: (0, jsx_runtime_1.jsxs)(ReconciliationDashboard_1.ReconciliationDashboard, { children: [(0, jsx_runtime_1.jsxs)("div", { style: { marginBottom: '1.5rem' }, children: [(0, jsx_runtime_1.jsx)("h1", { style: { fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }, children: "Payment Reconciliation" }), (0, jsx_runtime_1.jsxs)("p", { style: { color: '#6b7280', fontSize: '0.875rem' }, children: ["Shop: ", shop] })] }), (0, jsx_runtime_1.jsxs)("div", { style: {
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1rem',
                        marginBottom: '1.5rem'
                    }, children: [(0, jsx_runtime_1.jsx)(MetricCard_1.MetricCard, { title: "Total Transactions", value: transactions.length, subtitle: "This period" }), (0, jsx_runtime_1.jsx)(MetricCard_1.MetricCard, { title: "Match Rate", value: `${Math.round((transactions.length - exceptions.length) / Math.max(transactions.length, 1) * 100)}%`, subtitle: "Successfully matched", trend: "up" }), (0, jsx_runtime_1.jsx)(MetricCard_1.MetricCard, { title: "Exceptions", value: exceptions.length, subtitle: "Requiring review", trend: exceptions.length > 0 ? 'down' : 'neutral' })] }), transactions.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { style: { marginBottom: '1.5rem' }, children: [(0, jsx_runtime_1.jsx)("h2", { style: { fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }, children: "Transactions" }), (0, jsx_runtime_1.jsx)("div", { style: {
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                overflow: 'hidden'
                            }, children: (0, jsx_runtime_1.jsx)(TransactionTable_1.TransactionTable, { transactions: transactions, onSelect: (tx) => onAction?.('transaction.selected', tx) }) })] })), exceptions.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { style: { fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }, children: "Exceptions" }), (0, jsx_runtime_1.jsx)("div", { style: {
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                overflow: 'hidden'
                            }, children: (0, jsx_runtime_1.jsx)(ExceptionTable_1.ExceptionTable, { exceptions: exceptions, onResolve: (exc) => onAction?.('exception.resolved', exc) }) })] }))] }) }));
}
/**
 * Shopify App Bridge Integration
 * For use with Shopify App Bridge
 */
function useShopifyAppBridge() {
    const [shop, setShop] = react_1.default.useState('');
    const [apiKey, setApiKey] = react_1.default.useState('');
    react_1.default.useEffect(() => {
        // Extract shop and API key from Shopify App Bridge context
        if (typeof window !== 'undefined' && window.ShopifyAppBridge) {
            const appBridge = window.ShopifyAppBridge;
            // Get shop domain from App Bridge
            const shopDomain = appBridge.getShopDomain?.() || '';
            setShop(shopDomain);
        }
    }, []);
    return { shop, apiKey, setApiKey };
}
//# sourceMappingURL=shopify.js.map