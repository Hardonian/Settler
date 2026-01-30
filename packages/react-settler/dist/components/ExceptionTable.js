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
exports.ExceptionTable = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * ExceptionTable
 * Displays reconciliation exceptions requiring manual review
 */
const react_1 = __importStar(require("react"));
const protocol_1 = require("@settler/protocol");
const context_1 = require("../context");
const useTelemetry_1 = require("../hooks/useTelemetry");
exports.ExceptionTable = react_1.default.memo(function ExceptionTable({ exceptions, onResolve, className, showSeverity = true, showCategory = true }) {
    const context = (0, context_1.useCompilationContext)();
    const { track } = (0, useTelemetry_1.useTelemetry)('ExceptionTable');
    // Sanitize exception descriptions
    const sanitizedExceptions = (0, react_1.useMemo)(() => {
        return exceptions.map(exc => ({
            ...exc,
            description: (0, protocol_1.sanitizeString)(exc.description)
        }));
    }, [exceptions]);
    // In config mode, register widget
    if (context.mode === 'config') {
        if (!context.config.widgets) {
            context.config.widgets = {};
        }
        context.config.widgets['exception-table'] = {
            id: 'exception-table',
            type: 'exception-table',
            props: {
                showSeverity,
                showCategory
            }
        };
    }
    // In UI mode, render table
    if (context.mode === 'ui') {
        return ((0, jsx_runtime_1.jsx)("div", { className: className, "data-widget": "exception-table", children: (0, jsx_runtime_1.jsxs)("table", { children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { children: "ID" }), showCategory && (0, jsx_runtime_1.jsx)("th", { children: "Category" }), showSeverity && (0, jsx_runtime_1.jsx)("th", { children: "Severity" }), (0, jsx_runtime_1.jsx)("th", { children: "Description" }), (0, jsx_runtime_1.jsx)("th", { children: "Status" }), onResolve && (0, jsx_runtime_1.jsx)("th", { children: "Actions" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: sanitizedExceptions.map((exception) => ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("td", { children: exception.id }), showCategory && (0, jsx_runtime_1.jsx)("td", { children: exception.category }), showSeverity && ((0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("span", { "data-severity": exception.severity, children: exception.severity }) })), (0, jsx_runtime_1.jsx)("td", { children: exception.description }), (0, jsx_runtime_1.jsx)("td", { children: exception.resolutionStatus }), onResolve && ((0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("button", { onClick: () => {
                                            track('exception.resolved', { exceptionId: exception.id });
                                            onResolve(exception);
                                        }, children: "Resolve" }) }))] }, exception.id))) })] }) }));
    }
    // Config mode: return null (widget registered above)
    return null;
});
//# sourceMappingURL=ExceptionTable.js.map