"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpgradePrompt = UpgradePrompt;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * UpgradePrompt Component
 * Shows upgrade messaging for commercial features
 */
const licensing_1 = require("../utils/licensing");
function UpgradePrompt({ feature, featureName, compact = false, onUpgrade }) {
    const handleUpgrade = () => {
        if (onUpgrade) {
            onUpgrade();
        }
        else {
            window.open('https://settler.dev/pricing', '_blank', 'noopener,noreferrer');
        }
    };
    if (compact) {
        return ((0, jsx_runtime_1.jsxs)("div", { style: {
                padding: '0.75rem',
                backgroundColor: '#fef3c7',
                border: '1px solid #fbbf24',
                borderRadius: '6px',
                fontSize: '0.875rem'
            }, children: [(0, jsx_runtime_1.jsxs)("span", { style: { color: '#92400e' }, children: [featureName || feature, " requires Settler Commercial.", ' '] }), (0, jsx_runtime_1.jsx)("button", { onClick: handleUpgrade, style: {
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#92400e',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        fontWeight: 600
                    }, children: "Upgrade \u2192" })] }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { style: {
            padding: '2rem',
            textAlign: 'center',
            border: '2px dashed #e5e7eb',
            borderRadius: '8px',
            backgroundColor: '#f9fafb'
        }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '3rem', marginBottom: '1rem' }, children: "\uD83D\uDD12" }), (0, jsx_runtime_1.jsxs)("h3", { style: { marginTop: 0, marginBottom: '0.5rem', color: '#111827' }, children: [featureName || feature, " is a Commercial Feature"] }), (0, jsx_runtime_1.jsx)("p", { style: { color: '#6b7280', marginBottom: '1.5rem', maxWidth: '500px', margin: '0 auto 1.5rem' }, children: (0, licensing_1.getUpgradeMessage)(feature) }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }, children: [(0, jsx_runtime_1.jsx)("button", { onClick: handleUpgrade, style: {
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '1rem'
                        }, children: "View Pricing" }), (0, jsx_runtime_1.jsx)("a", { href: "https://settler.dev/docs/commercial-features", target: "_blank", rel: "noopener noreferrer", style: {
                            padding: '0.75rem 1.5rem',
                            backgroundColor: 'white',
                            color: '#3b82f6',
                            border: '1px solid #3b82f6',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            fontWeight: 600,
                            fontSize: '1rem'
                        }, children: "Learn More" })] })] }));
}
//# sourceMappingURL=UpgradePrompt.js.map