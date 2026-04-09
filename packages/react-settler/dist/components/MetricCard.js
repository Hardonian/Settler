"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricCard = MetricCard;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * MetricCard
 * Displays a key reconciliation metric
 */
const context_1 = require("../context");
function MetricCard({ title, value, subtitle, trend, className }) {
    const context = (0, context_1.useCompilationContext)();
    // In config mode, register widget
    if (context.mode === "config") {
        const widgetId = `metric-${title.toLowerCase().replace(/\s+/g, "-")}`;
        if (!context.config.widgets) {
            context.config.widgets = {};
        }
        context.config.widgets[widgetId] = {
            id: widgetId,
            type: "metric-card",
            title,
            props: {
                subtitle,
                trend,
            },
        };
    }
    // In UI mode, render card
    if (context.mode === "ui") {
        return ((0, jsx_runtime_1.jsx)("div", { className: className, "data-widget": "metric-card", children: (0, jsx_runtime_1.jsxs)("div", { "data-metric-title": title, children: [(0, jsx_runtime_1.jsx)("h3", { children: title }), (0, jsx_runtime_1.jsx)("div", { "data-metric-value": value, "data-trend": trend, children: value }), subtitle && (0, jsx_runtime_1.jsx)("div", { "data-metric-subtitle": true, children: subtitle })] }) }));
    }
    // Config mode: return null (widget registered above)
    return null;
}
//# sourceMappingURL=MetricCard.js.map