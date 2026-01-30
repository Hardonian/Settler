/**
 * Responsive Utilities
 * Mobile-first responsive design helpers
 */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export interface BreakpointConfig {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
}
/**
 * Hook to get current breakpoint
 */
export declare function useBreakpoint(breakpoints?: BreakpointConfig): Breakpoint;
/**
 * Hook to check if current breakpoint matches
 */
export declare function useMediaQuery(query: string): boolean;
/**
 * Check if device is mobile
 */
export declare function useIsMobile(): boolean;
/**
 * Check if device is tablet
 */
export declare function useIsTablet(): boolean;
/**
 * Check if device is desktop
 */
export declare function useIsDesktop(): boolean;
/**
 * Get responsive grid columns
 */
export declare function getResponsiveColumns(breakpoint: Breakpoint): number;
//# sourceMappingURL=responsive.d.ts.map