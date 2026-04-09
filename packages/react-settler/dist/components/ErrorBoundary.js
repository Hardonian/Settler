"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorBoundary = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * ErrorBoundary Component
 * Enterprise-grade error boundary with telemetry
 */
const react_1 = require("react");
class ErrorBoundary extends react_1.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }
    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            error,
        };
    }
    componentDidCatch(error, errorInfo) {
        this.setState({
            error,
            errorInfo,
        });
        // Call onError callback
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
        // Track error in telemetry
        if (this.props.telemetryProvider) {
            this.props.telemetryProvider.trackError({
                error,
                component: "ErrorBoundary",
                context: {
                    componentStack: errorInfo.componentStack,
                },
                timestamp: new Date().toISOString(),
            });
        }
    }
    render() {
        if (this.state.hasError && this.state.error) {
            if (this.props.fallback) {
                if (typeof this.props.fallback === "function") {
                    return this.props.fallback(this.state.error, this.state.errorInfo);
                }
                return this.props.fallback;
            }
            // Default fallback UI
            return ((0, jsx_runtime_1.jsxs)("div", { style: {
                    padding: "2rem",
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                    backgroundColor: "#fff5f5",
                }, children: [(0, jsx_runtime_1.jsx)("h2", { style: { color: "#c53030", marginTop: 0 }, children: "Something went wrong" }), (0, jsx_runtime_1.jsx)("p", { style: { color: "#742a2a" }, children: this.state.error.message || "An unexpected error occurred" }), process.env.NODE_ENV === "development" && this.state.errorInfo && ((0, jsx_runtime_1.jsxs)("details", { style: { marginTop: "1rem" }, children: [(0, jsx_runtime_1.jsx)("summary", { style: { cursor: "pointer", fontWeight: "bold" }, children: "Error Details" }), (0, jsx_runtime_1.jsxs)("pre", { style: {
                                    marginTop: "0.5rem",
                                    padding: "1rem",
                                    backgroundColor: "#f7f7f7",
                                    borderRadius: "4px",
                                    overflow: "auto",
                                    fontSize: "12px",
                                }, children: [this.state.error.stack, "\n\n", this.state.errorInfo.componentStack] })] }))] }));
        }
        return this.props.children;
    }
}
exports.ErrorBoundary = ErrorBoundary;
//# sourceMappingURL=ErrorBoundary.js.map