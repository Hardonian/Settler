"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompilationProvider = CompilationProvider;
exports.useCompilationContext = useCompilationContext;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Compilation Context
 * Provides compilation mode and config state to React components
 */
const react_1 = require("react");
const CompilationContext = (0, react_1.createContext)(null);
function CompilationProvider({ mode = "ui", config = {}, children, }) {
    const contextValue = {
        mode,
        config: config,
        widgetRegistry: new Map(),
    };
    return (0, jsx_runtime_1.jsx)(CompilationContext.Provider, { value: contextValue, children: children });
}
function useCompilationContext() {
    const context = (0, react_1.useContext)(CompilationContext);
    if (!context) {
        return {
            mode: "ui",
            config: {},
            widgetRegistry: new Map(),
        };
    }
    return context;
}
//# sourceMappingURL=context.js.map