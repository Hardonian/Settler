/**
 * Compilation Context
 * Provides compilation mode and config state to React components
 */

import { createContext, useContext, ReactNode } from 'react';
import {
  CompilationContext as ProtocolCompilationContext,
  ReconciliationConfig,
  CompilationMode
} from '@settler/protocol';

const CompilationContext = createContext<ProtocolCompilationContext | null>(null);

export interface CompilationProviderProps {
  mode?: CompilationMode;
  config?: Partial<ReconciliationConfig>;
  children: ReactNode;
}

export function CompilationProvider({
  mode = 'ui',
  config = {},
  children
}: CompilationProviderProps) {
  const contextValue: ProtocolCompilationContext = {
    mode,
    config: config as Partial<ReconciliationConfig>,
    widgetRegistry: new Map()
  };

  return (
    <CompilationContext.Provider value={contextValue}>
      {children}
    </CompilationContext.Provider>
  );
}

export function useCompilationContext(): ProtocolCompilationContext {
  const context = useContext(CompilationContext);
  if (!context) {
    return {
      mode: 'ui',
      config: {},
      widgetRegistry: new Map()
    };
  }
  return context;
}
