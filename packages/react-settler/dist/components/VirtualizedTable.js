"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VirtualizedTable = VirtualizedTable;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * VirtualizedTable Component
 * High-performance virtualized table for large datasets
 *
 * ⚠️ Commercial Feature: Requires Settler Commercial subscription
 */
const licensing_1 = require("../utils/licensing");
const react_1 = require("react");
const context_1 = require("../context");
const DEFAULT_HEIGHT = 400;
const DEFAULT_ROW_HEIGHT = 50;
function VirtualizedTable({ transactions, height = DEFAULT_HEIGHT, rowHeight = DEFAULT_ROW_HEIGHT, onSelect, className }) {
    const context = (0, context_1.useCompilationContext)();
    const { hasAccess, UpgradePrompt } = (0, licensing_1.useFeatureGate)(licensing_1.FEATURE_FLAGS.VIRTUALIZATION);
    const [scrollTop, setScrollTop] = (0, react_1.useState)(0);
    if (!hasAccess) {
        return (0, jsx_runtime_1.jsx)(UpgradePrompt, {});
    }
    const visibleRange = (0, react_1.useMemo)(() => {
        const startIndex = Math.floor(scrollTop / rowHeight);
        const endIndex = Math.min(startIndex + Math.ceil(height / rowHeight) + 1, transactions.length);
        return { startIndex, endIndex };
    }, [scrollTop, rowHeight, height, transactions.length]);
    const visibleTransactions = (0, react_1.useMemo)(() => {
        return transactions.slice(visibleRange.startIndex, visibleRange.endIndex);
    }, [transactions, visibleRange]);
    const totalHeight = transactions.length * rowHeight;
    const offsetY = visibleRange.startIndex * rowHeight;
    const handleScroll = (0, react_1.useCallback)((e) => {
        setScrollTop(e.currentTarget.scrollTop);
    }, []);
    // In config mode, register widget
    if (context.mode === 'config') {
        if (!context.config.widgets) {
            context.config.widgets = {};
        }
        context.config.widgets['virtualized-table'] = {
            id: 'virtualized-table',
            type: 'transaction-table',
            props: { height, rowHeight }
        };
        return null;
    }
    // UI mode
    return ((0, jsx_runtime_1.jsx)("div", { className: className, "data-widget": "virtualized-table", style: {
            height,
            overflow: 'auto',
            border: '1px solid #e5e7eb',
            borderRadius: '8px'
        }, onScroll: handleScroll, children: (0, jsx_runtime_1.jsx)("div", { style: { height: totalHeight, position: 'relative' }, children: (0, jsx_runtime_1.jsxs)("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [(0, jsx_runtime_1.jsx)("thead", { style: { position: 'sticky', top: 0, backgroundColor: '#f9fafb', zIndex: 10 }, children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { style: { padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }, children: "ID" }), (0, jsx_runtime_1.jsx)("th", { style: { padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }, children: "Provider" }), (0, jsx_runtime_1.jsx)("th", { style: { padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }, children: "Amount" }), (0, jsx_runtime_1.jsx)("th", { style: { padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }, children: "Date" }), (0, jsx_runtime_1.jsx)("th", { style: { padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }, children: "Status" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { style: { transform: `translateY(${offsetY}px)` }, children: visibleTransactions.map((tx, index) => ((0, jsx_runtime_1.jsxs)("tr", { onClick: () => onSelect?.(tx), style: {
                                cursor: onSelect ? 'pointer' : 'default',
                                backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb',
                                borderBottom: '1px solid #e5e7eb'
                            }, children: [(0, jsx_runtime_1.jsx)("td", { style: { padding: '0.75rem' }, children: tx.id }), (0, jsx_runtime_1.jsx)("td", { style: { padding: '0.75rem' }, children: tx.provider }), (0, jsx_runtime_1.jsxs)("td", { style: { padding: '0.75rem' }, children: [tx.amount.value.toFixed(2), " ", tx.amount.currency] }), (0, jsx_runtime_1.jsx)("td", { style: { padding: '0.75rem' }, children: new Date(tx.date).toLocaleDateString() }), (0, jsx_runtime_1.jsx)("td", { style: { padding: '0.75rem' }, children: tx.status })] }, tx.id))) })] }) }) }));
}
//# sourceMappingURL=VirtualizedTable.js.map