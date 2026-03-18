/**
 * Config Compiler
 * Compiles React component trees into ReconciliationConfig JSON
 *
 * This compiler renders components in "config mode" to extract reconciliation
 * rules, widgets, and view configurations from the React tree.
 */
import { ReactElement } from 'react';
import { ReconciliationConfig } from '@settler/protocol';
/**
 * Compile a React component tree into a ReconciliationConfig
 *
 * This function renders the component tree in "config mode" to extract
 * all reconciliation rules, widgets, and view configurations.
 *
 * Note: This requires React to be available. In Node.js environments,
 * you may need to use react-dom/server's renderToString or similar.
 */
export declare function compileToConfig(_component: ReactElement, options?: {
    name?: string;
    description?: string;
}): ReconciliationConfig;
/**
 * Compile to JSON string
 */
export declare function compileToJSON(component: ReactElement, options?: {
    name?: string;
    description?: string;
    pretty?: boolean;
}): string;
//# sourceMappingURL=compiler.d.ts.map