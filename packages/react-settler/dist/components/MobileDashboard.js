"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MobileDashboard = MobileDashboard;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * MobileDashboard Component
 * Mobile-optimized reconciliation dashboard
 */
const react_1 = require("react");
const ReconciliationDashboard_1 = require("./ReconciliationDashboard");
const TransactionTable_1 = require("./TransactionTable");
const ExceptionTable_1 = require("./ExceptionTable");
const MetricCard_1 = require("./MetricCard");
const SearchBar_1 = require("./SearchBar");
const useTelemetry_1 = require("../hooks/useTelemetry");
/**
 * Mobile-optimized dashboard with responsive design
 */
function MobileDashboard({ transactions, exceptions, onTransactionSelect, onExceptionResolve, className }) {
    const { track } = (0, useTelemetry_1.useTelemetry)('MobileDashboard');
    const [activeTab, setActiveTab] = (0, react_1.useState)('transactions');
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    // Filter transactions based on search
    const filteredTransactions = (0, react_1.useMemo)(() => {
        if (!searchQuery)
            return transactions;
        const query = searchQuery.toLowerCase();
        return transactions.filter(tx => tx.id.toLowerCase().includes(query) ||
            tx.provider.toLowerCase().includes(query) ||
            tx.providerTransactionId.toLowerCase().includes(query));
    }, [transactions, searchQuery]);
    return ((0, jsx_runtime_1.jsx)(ReconciliationDashboard_1.ReconciliationDashboard, { ...(className !== undefined ? { className } : {}), children: (0, jsx_runtime_1.jsxs)("div", { style: {
                padding: '1rem',
                maxWidth: '100%',
                backgroundColor: '#fff'
            }, "data-mobile-dashboard": true, children: [(0, jsx_runtime_1.jsxs)("div", { style: { marginBottom: '1.5rem' }, children: [(0, jsx_runtime_1.jsx)("h1", { style: {
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                marginBottom: '0.5rem',
                                color: '#111827'
                            }, children: "Reconciliation" }), (0, jsx_runtime_1.jsxs)("div", { style: {
                                display: 'flex',
                                gap: '0.75rem',
                                overflowX: 'auto',
                                paddingBottom: '0.5rem',
                                WebkitOverflowScrolling: 'touch'
                            }, children: [(0, jsx_runtime_1.jsx)("div", { style: { minWidth: '140px', flexShrink: 0 }, children: (0, jsx_runtime_1.jsx)(MetricCard_1.MetricCard, { title: "Transactions", value: transactions.length, subtitle: "Total" }) }), (0, jsx_runtime_1.jsx)("div", { style: { minWidth: '140px', flexShrink: 0 }, children: (0, jsx_runtime_1.jsx)(MetricCard_1.MetricCard, { title: "Match Rate", value: `${Math.round((transactions.length - exceptions.length) / Math.max(transactions.length, 1) * 100)}%`, subtitle: "Success" }) }), (0, jsx_runtime_1.jsx)("div", { style: { minWidth: '140px', flexShrink: 0 }, children: (0, jsx_runtime_1.jsx)(MetricCard_1.MetricCard, { title: "Exceptions", value: exceptions.length, subtitle: "Review" }) })] })] }), (0, jsx_runtime_1.jsx)("div", { style: { marginBottom: '1rem' }, children: (0, jsx_runtime_1.jsx)(SearchBar_1.SearchBar, { onSearch: (query) => {
                            setSearchQuery(query);
                            track('search.executed', { query, platform: 'mobile' });
                        }, placeholder: "Search transactions...", debounceMs: 300 }) }), (0, jsx_runtime_1.jsxs)("div", { style: {
                        display: 'flex',
                        borderBottom: '2px solid #e5e7eb',
                        marginBottom: '1rem'
                    }, role: "tablist", "aria-label": "Dashboard tabs", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: () => {
                                setActiveTab('transactions');
                                track('tab.switched', { tab: 'transactions' });
                            }, role: "tab", "aria-selected": activeTab === 'transactions', "aria-controls": "transactions-panel", style: {
                                flex: 1,
                                padding: '0.75rem',
                                border: 'none',
                                backgroundColor: 'transparent',
                                borderBottom: activeTab === 'transactions' ? '2px solid #3b82f6' : 'none',
                                color: activeTab === 'transactions' ? '#3b82f6' : '#6b7280',
                                fontWeight: activeTab === 'transactions' ? 600 : 400,
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                touchAction: 'manipulation'
                            }, children: ["Transactions (", transactions.length, ")"] }), (0, jsx_runtime_1.jsxs)("button", { onClick: () => {
                                setActiveTab('exceptions');
                                track('tab.switched', { tab: 'exceptions' });
                            }, role: "tab", "aria-selected": activeTab === 'exceptions', "aria-controls": "exceptions-panel", style: {
                                flex: 1,
                                padding: '0.75rem',
                                border: 'none',
                                backgroundColor: 'transparent',
                                borderBottom: activeTab === 'exceptions' ? '2px solid #3b82f6' : 'none',
                                color: activeTab === 'exceptions' ? '#3b82f6' : '#6b7280',
                                fontWeight: activeTab === 'exceptions' ? 600 : 400,
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                touchAction: 'manipulation'
                            }, children: ["Exceptions (", exceptions.length, ")"] })] }), (0, jsx_runtime_1.jsx)("div", { role: "tabpanel", id: "transactions-panel", "aria-hidden": activeTab !== 'transactions', style: { display: activeTab === 'transactions' ? 'block' : 'none' }, children: filteredTransactions.length > 0 ? ((0, jsx_runtime_1.jsx)("div", { style: {
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            overflow: 'hidden'
                        }, children: (0, jsx_runtime_1.jsx)(TransactionTable_1.TransactionTable, { transactions: filteredTransactions, ...(onTransactionSelect !== undefined ? { onSelect: onTransactionSelect } : {}) }) })) : ((0, jsx_runtime_1.jsx)("div", { style: {
                            padding: '3rem 1rem',
                            textAlign: 'center',
                            color: '#6b7280'
                        }, children: (0, jsx_runtime_1.jsx)("p", { children: "No transactions found" }) })) }), (0, jsx_runtime_1.jsx)("div", { role: "tabpanel", id: "exceptions-panel", "aria-hidden": activeTab !== 'exceptions', style: { display: activeTab === 'exceptions' ? 'block' : 'none' }, children: exceptions.length > 0 ? ((0, jsx_runtime_1.jsx)("div", { style: {
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            overflow: 'hidden'
                        }, children: (0, jsx_runtime_1.jsx)(ExceptionTable_1.ExceptionTable, { exceptions: exceptions, ...(onExceptionResolve !== undefined ? { onResolve: onExceptionResolve } : {}) }) })) : ((0, jsx_runtime_1.jsx)("div", { style: {
                            padding: '3rem 1rem',
                            textAlign: 'center',
                            color: '#6b7280'
                        }, children: (0, jsx_runtime_1.jsx)("p", { children: "No exceptions found" }) })) })] }) }));
}
//# sourceMappingURL=MobileDashboard.js.map