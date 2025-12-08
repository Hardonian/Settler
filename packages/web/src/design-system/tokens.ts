/**
 * Design System Tokens
 * 
 * Centralized design tokens for consistent styling across the application.
 * These tokens are used to generate Tailwind CSS theme configuration
 * and provide type-safe design values.
 */

// Color Palette
export const colors = {
  // Primary Brand Colors
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  
  // Electric Accents
  electric: {
    cyan: '#06b6d4',
    purple: '#a855f7',
    neon: '#00ff88',
    blue: '#3b82f6',
    indigo: '#6366f1',
  },
  
  // Semantic Colors (HSL format for CSS variables)
  semantic: {
    background: { light: '0 0% 100%', dark: '222.2 84% 4.9%' },
    foreground: { light: '222.2 84% 4.9%', dark: '210 40% 98%' },
    card: { light: '0 0% 100%', dark: '222.2 84% 4.9%' },
    'card-foreground': { light: '222.2 84% 4.9%', dark: '210 40% 98%' },
    muted: { light: '210 40% 96.1%', dark: '217.2 32.6% 17.5%' },
    'muted-foreground': { light: '215.4 16.3% 46.9%', dark: '215 20.2% 65.1%' },
    accent: { light: '210 40% 96.1%', dark: '217.2 32.6% 17.5%' },
    'accent-foreground': { light: '222.2 47.4% 11.2%', dark: '210 40% 98%' },
    destructive: { light: '0 84.2% 60.2%', dark: '0 62.8% 30.6%' },
    'destructive-foreground': { light: '210 40% 98%', dark: '210 40% 98%' },
    border: { light: '214.3 31.8% 91.4%', dark: '217.2 32.6% 17.5%' },
    input: { light: '214.3 31.8% 91.4%', dark: '217.2 32.6% 17.5%' },
    ring: { light: '222.2 84% 4.9%', dark: '212.7 26.8% 83.9%' },
  },
} as const;

// Spacing Scale (4px base unit)
export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
  40: '10rem',    // 160px
  48: '12rem',    // 192px
  64: '16rem',    // 256px
} as const;

// Typography Scale
export const typography = {
  fontFamily: {
    sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
    mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
  },
  
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.05em' }],
    sm: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.025em' }],
    base: ['1rem', { lineHeight: '1.5rem', letterSpacing: '0' }],
    lg: ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em' }],
    xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em' }],
    '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.05em' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.05em' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.05em' }],
    '5xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.05em' }],
    '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.05em' }],
    '7xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.05em' }],
    '8xl': ['6rem', { lineHeight: '1', letterSpacing: '-0.05em' }],
    '9xl': ['8rem', { lineHeight: '1', letterSpacing: '-0.05em' }],
  },
  
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
} as const;

// Border Radius
export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  DEFAULT: '0.25rem', // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
} as const;

// Shadows
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: 'none',
} as const;

// Transitions
export const transitions = {
  duration: {
    fast: '150ms',
    DEFAULT: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  timing: {
    DEFAULT: 'ease-in-out',
    in: 'ease-in',
    out: 'ease-out',
    'in-out': 'ease-in-out',
  },
  property: {
    DEFAULT: 'all',
    colors: 'color, background-color, border-color',
    transform: 'transform',
    opacity: 'opacity',
  },
} as const;

// Breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Component-Specific Tokens
export const componentTokens = {
  button: {
    height: {
      sm: '2.25rem',   // 36px
      default: '2.5rem', // 40px
      lg: '2.75rem',   // 44px
      icon: '2.5rem',  // 40px
    },
    padding: {
      sm: '0.75rem 0.75rem',
      default: '0.625rem 1rem',
      lg: '0.625rem 2rem',
      icon: '0.625rem',
    },
  },
  
  input: {
    height: {
      default: '2.5rem', // 40px
      sm: '2.25rem',     // 36px
      lg: '2.75rem',     // 44px
    },
    padding: {
      default: '0.625rem 0.75rem',
    },
  },
  
  card: {
    padding: {
      default: '1.5rem',
      sm: '1rem',
      lg: '2rem',
    },
  },
  
  container: {
    maxWidth: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1400px',
      full: '100%',
    },
    padding: {
      mobile: '1rem',
      tablet: '1.5rem',
      desktop: '2rem',
    },
  },
  
  section: {
    padding: {
      mobile: '3rem 1rem',
      tablet: '4rem 1.5rem',
      desktop: '5rem 2rem',
    },
  },
} as const;

// Animation Tokens
export const animations = {
  fadeIn: {
    keyframes: {
      '0%': { opacity: '0' },
      '100%': { opacity: '1' },
    },
    duration: '0.5s',
    timing: 'ease-in-out',
  },
  slideUp: {
    keyframes: {
      '0%': { transform: 'translateY(20px)', opacity: '0' },
      '100%': { transform: 'translateY(0)', opacity: '1' },
    },
    duration: '0.5s',
    timing: 'ease-out',
  },
  glow: {
    keyframes: {
      '0%': { boxShadow: '0 0 5px rgba(6, 182, 212, 0.5), 0 0 10px rgba(6, 182, 212, 0.3)' },
      '100%': { boxShadow: '0 0 20px rgba(6, 182, 212, 0.8), 0 0 30px rgba(168, 85, 247, 0.5)' },
    },
    duration: '2s',
    timing: 'ease-in-out',
    iteration: 'infinite',
    direction: 'alternate',
  },
  float: {
    keyframes: {
      '0%, 100%': { transform: 'translateY(0px)' },
      '50%': { transform: 'translateY(-20px)' },
    },
    duration: '6s',
    timing: 'ease-in-out',
    iteration: 'infinite',
  },
} as const;

// Z-Index Scale
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;

// Export all tokens
export const tokens = {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  transitions,
  breakpoints,
  componentTokens,
  animations,
  zIndex,
} as const;

export type DesignTokens = typeof tokens;
