/**
 * Compilation Context
 * Provides compilation mode and config state to React components
 */
import { ReactNode } from "react";
import { CompilationContext as ProtocolCompilationContext, ReconciliationConfig, CompilationMode } from "@settler/protocol";
export interface CompilationProviderProps {
    mode?: CompilationMode;
    config?: Partial<ReconciliationConfig>;
    children: ReactNode;
}
export declare function CompilationProvider({ mode, config, children, }: CompilationProviderProps): import("react/jsx-runtime").JSX.Element;
export declare function useCompilationContext(): ProtocolCompilationContext;
//# sourceMappingURL=context.d.ts.map