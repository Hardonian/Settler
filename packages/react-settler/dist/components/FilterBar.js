"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterBar = FilterBar;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * FilterBar Component
 * Advanced filtering for reconciliation data
 */
const react_1 = require("react");
const context_1 = require("../context");
const useTelemetry_1 = require("../hooks/useTelemetry");
function FilterBar({ onFilterChange, className, showProviderFilter = true, showStatusFilter = true, showDateRangeFilter = true, showAmountRangeFilter = true, }) {
    const context = (0, context_1.useCompilationContext)();
    const { track } = (0, useTelemetry_1.useTelemetry)("FilterBar");
    const [filters, setFilters] = (0, react_1.useState)({});
    const handleFilterChange = (0, react_1.useCallback)((newFilters) => {
        setFilters(newFilters);
        track("filter.changed", { filters: newFilters });
        onFilterChange?.(newFilters);
    }, [onFilterChange, track]);
    // In config mode, register widget
    if (context.mode === "config") {
        if (!context.config.widgets) {
            context.config.widgets = {};
        }
        context.config.widgets["filter-bar"] = {
            id: "filter-bar",
            type: "filter-bar",
            props: {
                showProviderFilter,
                showStatusFilter,
                showDateRangeFilter,
                showAmountRangeFilter,
            },
        };
        return null;
    }
    // UI mode
    return ((0, jsx_runtime_1.jsx)("div", { className: className, "data-widget": "filter-bar", children: (0, jsx_runtime_1.jsxs)("div", { style: {
                display: "flex",
                gap: "1rem",
                flexWrap: "wrap",
                padding: "1rem",
                backgroundColor: "#f9fafb",
                borderRadius: "8px",
            }, children: [showProviderFilter && ((0, jsx_runtime_1.jsxs)("select", { value: filters.provider?.[0] || "", onChange: (e) => {
                        const provider = e.target.value ? [e.target.value] : undefined;
                        handleFilterChange({ ...filters, provider: provider ?? undefined });
                    }, style: { padding: "0.5rem", borderRadius: "4px", border: "1px solid #d1d5db" }, children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "All Providers" }), (0, jsx_runtime_1.jsx)("option", { value: "stripe", children: "Stripe" }), (0, jsx_runtime_1.jsx)("option", { value: "paypal", children: "PayPal" }), (0, jsx_runtime_1.jsx)("option", { value: "square", children: "Square" })] })), showStatusFilter && ((0, jsx_runtime_1.jsxs)("select", { value: filters.status?.[0] || "", onChange: (e) => {
                        const status = e.target.value ? [e.target.value] : undefined;
                        handleFilterChange({ ...filters, status: status ?? undefined });
                    }, style: { padding: "0.5rem", borderRadius: "4px", border: "1px solid #d1d5db" }, children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "All Statuses" }), (0, jsx_runtime_1.jsx)("option", { value: "pending", children: "Pending" }), (0, jsx_runtime_1.jsx)("option", { value: "succeeded", children: "Succeeded" }), (0, jsx_runtime_1.jsx)("option", { value: "failed", children: "Failed" })] })), showDateRangeFilter && ((0, jsx_runtime_1.jsxs)("div", { style: { display: "flex", gap: "0.5rem", alignItems: "center" }, children: [(0, jsx_runtime_1.jsx)("input", { type: "date", value: filters.dateRange?.start || "", onChange: (e) => {
                                handleFilterChange({
                                    ...filters,
                                    dateRange: { ...filters.dateRange, start: e.target.value },
                                });
                            }, style: { padding: "0.5rem", borderRadius: "4px", border: "1px solid #d1d5db" } }), (0, jsx_runtime_1.jsx)("span", { children: "to" }), (0, jsx_runtime_1.jsx)("input", { type: "date", value: filters.dateRange?.end || "", onChange: (e) => {
                                handleFilterChange({
                                    ...filters,
                                    dateRange: { ...filters.dateRange, end: e.target.value },
                                });
                            }, style: { padding: "0.5rem", borderRadius: "4px", border: "1px solid #d1d5db" } })] })), showAmountRangeFilter && ((0, jsx_runtime_1.jsxs)("div", { style: { display: "flex", gap: "0.5rem", alignItems: "center" }, children: [(0, jsx_runtime_1.jsx)("input", { type: "number", placeholder: "Min", value: filters.amountRange?.min || "", onChange: (e) => {
                                const min = e.target.value ? parseFloat(e.target.value) : undefined;
                                handleFilterChange({
                                    ...filters,
                                    amountRange: { ...filters.amountRange, min: min ?? undefined },
                                });
                            }, style: {
                                padding: "0.5rem",
                                borderRadius: "4px",
                                border: "1px solid #d1d5db",
                                width: "100px",
                            } }), (0, jsx_runtime_1.jsx)("span", { children: "to" }), (0, jsx_runtime_1.jsx)("input", { type: "number", placeholder: "Max", value: filters.amountRange?.max || "", onChange: (e) => {
                                const max = e.target.value ? parseFloat(e.target.value) : undefined;
                                handleFilterChange({
                                    ...filters,
                                    amountRange: { ...filters.amountRange, max: max ?? undefined },
                                });
                            }, style: {
                                padding: "0.5rem",
                                borderRadius: "4px",
                                border: "1px solid #d1d5db",
                                width: "100px",
                            } })] })), (0, jsx_runtime_1.jsx)("button", { onClick: () => {
                        handleFilterChange({});
                        track("filter.cleared");
                    }, style: {
                        padding: "0.5rem 1rem",
                        borderRadius: "4px",
                        border: "1px solid #d1d5db",
                        backgroundColor: "white",
                        cursor: "pointer",
                    }, children: "Clear Filters" })] }) }));
}
//# sourceMappingURL=FilterBar.js.map