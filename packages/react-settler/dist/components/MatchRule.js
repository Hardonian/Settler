"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchRule = MatchRule;
const jsx_runtime_1 = require("react/jsx-runtime");
const context_1 = require("../context");
function MatchRule({ id, name, field, type, tolerance, priority, enabled = true, }) {
    const context = (0, context_1.useCompilationContext)();
    // In config mode, add rule to the most recent ruleset
    if (context.mode === "config") {
        if (!context.config.rulesets || context.config.rulesets.length === 0) {
            // Create a default ruleset if none exists
            context.config.rulesets = [
                {
                    id: "default-ruleset",
                    name: "Default Rules",
                    rules: [],
                    priority: "exact-first",
                },
            ];
        }
        const ruleset = context.config.rulesets[context.config.rulesets.length - 1];
        if (!ruleset) {
            return null;
        }
        const rule = {
            id,
            name,
            field,
            type,
            ...(tolerance ? { tolerance: tolerance } : {}),
            ...(priority !== undefined ? { priority } : {}),
            enabled,
        };
        ruleset.rules.push(rule);
    }
    // In UI mode, render rule display (optional)
    if (context.mode === "ui") {
        return ((0, jsx_runtime_1.jsxs)("div", { "data-rule-id": id, "data-rule-field": field, "data-rule-type": type, children: [(0, jsx_runtime_1.jsx)("strong", { children: name }), (0, jsx_runtime_1.jsxs)("span", { children: ["Field: ", field] }), (0, jsx_runtime_1.jsxs)("span", { children: ["Type: ", type] }), tolerance && (0, jsx_runtime_1.jsxs)("span", { children: ["Tolerance: ", JSON.stringify(tolerance)] })] }));
    }
    // Config mode: return null (rule registered above)
    return null;
}
//# sourceMappingURL=MatchRule.js.map