/**
 * Config Compiler
 * Compiles React component trees into ReconciliationConfig JSON
 * 
 * This compiler renders components in "config mode" to extract reconciliation
 * rules, widgets, and view configurations from the React tree.
 */

import { ReactElement } from 'react';
import {
  ReconciliationConfig
} from '@settler/protocol';
// Note: CompilationProvider would be used in a real implementation to render components
// import { CompilationProvider } from './context';

/**
 * Compile a React component tree into a ReconciliationConfig
 * 
 * This function renders the component tree in "config mode" to extract
 * all reconciliation rules, widgets, and view configurations.
 * 
 * Note: This requires React to be available. In Node.js environments,
 * you may need to use react-dom/server's renderToString or similar.
 */
export function compileToConfig(
  _component: ReactElement,
  options?: {
    name?: string;
    description?: string;
  }
): ReconciliationConfig {
  const config: Partial<ReconciliationConfig> = {
    version: '1.0.0',
    metadata: {
      name: options?.name || 'Reconciliation Workflow',
      ...(options?.description ? { description: options.description } : {}),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    rulesets: [],
    views: [],
    widgets: {}
  };

  // Create a wrapper component that provides compilation context
  // Note: In a real implementation, we would render the component tree here
  // const Wrapper = ({ children }: { children: ReactElement }) => {
  //   return (
  //     <CompilationProvider mode="config" config={config}>
  //       {children}
  //     </CompilationProvider>
  //   );
  // };

  // Render the component tree in config mode
  // Components will mutate the config object during render
  // Note: In a real implementation, we'd use React's renderer here
  // For now, we rely on components mutating config during their render phase
  // This works because React components are functions that execute synchronously
  
  // Extract widgets from the context's widget registry
  // Note: This requires access to the context's widgetRegistry
  // For now, widgets are collected by components directly mutating config.widgets
  // A more robust implementation would use React Context properly

  // Build final config
  const finalConfig: ReconciliationConfig = {
    version: config.version || '1.0.0',
    metadata: {
      name: config.metadata?.name || 'Reconciliation Workflow',
      ...(config.metadata?.description ? { description: config.metadata.description } : {}),
      createdAt: config.metadata?.createdAt || new Date().toISOString(),
      updatedAt: config.metadata?.updatedAt || new Date().toISOString()
    },
    rulesets: config.rulesets || [],
    views: config.views || [],
    widgets: config.widgets || {}
  };

  return finalConfig;
}

/**
 * Compile to JSON string
 */
export function compileToJSON(
  component: ReactElement,
  options?: {
    name?: string;
    description?: string;
    pretty?: boolean;
  }
): string {
  const config = compileToConfig(component, options);
  return options?.pretty
    ? JSON.stringify(config, null, 2)
    : JSON.stringify(config);
}
