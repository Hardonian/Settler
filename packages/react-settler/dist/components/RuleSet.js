"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleSet = RuleSet;
const jsx_runtime_1 = require("react/jsx-runtime");
const context_1 = require("../context");
function RuleSet({ id, name, priority = "exact-first", conflictResolution = "manual-review", children, }) {
    const context = (0, context_1.useCompilationContext)();
    // Extract rules from children (MatchRule components)
    // Rules are collected by MatchRule components during render
    // In config mode, collect rules and register ruleset
    if (context.mode === "config") {
        // Rules will be collected by MatchRule components
        // For now, we'll register the ruleset structure
        const ruleset = {
            id,
            name,
            rules: [], // Will be populated by MatchRule components
            priority,
            conflictResolution,
        };
        if (!context.config.rulesets) {
            context.config.rulesets = [];
        }
        context.config.rulesets.push(ruleset);
    }
    // Render children in both modes (children handle their own mode logic)
    return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: children });
}
//# sourceMappingURL=RuleSet.js.map