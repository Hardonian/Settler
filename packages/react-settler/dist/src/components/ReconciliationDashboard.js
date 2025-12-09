"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReconciliationDashboard = ReconciliationDashboard;
const jsx_runtime_1 = require("react/jsx-runtime");
const context_1 = require("../context");
function ReconciliationDashboard({ children, mode, config, className }) {
    return ((0, jsx_runtime_1.jsx)(context_1.CompilationProvider, { ...(mode !== undefined ? { mode } : {}), ...(config !== undefined ? { config } : {}), children: (0, jsx_runtime_1.jsx)("div", { className: className, "data-reconciliation-dashboard": true, children: children }) }));
}
//# sourceMappingURL=ReconciliationDashboard.js.map