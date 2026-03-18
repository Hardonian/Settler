"use strict";
/**
 * Responsive Utilities
 * Mobile-first responsive design helpers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.useBreakpoint = useBreakpoint;
exports.useMediaQuery = useMediaQuery;
exports.useIsMobile = useIsMobile;
exports.useIsTablet = useIsTablet;
exports.useIsDesktop = useIsDesktop;
exports.getResponsiveColumns = getResponsiveColumns;
const react_1 = require("react");
const defaultBreakpoints = {
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
};
/**
 * Hook to get current breakpoint
 */
function useBreakpoint(breakpoints = defaultBreakpoints) {
    const [breakpoint, setBreakpoint] = (0, react_1.useState)('xs');
    (0, react_1.useEffect)(() => {
        const updateBreakpoint = () => {
            const width = window.innerWidth;
            if (width >= breakpoints['2xl']) {
                setBreakpoint('2xl');
            }
            else if (width >= breakpoints.xl) {
                setBreakpoint('xl');
            }
            else if (width >= breakpoints.lg) {
                setBreakpoint('lg');
            }
            else if (width >= breakpoints.md) {
                setBreakpoint('md');
            }
            else if (width >= breakpoints.sm) {
                setBreakpoint('sm');
            }
            else {
                setBreakpoint('xs');
            }
        };
        updateBreakpoint();
        window.addEventListener('resize', updateBreakpoint);
        return () => window.removeEventListener('resize', updateBreakpoint);
    }, [breakpoints]);
    return breakpoint;
}
/**
 * Hook to check if current breakpoint matches
 */
function useMediaQuery(query) {
    const [matches, setMatches] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        const mediaQuery = window.matchMedia(query);
        setMatches(mediaQuery.matches);
        const handler = (event) => {
            setMatches(event.matches);
        };
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [query]);
    return matches;
}
/**
 * Check if device is mobile
 */
function useIsMobile() {
    return useMediaQuery('(max-width: 768px)');
}
/**
 * Check if device is tablet
 */
function useIsTablet() {
    return useMediaQuery('(min-width: 769px) and (max-width: 1023px)');
}
/**
 * Check if device is desktop
 */
function useIsDesktop() {
    return useMediaQuery('(min-width: 1024px)');
}
/**
 * Get responsive grid columns
 */
function getResponsiveColumns(breakpoint) {
    const columns = {
        xs: 1,
        sm: 2,
        md: 3,
        lg: 4,
        xl: 4,
        '2xl': 5
    };
    return columns[breakpoint];
}
//# sourceMappingURL=responsive.js.map